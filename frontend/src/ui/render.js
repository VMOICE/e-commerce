import { getState } from "../app/state.js";

export function renderApp() {
    const app = document.querySelector("#app");
    const state = getState();

    if (!app) {
        throw new Error("Elemento #app não encontrado.");
    }

    if (state.loading) {
        app.innerHTML = "<p>Carregando aplicação...</p>";
        return;
    }

    if (state.error) {
        app.innerHTML = `<p>${state.error}</p>`;
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
                <p>
                    ${
                        state.cart?.items?.length ??
                        0
                    } itens no carrinho.
                </p>
            </section>

            <section>
                <h2>Autenticação</h2>
                <p>
                    ${
                        state.isAuthenticated
                            ? "Usuário autenticado."
                            : "Visitante."
                    }
                </p>
            </section>
        </main>
    `;
}