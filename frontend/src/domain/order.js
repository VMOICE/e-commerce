const ORDER_STATUSES = {
    pending: "Pendente",
    paid: "Pago",
    processing: "Em processamento",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
};

export function getOrderStatusLabel(status) {
    return ORDER_STATUSES[status] ?? "Status desconhecido";
}

export function isOrderCancelled(order) {
    return order?.status === "cancelled";
}

export function isOrderCompleted(order) {
    return order?.status === "delivered";
}

export function getOrderTotal(order) {
    if (!order || order.total === undefined || order.total === null) {
        return 0;
    }

    return Number(order.total);
}