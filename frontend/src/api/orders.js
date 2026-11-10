import http from "./http.js";

export async function getOrders() {
    const response = await http.get("/orders");
    return response.data;
}

export async function getOrder(id) {
    const response = await http.get(`/orders/${id}`);
    return response.data;
}

export async function createOrder(addressId) {
    const response = await http.post("/orders", { address_id: addressId });
    return response.data;
}

export async function payOrder(id) {
    const response = await http.post(`/orders/${id}/pay`);
    return response.data;
}

export async function cancelOrder(id) {
    const response = await http.post(`/orders/${id}/cancel`);
    return response.data;
}

export async function getAdminOrders(filters = {}) {
    const response = await http.get("/admin/orders", { params: filters });
    return response.data;
}

export async function updateOrderStatus(id, status) {
    const response = await http.patch(`/admin/orders/${id}/status`, { status });
    return response.data;
}