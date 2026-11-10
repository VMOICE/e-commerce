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

        // Remove tokens usados pelo fluxo antigo de autenticação.
        localStorage.removeItem("auth_token");

        let isAuthenticated = false;

        try {
            await loadAuthenticatedUser();
            isAuthenticated = true;
        } catch (error) {
            if (error.response?.status !== 401) {
                throw error;
            }

            setState({
                user: null,
                isAuthenticated: false,
                orders: [],
            });
        }

        // Carrega os dados conforme o estado da autenticação.
        if (isAuthenticated) {
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