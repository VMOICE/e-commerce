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
        // A verificação da sessão não depende dos dados públicos do catálogo.
        localStorage.removeItem("auth_token");

        const authenticatedUserPromise = loadAuthenticatedUser()
            .then(() => ({
                isAuthenticated: true,
            }))
            .catch((error) => {
                if (error.response?.status !== 401) {
                    return { error };
                }

                setState({
                    user: null,
                    isAuthenticated: false,
                    authInitialized: true,
                    orders: [],
                });

                return {
                    isAuthenticated: false,
                };
            });

        await Promise.all([
            loadProducts(),
            loadCategories(),
        ]);

        setState({
            loading: false,
        });

        const authentication = await authenticatedUserPromise;

        if ("error" in authentication) {
            throw authentication.error;
        }

        const { isAuthenticated } = authentication;

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