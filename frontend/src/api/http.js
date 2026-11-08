import axios from "axios";

const http = axios.create({
    baseURL: "http://localhost:8081/api",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Adiciona automaticamente os dados de autenticação.
http.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    const guestToken = localStorage.getItem("guest_cart_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (guestToken) {
        config.headers["X-Guest-Cart-Token"] = guestToken;
    }

    return config;
});

export default http;