import http from "./http.js";

function handleCartResponse(response) {
    return response.data.data;
}

export async function getCart() {
    const response = await http.get("/cart");

    return handleCartResponse(response);
}

export async function addToCart(productId, quantity = 1) {
    const response = await http.post("/cart/items", {
        product_id: productId,
        quantity,
    });

    return handleCartResponse(response);
}

export async function updateCartItem(productId, quantity) {
    const response = await http.patch(`/cart/items/${productId}`, {
        quantity,
    });

    return handleCartResponse(response);
}

export async function removeCartItem(productId) {
    const response = await http.delete(`/cart/items/${productId}`);

    return handleCartResponse(response);
}
