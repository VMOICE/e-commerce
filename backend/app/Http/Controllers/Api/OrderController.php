<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Address;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function index(
        Request $request,
        OrderService $orderService
    ): AnonymousResourceCollection {
        $orders = $orderService->getUserOrders($request->user());

        return OrderResource::collection($orders);
    }

    public function show(
        Request $request,
        int $id,
        OrderService $orderService
    ): OrderResource {
        $order = $orderService->findUserOrder($request->user(), $id);

        return new OrderResource($order);
    }

    public function store(
        Request $request,
        OrderService $orderService
    ): JsonResponse {
        $validated = $request->validate([
            'address_id' => [
                'required',
                'integer',
                'exists:addresses,id,user_id,' . $request->user()->id,
            ],
        ]);
        $address = Address::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($validated['address_id']);
        $order = $orderService->createFromCart($request->user(), $address);

        return response()->json([
            'message' => 'Pedido criado com sucesso.',
            'data' => new OrderResource($order),
        ], 201);
    }

    public function adminIndex(
        Request $request,
        OrderService $orderService
    ): AnonymousResourceCollection {
        $validated = $request->validate([
            'status' => [
                'sometimes',
                'in:pending,paid,shipped,delivered,cancelled',
            ],
        ]);
        $orders = $orderService->getFilteredOrders($validated['status'] ?? null);

        return OrderResource::collection($orders);
    }

    public function pay(
        Request $request,
        int $id,
        OrderService $orderService
    ): JsonResponse {
        $order = Order::findOrFail($id);
        $paidOrder = $orderService->pay($order, $request->user());

        return response()->json([
            'message' => 'Pagamento simulado confirmado.',
            'data' => new OrderResource($paidOrder),
        ]);
    }

    public function cancel(
        Request $request,
        int $id,
        OrderService $orderService
    ): JsonResponse {
        $order = Order::findOrFail($id);
        $cancelledOrder = $orderService->cancel($order, $request->user());

        return response()->json([
            'message' => 'Pedido cancelado e estoque devolvido.',
            'data' => new OrderResource($cancelledOrder),
        ]);
    }

    public function adminShow(
        int $id,
        OrderService $orderService
    ): OrderResource {
        $order = $orderService->findOrder($id);

        return new OrderResource($order);
    }

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