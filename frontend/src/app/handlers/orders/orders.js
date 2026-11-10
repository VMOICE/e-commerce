import {
    getOrders,
    getOrder,
    createOrder,
    payOrder,
    cancelOrder,
} from "../../../api/orders.js";

import { setState } from "../../state.js";

export async function loadOrders() {
    try {
        const response = await getOrders();

        const orders = response.data;

        setState({ orders });

        return orders;
    } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        throw error;
    }
}

export async function loadOrder(id) {
    try {
        const response = await getOrder(id);

        return response.data;
    } catch (error) {
        console.error("Erro ao carregar pedido:", error);
        throw error;
    }
}

export async function checkout(addressId) {
    try {
        const response = await createOrder(addressId);

        const order = response.data;

        await loadOrders();

        setState({
            cart: null,
        });

        return order;
    } catch (error) {
        console.error("Erro ao finalizar compra:", error);
        throw error;
    }

}

export async function confirmOrderPayment(id) {
    const response = await payOrder(id);
    await loadOrders();
    return response.data;
}

export async function cancelCustomerOrder(id) {
    const response = await cancelOrder(id);
    await loadOrders();
    return response.data;
}