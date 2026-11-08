import http from "./http.js";

export async function getCart() {
    const response = await http.get("/cart");
    return response.data;
}

export async function addToCart(productId, quantity = 1) {
    const response = await http.post("/cart/items", {
        product_id: productId,
        quantity,
    });

    return response.data;
}

export async function updateCartItem(itemId, quantity) {
    const response = await http.put(`/cart/items/${itemId}`, {
        quantity,
    });

    return response.data;
}

export async function removeCartItem(itemId) {
    const response = await http.delete(`/cart/items/${itemId}`);
    return response.data;
}

export async function clearCart() {
    const response = await http.delete("/cart");
    return response.data;
}