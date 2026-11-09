import http from "./http.js";

// Processa a resposta e armazena o token do visitante, quando fornecido.
function handleCartResponse(response) {
    const { guest_token } = response.data;

    if (guest_token) {
        localStorage.setItem("guest_cart_token", guest_token);
    }

    return response.data.data;
}

// Busca o carrinho atual.
export async function getCart() {
    const response = await http.get("/cart");

    return handleCartResponse(response);
}

// Adiciona um produto ao carrinho.
export async function addToCart(productId, quantity = 1) {
    const response = await http.post("/cart/items", {
        product_id: productId,
        quantity,
    });

    return handleCartResponse(response);
}

// Atualiza a quantidade de um produto.
export async function updateCartItem(productId, quantity) {
    const response = await http.patch(`/cart/items/${productId}`, {
        quantity,
    });

    return handleCartResponse(response);
}

// Remove um produto do carrinho.
export async function removeCartItem(productId) {
    const response = await http.delete(`/cart/items/${productId}`);

    return handleCartResponse(response);
}

// Esvazia o carrinho.
export async function clearCart() {
    const response = await http.delete("/cart");

    return handleCartResponse(response);
}