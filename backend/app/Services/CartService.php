<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    /**
     * Localiza ou cria o carrinho do usuário ou visitante.
     *
     * Para visitantes, retorna um token bruto somente quando
     * um novo carrinho é criado. O banco armazena apenas seu hash.
     */
    public function resolveCart(?User $user, ?string $guestToken): array
    {
        if ($user !== null) {
            $cart = Cart::firstOrCreate(
                ['user_id' => $user->id],
                ['guest_token_hash' => null]
            );

            return [$cart, null];
        }

        if ($guestToken !== null && $guestToken !== '') {
            $cart = Cart::where(
                'guest_token_hash',
                hash('sha256', $guestToken)
            )->first();

            if ($cart !== null) {
                return [$cart, null];
            }
        }

        $newToken = bin2hex(random_bytes(32));

        $cart = Cart::create([
            'user_id' => null,
            'guest_token_hash' => hash('sha256', $newToken),
        ]);

        return [$cart, $newToken];
    }

    /**
     * Retorna o carrinho com seus produtos.
     */
    public function getCart(Cart $cart): Cart
    {
        return $cart->load('items.product.category');
    }

    /**
     * Adiciona um produto ou aumenta sua quantidade.
     */
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

    /**
     * Define a quantidade de um produto já presente no carrinho.
     */
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

    /**
     * Remove um produto do carrinho.
     */
    public function removeItem(Cart $cart, int $productId): Cart
    {
        CartItem::where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->delete();

        return $this->getCart($cart);
    }

    /**
     * Remove todos os produtos do carrinho.
     */
    public function clearCart(Cart $cart): Cart
    {
        $cart->items()->delete();

        return $this->getCart($cart);
    }
}