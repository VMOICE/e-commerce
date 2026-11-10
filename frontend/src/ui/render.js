import {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
} from "../api/addresses.js";
import { updateMe } from "../api/auth.js";
import {
    getAdminOrders,
    updateOrderStatus,
} from "../api/orders.js";
import {
    createCategory,
    updateCategory,
    deleteCategory,
} from "../api/categories.js";
import {
    createProduct,
    updateProduct,
    deactivateProduct,
    getAdminProducts,
} from "../api/products.js";
import {
    loginUser,
    logoutUser,
    registerUser,
} from "../app/handlers/auth/auth.js";
import {
    addProductToCart,
    changeCartItemQuantity,
    loadCart,
    removeProductFromCart,
} from "../app/handlers/cart/cart.js";
import {
    confirmOrderPayment,
    cancelCustomerOrder,
    loadOrder,
    loadOrders,
    checkout,
} from "../app/handlers/orders/orders.js";
import { loadCategories } from "../app/handlers/categories/categories.js";
import {
    loadProduct,
    loadProducts,
} from "../app/handlers/products/products.js";
import { getCartItemCount } from "../domain/cart.js";
import { getState, setState, subscribe } from "../app/state.js";

const storageBaseUrl = import.meta.env.VITE_STORAGE_BASE_URL
    ?? (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api")
        .replace(/\/api\/?$/, "/storage");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    })[character]);
}

function formatPrice(value) {
    return Number(value ?? 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function productImage(imagePath) {
    if (!imagePath) return "";
    return /^https?:\/\//i.test(imagePath)
        ? imagePath
        : `${storageBaseUrl}/${String(imagePath).replace(/^\/+/, "")}`;
}

function currentRoute() {
    const [page, ...parts] = location.hash.slice(1).split("/");
    return { page: page || "catalogo", id: parts.join("/") };
}

function statusLabel(status) {
    return ({
        pending: "Aguardando pagamento",
        paid: "Pago",
        shipped: "Enviado",
        delivered: "Entregue",
        cancelled: "Cancelado",
    })[status] ?? status;
}

function renderSidebar(state, page) {
    const links = [
        ["⌂", "Início", "#catalogo", "catalogo"],
        ["▦", "Produtos", "#catalogo", "catalogo"],
        ["◇", "Categorias", "#categorias", "categorias"],
        ["🛒", `Carrinho (${getCartItemCount(state.cart)})`, "#carrinho", "carrinho"],
        ["▤", "Meus pedidos", "#pedidos", "pedidos"],
        ["♙", "Minha conta", "#conta", "conta"],
    ];

    if (state.user?.role === "admin") {
        links.push(["⚙", "Painel admin", "#admin", "admin"]);
    }

    return `
        <aside class="sidebar">
            <a href="#catalogo" class="sidebar-logo" aria-label="MobileStore">M</a>
            <nav class="sidebar-menu" aria-label="Navegação principal">
                ${links.map(([icon, label, href, key]) => `
                    <a href="${href}" class="sidebar-link ${page === key ? "active" : ""}">
                        <span aria-hidden="true">${icon}</span><span>${escapeHTML(label)}</span>
                    </a>
                `).join("")}
            </nav>
        </aside>
    `;
}

function renderTopbar(state) {
    return `
        <header class="topbar">
            <a href="#catalogo" class="logo">Mobile<span>Store</span></a>
            <form class="topbar-search" id="search-form">
                <input type="search" class="form-control" id="search-input"
                    placeholder="Pesquisar produtos..." aria-label="Pesquisar produtos"
                    value="${escapeHTML(state.productFilters?.search ?? "")}">
            </form>
            <div class="topbar-actions">
                ${state.isAuthenticated
                    ? `<span class="text-secondary">${escapeHTML(state.user?.name)}</span>
                       <button class="btn btn-secondary" type="button" id="logout-button">Sair</button>`
                    : `<a class="btn btn-secondary" href="#login">Entrar</a>`}
                <a class="btn btn-secondary" href="#carrinho" aria-label="Carrinho">
                    🛒 ${getCartItemCount(state.cart)}
                </a>
            </div>
        </header>
    `;
}

function renderFilters(state) {
    return `
        <aside class="catalog-filters">
            <div class="section-header">
                <h2>Filtros</h2>
                <button class="btn btn-secondary" type="button" id="clear-filters">Limpar</button>
            </div>
            <div class="section">
                <h3>Categorias</h3>
                <label class="filter-option">
                    <input type="radio" name="category" value=""
                        ${!state.productFilters?.category_id ? "checked" : ""}>
                    Todas
                </label>
                ${state.categories.map((category) => `
                    <label class="filter-option">
                        <input type="radio" name="category" value="${Number(category.id)}"
                            ${Number(state.productFilters?.category_id) === Number(category.id) ? "checked" : ""}>
                        ${escapeHTML(category.name)}
                    </label>
                `).join("")}
            </div>
            <div class="section">
                <h3>Ordenar por</h3>
                <select class="form-control" id="sort-filter">
                    <option value="newest">Mais recentes</option>
                    <option value="price_asc">Menor preço</option>
                    <option value="price_desc">Maior preço</option>
                </select>
            </div>
        </aside>
    `;
}

function renderProductCard(product) {
    const image = productImage(product.image_path);
    return `
        <article class="product-card">
            <a class="product-image" href="#produto/${Number(product.id)}">
                ${image
                    ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}">`
                    : `<span class="text-secondary">Sem imagem</span>`}
            </a>
            <div class="product-info">
                <span class="text-secondary">${escapeHTML(product.category?.name ?? "Produto")}</span>
                <h3 class="product-name"><a href="#produto/${Number(product.id)}">${escapeHTML(product.name)}</a></h3>
                <p class="product-price">${formatPrice(product.price)}</p>
                <p class="product-stock">${Number(product.stock) > 0
                    ? `${Number(product.stock)} unidades disponíveis`
                    : "Produto indisponível"}</p>
                <button class="btn" type="button" data-add-product="${Number(product.id)}"
                    ${Number(product.stock) < 1 ? "disabled" : ""}>Adicionar ao carrinho</button>
            </div>
        </article>
    `;
}

function renderCatalog(state, categoriesOnly = false) {
    const products = categoriesOnly
        ? state.products.filter((product) => Number(product.category_id) === Number(state.productFilters?.category_id))
        : state.products;

    if (state.loading) return `<p class="text-secondary">Carregando produtos...</p>`;
    if (state.error) return `<p class="message error">${escapeHTML(state.error)}</p>`;
    if (!products.length) return `<p class="empty-state">Nenhum produto encontrado.</p>`;

    return `
        <div class="product-grid">${products.map(renderProductCard).join("")}</div>
        ${!categoriesOnly ? renderPagination(state) : ""}
    `;
}

function renderPagination(state) {
    const page = state.productPagination?.currentPage ?? 1;
    const lastPage = state.productPagination?.lastPage ?? 1;
    const total = state.productPagination?.total ?? state.products.length;
    return `
        <div class="pagination">
            <span>${total} produtos · página ${page} de ${lastPage}</span>
            <div>
                <button class="btn btn-secondary" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>Anterior</button>
                <button class="btn btn-secondary" data-page="${page + 1}" ${page >= lastPage ? "disabled" : ""}>Próxima</button>
            </div>
        </div>
    `;
}

function renderCatalogPage(state, categoriesOnly = false) {
    return `
        <div class="section-header">
            <div>
                <h1 class="page-title">${categoriesOnly ? "Categorias" : "Catálogo"}</h1>
                <p class="text-secondary">Acessórios para celular com estoque atualizado.</p>
            </div>
        </div>
        <div class="catalog-layout">
            ${renderFilters(state)}
            <section id="catalog-results">${renderCatalog(state, categoriesOnly)}</section>
        </div>
    `;
}

function renderProductDetail(state, id) {
    const product = state.productDetail;
    if (!product || String(product.id) !== String(id)) {
        loadProduct(id).then((data) => setState({ productDetail: data })).catch(showError);
        return `<p class="text-secondary">Carregando produto...</p>`;
    }
    return `
        <a href="#catalogo">← Voltar ao catálogo</a>
        <article class="detail-layout panel">
            <div class="product-image detail-image">
                ${productImage(product.image_path)
                    ? `<img src="${escapeHTML(productImage(product.image_path))}" alt="${escapeHTML(product.name)}">`
                    : `<span>Sem imagem</span>`}
            </div>
            <div>
                <p class="text-secondary">${escapeHTML(product.category?.name)}</p>
                <h1>${escapeHTML(product.name)}</h1>
                <p>${escapeHTML(product.description || "Sem descrição disponível.")}</p>
                <p class="product-price">${formatPrice(product.price)}</p>
                <p>${Number(product.stock) > 0 ? `${Number(product.stock)} disponíveis` : "Indisponível"}</p>
                <label for="detail-quantity">Quantidade</label>
                <input class="form-control quantity-input" id="detail-quantity" type="number" min="1"
                    max="${Number(product.stock)}" value="1" ${Number(product.stock) < 1 ? "disabled" : ""}>
                <button class="btn" type="button" data-detail-add="${Number(product.id)}"
                    ${Number(product.stock) < 1 ? "disabled" : ""}>Adicionar ao carrinho</button>
            </div>
        </article>
    `;
}

function renderCart(state) {
    const items = state.cart?.items ?? [];
    if (!items.length) return `<h1 class="page-title">Carrinho</h1><p class="empty-state">Seu carrinho está vazio.</p>`;

    return `
        <h1 class="page-title">Seu carrinho</h1>
        <div class="stack">
            ${items.map((item) => {
                const product = item.product;
                const unavailable = !product || !product.is_active || Number(product.stock) < Number(item.quantity);
                return `<article class="cart-row panel">
                    <div class="cart-product">
                        <strong>${escapeHTML(product?.name ?? "Produto indisponível")}</strong>
                        <span>${formatPrice(product?.price ?? 0)} cada</span>
                        ${unavailable ? `<span class="message error">Estoque insuficiente ou produto indisponível.</span>` : ""}
                    </div>
                    <form class="quantity-form" data-cart-form="${Number(item.product_id)}">
                        <input class="form-control quantity-input" type="number" name="quantity" min="1"
                            max="${Number(product?.stock ?? 1)}" value="${Number(item.quantity)}"
                            aria-label="Quantidade">
                        <button class="btn btn-secondary">Atualizar</button>
                    </form>
                    <strong>${formatPrice(item.subtotal)}</strong>
                    <button class="btn btn-secondary" type="button" data-remove-item="${Number(item.product_id)}">Remover</button>
                </article>`;
            }).join("")}
        </div>
        <div class="cart-summary panel">
            <strong>Total: ${formatPrice(state.cart?.total ?? state.cart?.subtotal)}</strong>
            <button type="button" class="btn" id="checkout-button">Finalizar compra</button>
        </div>
    `;
}

function renderAuth(register = false) {
    return `
        <section class="form-panel panel">
            <h1>${register ? "Criar conta" : "Entrar"}</h1>
            <form id="auth-form" class="stack">
                ${register ? `<label>Nome<input class="form-control" name="name" required maxlength="255"></label>` : ""}
                <label>E-mail<input class="form-control" name="email" type="email" required autocomplete="email"></label>
                <label>Senha<input class="form-control" name="password" type="password" required minlength="8"
                    autocomplete="${register ? "new-password" : "current-password"}"></label>
                ${register ? `<label>Confirmar senha<input class="form-control" name="password_confirmation" type="password" required minlength="8"></label>` : ""}
                <button class="btn">${register ? "Registrar" : "Entrar"}</button>
            </form>
            <p>${register ? `Já tem conta? <a href="#login">Entrar</a>` : `Ainda não tem conta? <a href="#registro">Cadastre-se</a>`}</p>
        </section>
    `;
}

function addressFields(disabled = false) {
    const disabledAttribute = disabled ? "disabled" : "";
    return `
        <label>Nome de quem recebe<input class="form-control" name="recipient_name" required maxlength="150" ${disabledAttribute}></label>
        <label>CEP<input class="form-control" name="postal_code" required maxlength="20" ${disabledAttribute}></label>
        <label>Rua<input class="form-control" name="street" required maxlength="180" ${disabledAttribute}></label>
        <label>Número<input class="form-control" name="number" required maxlength="30" ${disabledAttribute}></label>
        <label>Complemento<input class="form-control" name="complement" maxlength="120" ${disabledAttribute}></label>
        <label>Bairro<input class="form-control" name="neighborhood" required maxlength="120" ${disabledAttribute}></label>
        <label>Cidade<input class="form-control" name="city" required maxlength="120" ${disabledAttribute}></label>
        <label>Estado<input class="form-control" name="state" required maxlength="80" ${disabledAttribute}></label>
    `;
}

function renderAddresses(state) {
    if (!state.isAuthenticated) {
        sessionStorage.setItem("after-login", "#conta");
        return `<p>Entre para visualizar e cadastrar seus endereços. <a href="#login">Entrar</a></p>`;
    }
    if (!state.addressesLoaded) {
        getAddresses()
            .then((response) => setState({ addresses: response.data, addressesLoaded: true }))
            .catch(showError);
    }
    return `
        <h1 class="page-title">Minha conta</h1>
        <section class="panel form-panel">
            <form id="profile-form" class="stack">
                <h2>Dados pessoais</h2>
                <label>Nome<input class="form-control" name="name" value="${escapeHTML(state.user?.name)}" required></label>
                <label>E-mail<input class="form-control" name="email" type="email" value="${escapeHTML(state.user?.email)}" required></label>
                <button class="btn">Salvar perfil</button>
            </form>
            <h2>Endereços salvos</h2>
            ${state.addresses?.length
                ? `<div class="stack">${state.addresses.map((address) => `
                    <form class="panel address-edit-form" data-address-id="${Number(address.id)}">
                        <strong>${escapeHTML(address.label || "Endereço")}</strong>
                        <label>Nome de quem recebe<input class="form-control" name="recipient_name" value="${escapeHTML(address.recipient_name)}" required></label>
                        <label>CEP<input class="form-control" name="postal_code" value="${escapeHTML(address.postal_code)}" required></label>
                        <label>Rua<input class="form-control" name="street" value="${escapeHTML(address.street)}" required></label>
                        <label>Número<input class="form-control" name="number" value="${escapeHTML(address.number)}" required></label>
                        <label>Complemento<input class="form-control" name="complement" value="${escapeHTML(address.complement)}"></label>
                        <label>Bairro<input class="form-control" name="neighborhood" value="${escapeHTML(address.neighborhood)}" required></label>
                        <label>Cidade<input class="form-control" name="city" value="${escapeHTML(address.city)}" required></label>
                        <label>Estado<input class="form-control" name="state" value="${escapeHTML(address.state)}" required></label>
                        <button class="btn btn-secondary">Atualizar endereço</button>
                        <button class="btn" type="button" data-delete-address="${Number(address.id)}">Remover</button>
                    </form>
                `).join("")}</div>`
                : `<p>Nenhum endereço cadastrado.</p>`}
            <h2>Adicionar endereço</h2>
            <form id="address-form" class="stack">${addressFields()}<button class="btn">Salvar endereço</button></form>
        </section>
    `;
}

function renderCheckout(state) {
    if (!state.isAuthenticated) {
        sessionStorage.setItem("after-login", "#checkout");
        return `<p>Entre ou crie uma conta para finalizar a compra. <a href="#login">Entrar</a></p>`;
    }
    if (!state.cart?.items?.length) return `<p>Seu carrinho está vazio.</p>`;

    if (!state.addressesLoaded) {
        getAddresses()
            .then((response) => setState({ addresses: response.data, addressesLoaded: true }))
            .catch(showError);
    }
    const addresses = state.addresses ?? [];
    return `
        <h1 class="page-title">Finalizar compra</h1>
        <p>Resumo: ${state.cart.items.length} produto(s) · total ${formatPrice(state.cart.total ?? state.cart.subtotal)} · frete grátis</p>
        <p>Pagamento simulado para fins acadêmicos. Nenhum dado de cartão será solicitado.</p>
        <form id="checkout-form" class="panel form-panel stack">
            ${addresses.length
                ? `<label>Endereço de entrega<select class="form-control" name="address_id">
                    ${addresses.map((address) => `<option value="${Number(address.id)}">${escapeHTML(address.street)}, ${escapeHTML(address.number)} — ${escapeHTML(address.city)}</option>`).join("")}
                    <option value="new">Cadastrar novo endereço</option>
                   </select></label>`
                : `<input type="hidden" name="address_id" value="new"><p>Cadastre o endereço de entrega para continuar.</p>`}
            <fieldset id="new-address-fields" ${addresses.length ? "hidden" : ""}>
                <legend>Novo endereço</legend>${addressFields(addresses.length > 0)}
            </fieldset>
            <button class="btn">Criar pedido</button>
        </form>
    `;
}

function renderOrderList(state) {
    if (!state.isAuthenticated) {
        sessionStorage.setItem("after-login", "#pedidos");
        return `<p>Entre para visualizar seus pedidos. <a href="#login">Entrar</a></p>`;
    }
    const orders = state.orders ?? [];
    if (!orders.length) return `<h1 class="page-title">Meus pedidos</h1><p>Você ainda não fez pedidos.</p>`;
    return `
        <h1 class="page-title">Meus pedidos</h1>
        <div class="stack">${orders.map((order) => `
            <article class="panel order-row">
                <div><strong>Pedido #${Number(order.id)}</strong><span>${new Date(order.created_at).toLocaleString("pt-BR")}</span></div>
                <span>${statusLabel(order.status)}</span><strong>${formatPrice(order.total)}</strong>
                <button class="btn btn-secondary" type="button" data-order-detail="${Number(order.id)}">Detalhes</button>
                ${order.status === "pending" ? `<button class="btn" data-pay-order="${Number(order.id)}">Confirmar pagamento simulado</button><button class="btn btn-secondary" data-cancel-order="${Number(order.id)}">Cancelar</button>` : ""}
            </article>
        `).join("")}</div>
    `;
}

function renderOrderDetail(state, id) {
    const order = state.selectedOrder;
    if (!order || String(order.id) !== String(id)) {
        loadOrder(id).then((data) => setState({ selectedOrder: data })).catch(showError);
        return `<p>Carregando pedido...</p>`;
    }
    return `
        <a href="#pedidos">← Voltar aos pedidos</a>
        <h1 class="page-title">Pedido #${Number(order.id)}</h1>
        <p>Status: ${statusLabel(order.status)}</p>
        <p>Endereço: ${escapeHTML(order.shipping_address?.street)}, ${escapeHTML(order.shipping_address?.number)} — ${escapeHTML(order.shipping_address?.city)}/${escapeHTML(order.shipping_address?.state)}</p>
        <ul class="panel">${(order.items ?? []).map((item) => `<li>${escapeHTML(item.product_name)} · ${Number(item.quantity)} × ${formatPrice(item.unit_price)} = ${formatPrice(item.subtotal)}</li>`).join("")}</ul>
        <strong>Total: ${formatPrice(order.total)}</strong>
        ${order.status === "pending" ? `<p><button class="btn" data-pay-order="${Number(order.id)}">Confirmar pagamento simulado</button> <button class="btn btn-secondary" data-cancel-order="${Number(order.id)}">Cancelar pedido</button></p>` : ""}
    `;
}

function renderAdmin(state) {
    if (state.user?.role !== "admin") return `<h1>Acesso restrito</h1><p>Somente administradores podem acessar esta área.</p>`;
    if (!Array.isArray(state.adminOrders)) {
        getAdminOrders().then((response) => setState({ adminOrders: response.data })).catch(showError);
    }
    if (!Array.isArray(state.adminProducts)) {
        getAdminProducts().then((response) => setState({ adminProducts: response.data })).catch(showError);
    }
    return `
        <h1 class="page-title">Painel administrativo</h1>
        <section class="admin-grid">
            <form id="admin-product-form" class="panel stack">
                <h2>Cadastrar produto</h2>
                <label>Nome<input class="form-control" name="name" required></label>
                <label>Slug<input class="form-control" name="slug" required></label>
                <label>Categoria<select class="form-control" name="category_id" required>
                    ${(state.categories ?? []).map((category) => `<option value="${Number(category.id)}">${escapeHTML(category.name)}</option>`).join("")}
                </select></label>
                <label>Descrição<textarea class="form-control" name="description"></textarea></label>
                <label>Preço<input class="form-control" name="price" type="number" min="0" step="0.01" required></label>
                <label>Estoque<input class="form-control" name="stock" type="number" min="0" required></label>
                <label>Caminho ou URL da imagem<input class="form-control" name="image_path" maxlength="255"></label>
                <button class="btn">Salvar produto</button>
            </form>
            <form id="admin-category-form" class="panel stack">
                <h2>Cadastrar categoria</h2>
                <label>Nome<input class="form-control" name="name" required></label>
                <label>Slug<input class="form-control" name="slug" required></label>
                <label>Descrição<textarea class="form-control" name="description"></textarea></label>
                <button class="btn">Salvar categoria</button>
            </form>
        </section>
        <h2>Produtos</h2>
        <div class="stack">${(state.adminProducts ?? []).map((product) => `
            <form class="panel admin-edit-form" data-admin-product="${Number(product.id)}">
                <strong>Produto #${Number(product.id)}</strong>
                <label>Nome<input class="form-control" name="name" value="${escapeHTML(product.name)}" required></label>
                <label>Slug<input class="form-control" name="slug" value="${escapeHTML(product.slug)}" required></label>
                <label>Categoria<select class="form-control" name="category_id">
                    ${(state.categories ?? []).map((category) => `<option value="${Number(category.id)}" ${Number(category.id) === Number(product.category_id) ? "selected" : ""}>${escapeHTML(category.name)}</option>`).join("")}
                </select></label>
                <label>Descrição<textarea class="form-control" name="description">${escapeHTML(product.description)}</textarea></label>
                <label>Preço<input class="form-control" name="price" type="number" step="0.01" min="0" value="${escapeHTML(product.price)}" required></label>
                <label>Estoque<input class="form-control" name="stock" type="number" min="0" value="${Number(product.stock)}" required></label>
                <label>Caminho ou URL da imagem<input class="form-control" name="image_path" maxlength="255" value="${escapeHTML(product.image_path)}"></label>
                <label>Status<select class="form-control" name="is_active">
                    <option value="1" ${product.is_active ? "selected" : ""}>Ativo</option>
                    <option value="0" ${!product.is_active ? "selected" : ""}>Inativo</option>
                </select></label>
                <button class="btn btn-secondary">Salvar alterações</button>
                ${product.is_active ? `<button class="btn" type="button" data-deactivate-product="${Number(product.id)}">Desativar</button>` : ""}
            </form>
        `).join("")}</div>
        <h2>Categorias</h2>
        <div class="stack">${(state.categories ?? []).map((category) => `
            <form class="panel category-edit-form" data-admin-category="${Number(category.id)}">
                <label>Nome<input class="form-control" name="name" value="${escapeHTML(category.name)}" required></label>
                <label>Slug<input class="form-control" name="slug" value="${escapeHTML(category.slug)}" required></label>
                <label>Descrição<textarea class="form-control" name="description">${escapeHTML(category.description)}</textarea></label>
                <button class="btn btn-secondary">Salvar categoria</button>
                <button class="btn" type="button" data-delete-category="${Number(category.id)}">Excluir categoria</button>
            </form>
        `).join("")}</div>
        <h2>Pedidos da loja</h2>
        <label>Filtrar pedidos<select class="form-control" id="admin-status-filter">
            <option value="">Todos os status</option>
            ${["pending", "paid", "shipped", "delivered", "cancelled"].map((status) => `<option value="${status}">${statusLabel(status)}</option>`).join("")}
        </select></label>
        <div class="stack">${(state.adminOrders ?? []).map((order) => `
            <form class="panel order-row" data-admin-order="${Number(order.id)}">
                <strong>Pedido #${Number(order.id)} — ${escapeHTML(order.user?.name)}</strong>
                <span>${statusLabel(order.status)} · ${formatPrice(order.total)}</span>
                <select class="form-control" name="status" required>
                    <option value="" selected>Escolha uma transição</option>
                    ${( {
                        pending: ["paid", "cancelled"],
                        paid: ["shipped"],
                        shipped: ["delivered"],
                        delivered: [],
                        cancelled: [],
                    }[order.status] ?? []).map((status) => `<option value="${status}">${statusLabel(status)}</option>`).join("")}
                </select>
                <button class="btn btn-secondary" ${["delivered", "cancelled"].includes(order.status) ? "disabled" : ""}>Atualizar status</button>
            </form>
        `).join("")}</div>
    `;
}

function showError(error) {
    const target = document.querySelector(".page-message");
    const message = error.response?.data?.message
        ?? Object.values(error.response?.data?.errors ?? {}).flat()[0]
        ?? error.message
        ?? "Não foi possível concluir a operação.";
    if (target) {
        target.textContent = message;
        target.classList.add("error");
    } else {
        console.error(message, error);
    }
}

function formValues(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function bindEvents(app, page, id) {
    app.querySelector("#search-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        await loadProducts({ ...getState().productFilters, search: app.querySelector("#search-input").value.trim(), page: 1 });
        if (page !== "catalogo" && page !== "categorias") location.hash = "#catalogo";
    });

    app.querySelectorAll('input[name="category"]').forEach((input) => {
        input.addEventListener("change", () => loadProducts({
            ...getState().productFilters,
            category_id: input.value,
            page: 1,
        }).catch(showError));
    });

    app.querySelector("#sort-filter")?.addEventListener("change", (event) => {
        loadProducts({ ...getState().productFilters, sort: event.target.value, page: 1 }).catch(showError);
    });
    const sort = app.querySelector("#sort-filter");
    if (sort) sort.value = getState().productFilters?.sort ?? "newest";

    app.querySelector("#clear-filters")?.addEventListener("click", () => {
        loadProducts({ sort: "newest", page: 1 }).catch(showError);
    });
    app.querySelectorAll("[data-page]").forEach((button) => {
        button.addEventListener("click", () => loadProducts({
            ...getState().productFilters,
            page: Number(button.dataset.page),
        }).catch(showError));
    });
    app.querySelectorAll("[data-add-product]").forEach((button) => {
        button.addEventListener("click", async () => {
            button.disabled = true;
            try {
                await addProductToCart(Number(button.dataset.addProduct));
                location.hash = "#carrinho";
            } catch (error) {
                showError(error);
            } finally {
                button.disabled = false;
            }
        });
    });
    app.querySelector("[data-detail-add]")?.addEventListener("click", async (event) => {
        const quantity = Number(app.querySelector("#detail-quantity").value);
        try {
            await addProductToCart(Number(event.currentTarget.dataset.detailAdd), quantity);
            location.hash = "#carrinho";
        } catch (error) {
            showError(error);
        }
    });

    app.querySelectorAll("[data-cart-form]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                await changeCartItemQuantity(Number(form.dataset.cartForm), Number(new FormData(form).get("quantity")));
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-remove-item]").forEach((button) => {
        button.addEventListener("click", () => removeProductFromCart(Number(button.dataset.removeItem)).catch(showError));
    });
    app.querySelector("#checkout-button")?.addEventListener("click", () => {
        if (!getState().isAuthenticated) sessionStorage.setItem("after-login", "#checkout");
        location.hash = getState().isAuthenticated ? "#checkout" : "#login";
    });

    app.querySelector("#auth-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = formValues(event.currentTarget);
        try {
            if (page === "registro") await registerUser(values);
            else await loginUser(values);
            await Promise.all([loadCart(), loadOrders()]);
            const next = sessionStorage.getItem("after-login") || "#conta";
            sessionStorage.removeItem("after-login");
            location.hash = next;
        } catch (error) { showError(error); }
    });
    app.querySelector("#logout-button")?.addEventListener("click", async () => {
        try {
            await logoutUser();
            await loadCart();
            location.hash = "#catalogo";
        } catch (error) { showError(error); }
    });

    app.querySelector("#address-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const response = await createAddress(formValues(event.currentTarget));
            setState({
                addresses: [...(getState().addresses ?? []), response.data],
                addressesLoaded: true,
            });
            event.currentTarget.reset();
        } catch (error) { showError(error); }
    });
    app.querySelector("#profile-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const response = await updateMe(formValues(event.currentTarget));
            setState({ user: response.user });
        } catch (error) { showError(error); }
    });
    app.querySelectorAll("[data-address-id]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                await updateAddress(form.dataset.addressId, formValues(form));
                const response = await getAddresses();
                setState({ addresses: response.data, addressesLoaded: true });
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-delete-address]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await deleteAddress(button.dataset.deleteAddress);
                const response = await getAddresses();
                setState({ addresses: response.data, addressesLoaded: true });
            } catch (error) { showError(error); }
        });
    });
    app.querySelector("#checkout-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const form = event.currentTarget;
            let addressId = new FormData(form).get("address_id");
            if (addressId === "new") {
                const fields = form.querySelector("#new-address-fields");
                const values = Object.fromEntries(new FormData(form).entries());
                const address = await createAddress(values);
                addressId = address.data.id;
            }
            const order = await checkout(Number(addressId));
            setState({ selectedOrder: order });
            location.hash = `#pedido/${order.id}`;
        } catch (error) { showError(error); }
    });
    app.querySelector("#checkout-form select[name=address_id]")?.addEventListener("change", (event) => {
        const fields = app.querySelector("#new-address-fields");
        fields.hidden = event.target.value !== "new";
        fields.querySelectorAll("input").forEach((input) => {
            input.disabled = event.target.value !== "new";
        });
    });

    app.querySelectorAll("[data-pay-order]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await confirmOrderPayment(Number(button.dataset.payOrder));
                if (page === "pedido") {
                    setState({ selectedOrder: await loadOrder(id) });
                }
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-cancel-order]").forEach((button) => {
        button.addEventListener("click", () => cancelCustomerOrder(Number(button.dataset.cancelOrder)).catch(showError));
    });
    app.querySelectorAll("[data-order-detail]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                const order = await loadOrder(button.dataset.orderDetail);
                setState({ selectedOrder: order });
                location.hash = `#pedido/${order.id}`;
            } catch (error) { showError(error); }
        });
    });

    app.querySelector("#admin-product-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const values = formValues(event.currentTarget);
            values.category_id = Number(values.category_id);
            values.price = Number(values.price).toFixed(2);
            values.stock = Number(values.stock);
            await createProduct(values);
            await loadProducts(getState().productFilters);
            event.currentTarget.reset();
        } catch (error) { showError(error); }
    });
    app.querySelector("#admin-category-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await createCategory(formValues(event.currentTarget));
            await loadCategories();
            event.currentTarget.reset();
        } catch (error) { showError(error); }
    });
    app.querySelectorAll("[data-admin-product]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                const values = formValues(form);
                values.category_id = Number(values.category_id);
                values.price = Number(values.price).toFixed(2);
                values.stock = Number(values.stock);
                values.is_active = values.is_active === "1";
                await updateProduct(form.dataset.adminProduct, values);
                const response = await getAdminProducts();
                setState({ adminProducts: response.data });
                await loadProducts(getState().productFilters);
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-deactivate-product]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await deactivateProduct(button.dataset.deactivateProduct);
                const response = await getAdminProducts();
                setState({ adminProducts: response.data });
                await loadProducts(getState().productFilters);
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-admin-category]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                await updateCategory(form.dataset.adminCategory, formValues(form));
                await loadCategories();
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-delete-category]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await deleteCategory(button.dataset.deleteCategory);
                await loadCategories();
            } catch (error) { showError(error); }
        });
    });
    app.querySelector("#admin-status-filter")?.addEventListener("change", async (event) => {
        try {
            const response = await getAdminOrders(event.target.value ? { status: event.target.value } : {});
            setState({ adminOrders: response.data });
        } catch (error) { showError(error); }
    });
    app.querySelectorAll("[data-admin-order]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                const status = new FormData(form).get("status");
                await updateOrderStatus(form.dataset.adminOrder, status);
                const orders = await getAdminOrders();
                setState({ adminOrders: orders.data });
            } catch (error) { showError(error); }
        });
    });
}

function renderPage(state, page, id) {
    switch (page) {
        case "catalogo":
        case "inicio": return renderCatalogPage(state);
        case "categorias": return renderCatalogPage(state, true);
        case "produto": return renderProductDetail(state, id);
        case "carrinho": return renderCart(state);
        case "login": return renderAuth(false);
        case "registro": return renderAuth(true);
        case "checkout": return renderCheckout(state);
        case "pedidos": return renderOrderList(state);
        case "pedido": return renderOrderDetail(state, id);
        case "conta": return renderAddresses(state);
        case "admin": return renderAdmin(state);
        default: return `<h1>Página não encontrada</h1><a href="#catalogo">Voltar ao catálogo</a>`;
    }
}

export function renderApp() {
    const app = document.querySelector("#app");
    if (!app) throw new Error("Elemento #app não encontrado.");
    const state = getState();
    const { page, id } = currentRoute();

    app.innerHTML = `
        <div class="app-layout">
            ${renderSidebar(state, page)}
            <main class="main-content">
                ${renderTopbar(state)}
                <div class="page-container">
                    <p class="page-message" role="status" aria-live="polite"></p>
                    ${renderPage(state, page, id)}
                </div>
                <footer class="footer">MobileStore © ${new Date().getFullYear()} · Frete grátis</footer>
            </main>
        </div>
    `;
    bindEvents(app, page, id);
}

export function observeState() {
    subscribe(renderApp);
    window.addEventListener("hashchange", renderApp);
}
