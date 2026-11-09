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
        const [products, categories] = await Promise.all([
            loadProducts(),
            loadCategories(),
        ]);

        setState({
            products,
            categories,
        });

        const token = localStorage.getItem("auth_token");

        if (token) {
            const user = await loadAuthenticatedUser();

            const [cart, orders] = await Promise.all([
                loadCart(),
                loadOrders(),
            ]);

            setState({
                user,
                isAuthenticated: true,
                cart,
                orders,
            });
        } else {
            const cart = await loadCart();

            setState({
                cart,
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