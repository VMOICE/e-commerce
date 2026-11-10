import http, { initializeCsrfCookie } from "./http.js";

export async function register(userData) {
    await initializeCsrfCookie();
    const response = await http.post("/register", userData);

    return response.data;
}

export async function login(credentials) {
    await initializeCsrfCookie();
    const response = await http.post("/login", credentials);

    return response.data;
}

export async function getMe() {
    const response = await http.get("/me");

    return response.data.user;
}

export async function updateMe(profile) {
    const response = await http.patch("/me", profile);
    return response.data;
}

export async function logout() {
    await initializeCsrfCookie();
    const response = await http.post("/logout");

    return response.data;
}