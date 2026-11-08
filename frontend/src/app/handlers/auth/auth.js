import {
    register,
    login,
    getMe,
    logout,
} from "../../../api/auth.js";

export async function registerUser(userData) {
    try {
        return await register(userData);
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        throw error;
    }
}

export async function loginUser(credentials) {
    try {
        return await login(credentials);
    } catch (error) {
        console.error("Erro ao realizar login:", error);
        throw error;
    }
}

export async function loadAuthenticatedUser() {
    try {
        return await getMe();
    } catch (error) {
        console.error("Erro ao carregar usuário autenticado:", error);
        throw error;
    }
}

export async function logoutUser() {
    try {
        return await logout();
    } catch (error) {
        console.error("Erro ao realizar logout:", error);
        throw error;
    }
}