<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
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
     * Exibe os detalhes de um pedido específico do cliente.
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
     * Cria um pedido a partir do carrinho do cliente.
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

    /**
     * Lista todos os pedidos para o administrador.
     */
    public function adminIndex(
        OrderService $orderService
    ): AnonymousResourceCollection {
        $orders = $orderService->getAllOrders();

        return OrderResource::collection($orders);
    }

    /**
     * Exibe os detalhes de qualquer pedido para o administrador.
     */
    public function adminShow(
        int $id,
        OrderService $orderService
    ): OrderResource {
        $order = $orderService->findOrder($id);

        return new OrderResource($order);
    }

    /**
     * Atualiza o status de um pedido pelo administrador.
     */
    public function updateStatus(
        UpdateOrderStatusRequest $request,
        Order $order,
        OrderService $orderService
    ): JsonResponse {
        $updatedOrder = $orderService->updateStatus(
            $order,
            $request->validated('status')
        );

        return response()->json([
            'message' => 'Status do pedido atualizado com sucesso.',
            'data' => new OrderResource($updatedOrder),
        ]);
    }
}