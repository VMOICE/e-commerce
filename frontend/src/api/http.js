import axios from "axios";

const API_BASE_URL = import.meta.env.DEV
    ? "/api"
    : "http://localhost:8081/api";
const CSRF_COOKIE_URL = import.meta.env.DEV
    ? "/sanctum/csrf-cookie"
    : API_BASE_URL.replace(/\/api\/?$/, "/sanctum/csrf-cookie");

const http = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

export async function initializeCsrfCookie() {
    await http.get(CSRF_COOKIE_URL);
}

http.interceptors.request.use((config) => {
    const guestToken = localStorage.getItem("guest_cart_token");

    if (guestToken) {
        config.headers["X-Guest-Cart-Token"] = guestToken;
    }

    return config;
});

export default http;
