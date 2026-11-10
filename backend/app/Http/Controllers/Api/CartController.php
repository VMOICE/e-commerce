<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cartService
    ) {
    }

    private function currentCart(Request $request): Cart
    {
        $user = $request->user('web');
        $sessionId = $user === null ? $request->session()->getId() : null;

        return $this->cartService->resolveCart($user, $sessionId);
    }

    public function show(Request $request): JsonResponse
    {
        $cart = $this->currentCart($request);

        $cart = $this->cartService->getCart($cart);

        return response()->json([
            'data' => $cart,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'min:1'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $cart = $this->currentCart($request);

        $cart = $this->cartService->addItem(
            $cart,
            (int) $validated['product_id'],
            (int) $validated['quantity']
        );

        return response()->json([
            'message' => 'Produto adicionado ao carrinho.',
            'data' => $cart,
        ], 201);
    }

    public function update(
        Request $request,
        int $productId
    ): JsonResponse {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $cart = $this->currentCart($request);

        $cart = $this->cartService->updateItem(
            $cart,
            $productId,
            (int) $validated['quantity']
        );

        return response()->json([
            'message' => 'Quantidade atualizada.',
            'data' => $cart,
        ]);
    }

    public function destroy(
        Request $request,
        int $productId
    ): JsonResponse {
        $cart = $this->currentCart($request);

        $cart = $this->cartService->removeItem($cart, $productId);

        return response()->json([
            'message' => 'Produto removido do carrinho.',
            'data' => $cart,
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->currentCart($request);

        $cart = $this->cartService->clearCart($cart);

        return response()->json([
            'message' => 'Carrinho esvaziado.',
            'data' => $cart,
        ]);
    }
}