import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
} from "../../../api/cart.js";

export async function loadCart() {
    try {
        return await getCart();
    } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        throw error;
    }
}

export async function addProductToCart(productId, quantity = 1) {
    try {
        return await addToCart(productId, quantity);
    } catch (error) {
        console.error("Erro ao adicionar produto ao carrinho:", error);
        throw error;
    }
}

export async function changeCartItemQuantity(itemId, quantity) {
    try {
        return await updateCartItem(itemId, quantity);
    } catch (error) {
        console.error("Erro ao atualizar quantidade:", error);
        throw error;
    }
}

export async function removeProductFromCart(itemId) {
    try {
        return await removeCartItem(itemId);
    } catch (error) {
        console.error("Erro ao remover produto do carrinho:", error);
        throw error;
    }
}

export async function emptyCart() {
    try {
        return await clearCart();
    } catch (error) {
        console.error("Erro ao limpar carrinho:", error);
        throw error;
    }
}