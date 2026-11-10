import http, { initializeCsrfCookie } from "./http.js";

// Cadastra um novo usuário.
export async function register(userData) {
    await initializeCsrfCookie();
    const response = await http.post("/register", userData);

    localStorage.removeItem("guest_cart_token");

    return response.data;
}

// Realiza o login.
export async function login(credentials) {
    await initializeCsrfCookie();
    const response = await http.post("/login", credentials);

    localStorage.removeItem("guest_cart_token");

    return response.data;
}

// Recupera os dados do usuário autenticado.
export async function getMe() {
    const response = await http.get("/me");

    return response.data.user;
}

// Realiza o logout.
export async function logout() {
    await initializeCsrfCookie();
    const response = await http.post("/logout");

    localStorage.removeItem("guest_cart_token");

    return response.data;
}