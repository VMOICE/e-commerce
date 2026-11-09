import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
} from "../../../api/cart.js";

import { setState } from "../../state.js";

// Carrega o carrinho atual.
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

// Adiciona um produto ao carrinho.
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

// Atualiza a quantidade de um produto.
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

// Remove um produto do carrinho.
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

// Esvazia o carrinho.
export async function emptyCart() {
    try {
        const cart = await clearCart();

        setState({ cart });

        return cart;
    } catch (error) {
        console.error("Erro ao limpar carrinho:", error);
        throw error;
    }
}