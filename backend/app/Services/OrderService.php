<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class OrderService
{
    public function createFromCart(User $user, Address $address): Order
    {
        return DB::transaction(function () use ($user, $address) {

            $cart = Cart::where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (!$cart) {
                throw ValidationException::withMessages([
                    'cart' => 'Carrinho não encontrado.',
                ]);
            }

            $cartItems = CartItem::where('cart_id', $cart->id)
                ->lockForUpdate()
                ->get();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Não é possível finalizar um carrinho vazio.',
                ]);
            }

            $subtotalCents = 0;
            $orderItems = [];
            $products = [];

            foreach ($cartItems as $cartItem) {

                $product = Product::whereKey($cartItem->product_id)
                    ->lockForUpdate()
                    ->first();

                if (
                    !$product ||
                    !$product->is_active ||
                    $product->stock < $cartItem->quantity
                ) {
                    $productName = $product?->name ?? "ID {$cartItem->product_id}";

                    throw ValidationException::withMessages([
                        'stock' => "O produto {$productName} está indisponível ou não possui estoque suficiente.",
                    ]);
                }

                $unitPriceCents = $this->priceToCents($product->price);

                $subtotalCents += $unitPriceCents * $cartItem->quantity;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'unit_price' => $product->price,
                    'quantity' => $cartItem->quantity,
                ];

                $products[] = [
                    'product' => $product,
                    'quantity' => $cartItem->quantity,
                ];
            }

            $shippingCostCents = 0;
            $totalCents = $subtotalCents + $shippingCostCents;

            $order = Order::create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'shipping_address' => [
                    'recipient_name' => $address->recipient_name,
                    'postal_code' => $address->postal_code,
                    'street' => $address->street,
                    'number' => $address->number,
                    'complement' => $address->complement,
                    'neighborhood' => $address->neighborhood,
                    'city' => $address->city,
                    'state' => $address->state,
                ],
                'status' => 'pending',
                'subtotal' => $this->centsToPrice($subtotalCents),
                'shipping_cost' => $this->centsToPrice($shippingCostCents),
                'total' => $this->centsToPrice($totalCents),
            ]);

            $order->items()->createMany($orderItems);

            foreach ($products as $item) {
                $item['product']->decrement('stock', $item['quantity']);
            }

            $cart->items()->delete();

            return $order->load(['items', 'address']);
        });
    }

    public function getUserOrders(User $user)
    {
        return Order::where('user_id', $user->id)
            ->with('items')
            ->latest()
            ->paginate(10);
    }

    public function getFilteredOrders(?string $status): LengthAwarePaginator
    {
        return Order::query()
            ->with(['user', 'items'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(15);
    }

    public function findUserOrder(User $user, int $orderId): Order
    {
        return Order::where('user_id', $user->id)
            ->with(['items', 'address'])
            ->findOrFail($orderId);
    }

    public function findOrder(int $orderId): Order
    {
        return Order::with(['user', 'items'])
            ->findOrFail($orderId);
    }

    public function updateStatus(Order $order, string $newStatus): Order
    {
        return DB::transaction(function () use ($order, $newStatus) {

            $lockedOrder = Order::whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $transitions = [
                'pending' => ['paid', 'cancelled'],
                'paid' => ['shipped'],
                'shipped' => ['delivered'],
                'delivered' => [],
                'cancelled' => [],
            ];

            $allowedStatuses = $transitions[$lockedOrder->status] ?? [];

            if (!in_array($newStatus, $allowedStatuses, true)) {
                throw new ConflictHttpException(
                    'Não é permitida a transição de '
                        . $lockedOrder->status
                        . ' para '
                        . $newStatus
                        . '.'
                );
            }

            // Devolve os produtos ao estoque quando o pedido é cancelado.
            if ($newStatus === 'cancelled') {

                $items = $lockedOrder->items()
                    ->orderBy('product_id')
                    ->lockForUpdate()
                    ->get();

                foreach ($items as $item) {

                    // Produtos excluídos não possuem mais registro para reposição.
                    if (!$item->product_id) {
                        continue;
                    }

                    $product = Product::whereKey($item->product_id)
                        ->lockForUpdate()
                        ->first();

                    if ($product) {
                        $product->increment('stock', $item->quantity);
                    }
                }
            }

            $lockedOrder->update([
                'status' => $newStatus,
                'paid_at' => $newStatus === 'paid' ? now() : $lockedOrder->paid_at,
            ]);

            return $lockedOrder->load('items');
        });
    }

    public function pay(Order $order, User $user): Order
    {
        if ($order->user_id !== $user->id) {
            abort(403);
        }

        return $this->updateStatus($order, 'paid');
    }

    public function cancel(Order $order, User $user): Order
    {
        if ($order->user_id !== $user->id) {
            abort(404);
        }

        return $this->updateStatus($order, 'cancelled');
    }

    private function priceToCents(string $price): int
    {
        [$whole, $fraction] = array_pad(
            explode('.', $price, 2),
            2,
            '00'
        );

        return ((int) $whole * 100)
            + (int) str_pad(substr($fraction, 0, 2), 2, '0');
    }

    private function centsToPrice(int $cents): string
    {
        return intdiv($cents, 100)
            . '.'
            . str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}