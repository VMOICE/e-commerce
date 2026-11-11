import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
} from "../../api/cart.js";

import { setState } from "../state.js";

export async function loadCart() {
    try {
        const cart = await getCart();

        setState({ cart });

        return cart;
    } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        throw error;
    }
}

export async function addProductToCart(productId, quantity = 1) {
    try {
        const cart = await addToCart(productId, quantity);

        setState({ cart });

        return cart;
    } catch (error) {
        console.error("Erro ao adicionar produto ao carrinho:", error);
        throw error;
    }
}

export async function changeCartItemQuantity(productId, quantity) {
    try {
        const cart = await updateCartItem(productId, quantity);

        setState({ cart });

        return cart;
    } catch (error) {
        console.error("Erro ao atualizar quantidade:", error);
        throw error;
    }
}

export async function removeProductFromCart(productId) {
    try {
        const cart = await removeCartItem(productId);

        setState({ cart });

        return cart;
    } catch (error) {
        console.error("Erro ao remover produto do carrinho:", error);
        throw error;
    }
}
