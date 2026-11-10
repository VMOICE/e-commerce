<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class CartService
{
    /**
     * Localiza ou cria o carrinho do usuário ou visitante.
     *
     * O carrinho de visitante é associado ao identificador da sessão;
     * o banco armazena somente o hash desse identificador.
     */
    public function resolveCart(?User $user, ?string $sessionId): Cart
    {
        if ($user !== null) {
            return Cart::firstOrCreate(
                ['user_id' => $user->id],
                ['guest_session_hash' => null]
            );
        }

        if ($sessionId === null || $sessionId === '') {
            throw new InvalidArgumentException('Um carrinho de visitante exige uma sessão ativa.');
        }

        return Cart::firstOrCreate(
            ['guest_session_hash' => hash('sha256', $sessionId)],
            ['user_id' => null]
        );
    }

    public function getCart(Cart $cart): Cart
    {
        $cart->load('items.product.category');
        $subtotalCents = 0;

        foreach ($cart->items as $item) {
            $price = $item->product?->price;

            if ($price === null) {
                continue;
            }

            $unitPriceCents = $this->priceToCents((string) $price);
            $itemSubtotalCents = $unitPriceCents * $item->quantity;
            $item->setAttribute('subtotal', $this->centsToPrice($itemSubtotalCents));
            $subtotalCents += $itemSubtotalCents;
        }

        $cart->setAttribute('subtotal', $this->centsToPrice($subtotalCents));
        $cart->setAttribute('total', $this->centsToPrice($subtotalCents));

        return $cart;
    }

    public function addItem(Cart $cart, int $productId, int $quantity): Cart
    {
        DB::transaction(function () use ($cart, $productId, $quantity) {
            $product = Product::whereKey($productId)
                ->lockForUpdate()
                ->first();

            if ($product === null || !$product->is_active) {
                throw ValidationException::withMessages([
                    'product_id' => 'O produto não está disponível.',
                ]);
            }

            if ($product->stock < 1) {
                throw ValidationException::withMessages([
                    'quantity' => 'Este produto está sem estoque.',
                ]);
            }

            $item = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $product->id)
                ->lockForUpdate()
                ->first();

            $newQuantity = ($item?->quantity ?? 0) + $quantity;

            if ($newQuantity > $product->stock) {
                throw ValidationException::withMessages([
                    'quantity' => "Estoque disponível: {$product->stock}.",
                ]);
            }

            if ($item !== null) {
                $item->update(['quantity' => $newQuantity]);
            } else {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $product->id,
                    'quantity' => $newQuantity,
                ]);
            }
        });

        return $this->getCart($cart);
    }

    public function updateItem(
        Cart $cart,
        int $productId,
        int $quantity
    ): Cart {
        DB::transaction(function () use ($cart, $productId, $quantity) {
            $item = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            if ($item === null) {
                throw new ModelNotFoundException(
                    'Produto não encontrado no carrinho.'
                );
            }

            $product = Product::whereKey($productId)
                ->lockForUpdate()
                ->first();

            if (
                $product === null ||
                !$product->is_active ||
                $quantity > $product->stock
            ) {
                throw ValidationException::withMessages([
                    'quantity' => 'Quantidade indisponível em estoque.',
                ]);
            }

            $item->update(['quantity' => $quantity]);
        });

        return $this->getCart($cart);
    }

    public function removeItem(Cart $cart, int $productId): Cart
    {
        CartItem::where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->delete();

        return $this->getCart($cart);
    }

    public function clearCart(Cart $cart): Cart
    {
        $cart->items()->delete();

        return $this->getCart($cart);
    }

    /**
     * Mescla o carrinho de visitante com o carrinho do usuário.
     *
     * Produtos indisponíveis são removidos e quantidades acima
     * do estoque são ajustadas. Os ajustes são informados ao usuário.
     */
    public function mergeGuestCart(
        User $user,
        ?string $sessionId
    ): array {
        return DB::transaction(function () use ($user, $sessionId) {

            $userCart = Cart::firstOrCreate(
                ['user_id' => $user->id],
                ['guest_session_hash' => null]
            );

            $userCart = Cart::whereKey($userCart->id)
                ->lockForUpdate()
                ->firstOrFail();

            $warnings = [];

            if ($sessionId === null || $sessionId === '') {
                return [
                    'cart' => $this->getCart($userCart),
                    'warnings' => $warnings,
                ];
            }

            $guestCart = Cart::where(
                'guest_session_hash',
                hash('sha256', $sessionId)
            )
                ->lockForUpdate()
                ->first();

            if ($guestCart === null) {
                return [
                    'cart' => $this->getCart($userCart),
                    'warnings' => $warnings,
                ];
            }

            $guestItems = $guestCart->items()
                ->lockForUpdate()
                ->get();

            foreach ($guestItems as $guestItem) {

                $product = Product::whereKey($guestItem->product_id)
                    ->lockForUpdate()
                    ->first();

                if (
                    $product === null ||
                    !$product->is_active ||
                    $product->stock < 1
                ) {
                    $warnings[] = "O produto {$guestItem->product_id} foi removido porque está indisponível.";

                    $guestItem->delete();

                    continue;
                }

                $userItem = CartItem::where('cart_id', $userCart->id)
                    ->where('product_id', $product->id)
                    ->lockForUpdate()
                    ->first();

                $currentQuantity = $userItem?->quantity ?? 0;

                $newQuantity = $currentQuantity + $guestItem->quantity;

                if ($newQuantity > $product->stock) {
                    $newQuantity = $product->stock;

                    $warnings[] = "A quantidade do produto {$product->name} foi ajustada ao estoque disponível.";
                }

                if ($userItem !== null) {
                    $userItem->update([
                        'quantity' => $newQuantity,
                    ]);
                } else {
                    CartItem::create([
                        'cart_id' => $userCart->id,
                        'product_id' => $product->id,
                        'quantity' => $newQuantity,
                    ]);
                }

                $guestItem->delete();
            }

            $guestCart->delete();

            return [
                'cart' => $this->getCart($userCart),
                'warnings' => $warnings,
            ];
           });
    }

    private function priceToCents(string $price): int
    {
        [$whole, $fraction] = array_pad(explode('.', $price, 2), 2, '00');

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