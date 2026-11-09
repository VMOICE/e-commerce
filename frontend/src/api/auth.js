import http from "./http.js";

// Cadastra um novo usuário.
export async function register(userData) {
    const response = await http.post("/register", userData);

    const { token } = response.data;

    localStorage.setItem("auth_token", token);
    localStorage.removeItem("guest_cart_token");

    return response.data;
}

// Realiza o login.
export async function login(credentials) {
    const response = await http.post("/login", credentials);

    const { token } = response.data;

    localStorage.setItem("auth_token", token);
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
    const response = await http.post("/logout");

    localStorage.removeItem("auth_token");
    localStorage.removeItem("guest_cart_token");

    return response.data;
}