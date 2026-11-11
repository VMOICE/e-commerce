import { renderAccount } from "./account-view.js";
import { renderAdmin } from "./admin-view.js";
import { renderAuth } from "./auth-view.js";
import { renderCart } from "./cart-view.js";
import { renderCatalogPage, renderProductDetail } from "./catalog-view.js";
import { renderCheckout } from "./checkout-view.js";
import { renderOrderDetail, renderOrderList } from "./orders-view.js";

const routeDefinitions = {
    catalogo: {
        render: ({ state }) => renderCatalogPage(state),
    },
    inicio: {
        render: ({ state }) => renderCatalogPage(state),
    },
    categorias: {
        render: ({ state }) => renderCatalogPage(state, true),
    },
    produto: {
        render: ({ state, id, onError }) => renderProductDetail(state, id, onError),
    },
    carrinho: {
        render: ({ state }) => renderCart(state),
    },
    login: {
        render: () => renderAuth(false),
    },
    registro: {
        render: () => renderAuth(true),
    },
    checkout: {
        requiresAuthentication: true,
        render: ({ state, onError }) => renderCheckout(state, onError),
    },
    pedidos: {
        requiresAuthentication: true,
        render: ({ state }) => renderOrderList(state),
    },
    pedido: {
        requiresAuthentication: true,
        render: ({ state, id, onError }) => renderOrderDetail(state, id, onError),
    },
    conta: {
        requiresAuthentication: true,
        render: ({ state, id, onError }) => renderAccount(state, id || "perfil", onError),
    },
    admin: {
        requiresAuthentication: true,
        render: ({ state, id, onError, refreshAdminProducts }) =>
            renderAdmin(state, id || "produtos", onError, refreshAdminProducts),
    },
};

const notFoundPage = `
    <section class="panel empty-state">
        <h1>Página não encontrada</h1>
        <p>O endereço acessado não corresponde a uma página disponível.</p>
        <a class="btn" href="#catalogo">Voltar ao catálogo</a>
    </section>
`;

export function resolveHashRoute(hash = window.location.hash) {
    const [page, ...parts] = hash.slice(1).split("/");
    return { page: page || "catalogo", id: parts.join("/") };
}

export function routeRequiresAuthentication(page) {
    return routeDefinitions[page]?.requiresAuthentication === true;
}

export function renderRoute(state, page, id, actions) {
    const route = routeDefinitions[page];
    return route
        ? route.render({ state, id, ...actions })
        : notFoundPage;
}
