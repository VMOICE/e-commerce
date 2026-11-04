<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Cria um pedido utilizando os produtos do carrinho do cliente.
     */
    public function createFromCart(User $user): Order
    {
        return DB::transaction(function () use ($user) {

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
                    throw ValidationException::withMessages([
                        'stock' => "O produto {$cartItem->product_id} está indisponível ou não possui estoque suficiente.",
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

            return $order->load('items');
        });
    }

    /**
     * Converte um valor decimal em centavos inteiros.
     */
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

    /**
     * Converte centavos inteiros em uma representação decimal.
     */
    private function centsToPrice(int $cents): string
    {
        return intdiv($cents, 100)
            . '.'
            . str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }

    /**
     * Retorna os pedidos do cliente autenticado.
     */
    public function getUserOrders(User $user)
    {
        return Order::where('user_id', $user->id)
            ->with('items')
            ->latest()
            ->paginate(10);
    }

    /**
     * Retorna um pedido específico do cliente autenticado.
     */
    public function findUserOrder(User $user, int $orderId): Order
    {
        return Order::where('user_id', $user->id)
            ->with('items')
            ->findOrFail($orderId);
    }
}