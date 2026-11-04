<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    /**
     * Lista os pedidos do cliente autenticado.
     */
    public function index(
        Request $request,
        OrderService $orderService
    ): AnonymousResourceCollection {
        $orders = $orderService->getUserOrders($request->user());

        return OrderResource::collection($orders);
    }

    /**
     * Exibe os detalhes de um pedido específico.
     */
    public function show(
        Request $request,
        int $id,
        OrderService $orderService
    ): OrderResource {
        $order = $orderService->findUserOrder($request->user(), $id);

        return new OrderResource($order);
    }

    /**
     * Cria um pedido a partir do carrinho do cliente autenticado.
     */
    public function store(
        Request $request,
        OrderService $orderService
    ): JsonResponse {
        $order = $orderService->createFromCart($request->user());

        return response()->json([
            'message' => 'Pedido criado com sucesso.',
            'data' => new OrderResource($order),
        ], 201);
    }
}