import {
    getOrders,
    getOrder,
    createOrder,
} from "../../../api/orders.js";

import { setState } from "../../state.js";

// Carrega os pedidos do cliente autenticado.
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

// Carrega os detalhes de um pedido específico.
export async function loadOrder(id) {
    try {
        const response = await getOrder(id);

        return response.data;
    } catch (error) {
        console.error("Erro ao carregar pedido:", error);
        throw error;
    }
}

// Finaliza a compra e atualiza os dados da aplicação.
export async function checkout() {
    try {
        const response = await createOrder();

        const order = response.data;

        // Atualiza a lista de pedidos.
        await loadOrders();

        // Limpa o carrinho após a compra.
        setState({
            cart: null,
        });

        return order;
    } catch (error) {
        console.error("Erro ao finalizar compra:", error);
        throw error;
    }
}