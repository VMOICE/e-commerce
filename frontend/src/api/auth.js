import http from "./http.js";

/**
 * Registra um novo cliente.
 */
export async function register(userData) {
    const response = await http.post("/register", userData);

    const { token } = response.data;

    localStorage.setItem("auth_token", token);

    // O carrinho de visitante já foi integrado à conta.
    localStorage.removeItem("guest_cart_token");

    return response.data;
}

/**
 * Realiza o login do cliente.
 */
export async function login(credentials) {
    const response = await http.post("/login", credentials);

    const { token } = response.data;

    localStorage.setItem("auth_token", token);

    // O carrinho de visitante já foi integrado à conta.
    localStorage.removeItem("guest_cart_token");

    return response.data;
}

/**
 * Consulta os dados do usuário autenticado.
 */
export async function getMe() {
    const response = await http.get("/me");

    return response.data.user;
}

/**
 * Encerra a sessão do usuário.
 */
export async function logout() {
    const response = await http.post("/logout");

    localStorage.removeItem("auth_token");
    localStorage.removeItem("guest_cart_token");

    return response.data;
}