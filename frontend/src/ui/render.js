import { getCartItemCount } from "../domain/cart.js";
import { getState, subscribe } from "../app/state.js";

export function renderApp() {
    const app = document.querySelector("#app");
    const state = getState();

    if (!app) {
        throw new Error("Elemento #app não encontrado.");
    }

    if (state.loading) {
        app.textContent = "Carregando aplicação...";
        return;
    }

    if (state.error) {
        app.textContent = state.error;
        return;
    }

    app.innerHTML = `
        <main>
            <h1>Loja Virtual</h1>

            <section>
                <h2>Produtos</h2>
                <p>${state.products.length} produtos carregados.</p>
            </section>

            <section>
                <h2>Categorias</h2>
                <p>${state.categories.length} categorias carregadas.</p>
            </section>

            <section>
                <h2>Carrinho</h2>
                <p>${getCartItemCount(state.cart)} itens no carrinho.</p>
            </section>

            <section>
                <h2>Autenticação</h2>
                <p>
                    ${state.isAuthenticated
                        ? "Usuário autenticado."
                        : "Visitante."}
                </p>
            </section>
        </main>
    `;
}

export function observeState() {
    subscribe(() => {
        renderApp();
    });
}