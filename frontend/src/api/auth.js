import {
    register,
    login,
    getMe,
    logout,
} from "../../../api/auth.js";

import { setState } from "../../state.js";
import { loadCart } from "../cart/cart.js";

export async function registerUser(userData) {
    try {
        const response = await register(userData);

        setState({
            user: response.user,
            isAuthenticated: true,
            cart: response.cart,
        });

        return response;
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        throw error;
    }
}

export async function loginUser(credentials) {
    try {
        const response = await login(credentials);

        setState({
            user: response.user,
            isAuthenticated: true,
            cart: response.cart,
        });

        return response;
    } catch (error) {
        console.error("Erro ao realizar login:", error);
        throw error;
    }
}

export async function loadAuthenticatedUser() {
    try {
        const user = await getMe();

        setState({
            user,
            isAuthenticated: true,
        });

        return user;
    } catch (error) {
        console.error("Erro ao carregar usuário autenticado:", error);
        throw error;
    }
}

export async function logoutUser() {
    try {
        const response = await logout();

        setState({
            user: null,
            isAuthenticated: false,
            cart: null,
            orders: [],
        });

        return response;
    } catch (error) {
        console.error("Erro ao realizar logout:", error);
        throw error;
    }
}