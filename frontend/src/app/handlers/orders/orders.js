import {
    getOrders,
    getOrder,
    createOrder,
} from "../../../api/orders.js";

export async function loadOrders() {
    try {
        return await getOrders();
    } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        throw error;
    }
}

export async function loadOrder(id) {
    try {
        return await getOrder(id);
    } catch (error) {
        console.error("Erro ao carregar pedido:", error);
        throw error;
    }
}

export async function checkout() {
    try {
        return await createOrder();
    } catch (error) {
        console.error("Erro ao finalizar compra:", error);
        throw error;
    }
}