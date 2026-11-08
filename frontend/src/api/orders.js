import http from "./http.js";

export async function getOrders() {
    const response = await http.get("/orders");
    return response.data;
}

export async function getOrder(id) {
    const response = await http.get(`/orders/${id}`);
    return response.data;
}

export async function createOrder() {
    const response = await http.post("/orders");
    return response.data;
}