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

    /**
     * Mescla o carrinho de visitante com o carrinho do usuário.
     *
     * Produtos indisponíveis são removidos e quantidades acima
     * do estoque são ajustadas. Os ajustes são informados ao usuário.
     */
    public function mergeGuestCart(
        User $user,
        ?string $guestToken
    ): array {
        return DB::transaction(function () use ($user, $guestToken) {

            // Localiza o carrinho do usuário.
            $userCart = Cart::firstOrCreate(
                ['user_id' => $user->id],
                ['guest_token_hash' => null]
            );

            $userCart = Cart::whereKey($userCart->id)
                ->lockForUpdate()
                ->firstOrFail();

            $warnings = [];

            // Sem token, não existe carrinho de visitante para mesclar.
            if ($guestToken === null || $guestToken === '') {
                return [
                    'cart' => $this->getCart($userCart),
                    'warnings' => $warnings,
                ];
            }

            // Localiza o carrinho usando o hash do token.
            $guestCart = Cart::where(
                'guest_token_hash',
                hash('sha256', $guestToken)
            )
                ->lockForUpdate()
                ->first();

            if ($guestCart === null) {
                return [
                    'cart' => $this->getCart($userCart),
                    'warnings' => $warnings,
                ];
            }

            // Percorre os produtos do carrinho de visitante.
            $guestItems = $guestCart->items()
                ->lockForUpdate()
                ->get();

            foreach ($guestItems as $guestItem) {

                // Bloqueia o produto durante a verificação do estoque.
                $product = Product::whereKey($guestItem->product_id)
                    ->lockForUpdate()
                    ->first();

                // Produto indisponível.
                if (
                    $product === null ||
                    !$product->is_active ||
                    $product->stock < 1
                ) {
                    $warnings[] = "O produto {$guestItem->product_id} foi removido porque está indisponível.";

                    $guestItem->delete();

                    continue;
                }

                // Verifica se o produto já existe no carrinho do usuário.
                $userItem = CartItem::where('cart_id', $userCart->id)
                    ->where('product_id', $product->id)
                    ->lockForUpdate()
                    ->first();

                $currentQuantity = $userItem?->quantity ?? 0;

                $newQuantity = $currentQuantity + $guestItem->quantity;

                // Ajusta a quantidade caso ultrapasse o estoque.
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

                // Remove o item do carrinho de visitante.
                $guestItem->delete();
            }

            // Invalida o carrinho de visitante após a transferência.
            $guestCart->delete();

            return [
                'cart' => $this->getCart($userCart),
                'warnings' => $warnings,
            ];
           });
    }
}