<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cartService
    ) {
    }

    private function currentCart(Request $request): array
    {
        $user = $request->user('web');

        $guestToken = $user === null
            ? $request->header('X-Guest-Cart-Token')
            : null;

        [$cart, $newToken] = $this->cartService->resolveCart(
            $user,
            $guestToken
        );

        return [$cart, $newToken];
    }

    public function show(Request $request): JsonResponse
    {
        [$cart, $newToken] = $this->currentCart($request);

        $cart = $this->cartService->getCart($cart);

        return response()->json([
            'data' => $cart,
            'guest_token' => $newToken,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'min:1'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        [$cart, $newToken] = $this->currentCart($request);

        $cart = $this->cartService->addItem(
            $cart,
            (int) $validated['product_id'],
            (int) $validated['quantity']
        );

        return response()->json([
            'message' => 'Produto adicionado ao carrinho.',
            'data' => $cart,
            'guest_token' => $newToken,
        ], 201);
    }

    public function update(
        Request $request,
        int $productId
    ): JsonResponse {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        [$cart, $newToken] = $this->currentCart($request);

        $cart = $this->cartService->updateItem(
            $cart,
            $productId,
            (int) $validated['quantity']
        );

        return response()->json([
            'message' => 'Quantidade atualizada.',
            'data' => $cart,
            'guest_token' => $newToken,
        ]);
    }

    public function destroy(
        Request $request,
        int $productId
    ): JsonResponse {
        [$cart, $newToken] = $this->currentCart($request);

        $cart = $this->cartService->removeItem($cart, $productId);

        return response()->json([
            'message' => 'Produto removido do carrinho.',
            'data' => $cart,
            'guest_token' => $newToken,
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        [$cart, $newToken] = $this->currentCart($request);

        $cart = $this->cartService->clearCart($cart);

        return response()->json([
            'message' => 'Carrinho esvaziado.',
            'data' => $cart,
            'guest_token' => $newToken,
        ]);
    }
}