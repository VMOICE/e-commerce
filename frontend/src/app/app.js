import { getState, setState } from "./state.js";

import { loadProducts } from "./handlers/products/products.js";
import { loadCategories } from "./handlers/categories/categories.js";
import { loadCart } from "./handlers/cart/cart.js";
import { loadAuthenticatedUser } from "./handlers/auth/auth.js";
import { loadOrders } from "./handlers/orders/orders.js";

export async function initializeApp() {
    setState({
        loading: true,
        error: null,
    });

    try {
        // Carrega os dados públicos do catálogo.
        await Promise.all([
            loadProducts(),
            loadCategories(),
        ]);

        // Verifica se existe um token de autenticação.
        const token = localStorage.getItem("auth_token");

        if (token) {
            try {
                // Valida a sessão e carrega o usuário.
                await loadAuthenticatedUser();
            } catch (error) {
                // Trata especificamente tokens expirados ou inválidos.
                if (error.response?.status !== 401) {
                    throw error;
                }

                localStorage.removeItem("auth_token");

                setState({
                    user: null,
                    isAuthenticated: false,
                    orders: [],
                });
            }
        }

        // Carrega os dados conforme o estado da autenticação.
        if (localStorage.getItem("auth_token")) {
            await Promise.all([
                loadCart(),
                loadOrders(),
            ]);
        } else {
            await loadCart();

            setState({
                user: null,
                isAuthenticated: false,
                orders: [],
            });
        }
    } catch (error) {
        console.error("Erro ao inicializar aplicação:", error);

        setState({
            error: error.response?.data?.message ??
                "Não foi possível inicializar a aplicação.",
        });
    } finally {
        setState({
            loading: false,
        });
    }

    return getState();
}