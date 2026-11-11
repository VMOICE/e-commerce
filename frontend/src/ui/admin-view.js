import { getAdminUsers } from "../api/users.js";
import { getAdminOrders } from "../api/orders.js";
import { setState } from "../app/state.js";
import { escapeHTML, formatDateTime, formatPrice, statusClass, statusLabel } from "./format.js";

export function renderAdmin(state, section = "produtos", onError, refreshProducts) {
    if (state.user?.role !== "admin") return `<h1>Acesso restrito</h1><p>Somente administradores podem acessar esta área.</p>`;
    const sections = [
        ["produtos", "Produtos"],
        ["categorias", "Categorias"],
        ["pedidos", "Pedidos"],
        ["usuarios", "Usuários"],
    ];
    if (!sections.some(([key]) => key === section)) {
        section = "produtos";
    }

    if (section === "pedidos" && !Array.isArray(state.adminOrders)) {
        getAdminOrders().then((response) => setState({ adminOrders: response.data })).catch(onError);
    }
    if (section === "usuarios" && !Array.isArray(state.adminUsers)) {
        getAdminUsers()
            .then((response) => setState({ adminUsers: response.data }))
            .catch(onError);
    }
    if (section === "produtos" && !Array.isArray(state.adminProducts)) {
        refreshProducts().catch(onError);
    }

    return `
        <h1 class="page-title">Painel administrativo</h1>
        <nav class="admin-nav" aria-label="Funções administrativas">
            ${sections.map(([key, label]) => `
                <a class="btn ${section === key ? "" : "btn-secondary"}"
                    href="#admin/${key}" ${section === key ? 'aria-current="page"' : ""}>${label}</a>
            `).join("")}
        </nav>
        ${section === "produtos" ? `
            <section class="panel stack admin-form">
                <h2>Cadastrar produto</h2>
                <form id="admin-product-form" class="stack">
                    <label>Nome<input class="form-control" name="name" required maxlength="150"></label>
                    <label>Slug<input class="form-control" name="slug" required maxlength="180" pattern="[a-z0-9]+(-[a-z0-9]+)*"></label>
                    <label>Categoria<select class="form-control" name="category_id" required>
                        ${(state.categories ?? []).map((category) => `<option value="${Number(category.id)}">${escapeHTML(category.name)}</option>`).join("")}
                    </select></label>
                    <label>Descrição<textarea class="form-control" name="description" maxlength="5000"></textarea></label>
                    <label>Preço<input class="form-control" name="price" type="number" min="0" max="99999999.99" step="0.01" required></label>
                    <label>Estoque<input class="form-control" name="stock" type="number" min="0" max="2147483647" step="1" required></label>
                    <div class="admin-image-fields">
                        <label>Caminho ou URL da imagem
                            <input class="form-control" name="image_path" maxlength="255">
                        </label>
                        <label>Enviar imagem (JPEG, PNG ou WebP; até 5 MB)
                            <input class="form-control" name="image" type="file" accept="image/jpeg,image/png,image/webp">
                        </label>
                    </div>
                    <button class="btn">Salvar produto</button>
                </form>
            </section>
            <h2>Produtos cadastrados</h2>
            <form id="admin-product-filters" class="admin-product-filters">
                <label>Pesquisar por nome
                    <input class="form-control" type="search" name="search" maxlength="150"
                        value="${escapeHTML(state.adminProductFilters?.search ?? "")}"
                        placeholder="Nome do produto">
                </label>
                <label>Status
                    <select class="form-control" name="is_active">
                        <option value="" ${state.adminProductFilters?.is_active === undefined ? "selected" : ""}>Todos</option>
                        <option value="1" ${state.adminProductFilters?.is_active === "1" ? "selected" : ""}>Ativos</option>
                        <option value="0" ${state.adminProductFilters?.is_active === "0" ? "selected" : ""}>Inativos</option>
                    </select>
                </label>
                <button class="btn btn-secondary">Pesquisar</button>
            </form>
            ${Array.isArray(state.adminProducts) ? `
                ${state.adminProducts.length ? `<div class="stack">${state.adminProducts.map((product) => `
                    <form class="panel admin-edit-form" data-admin-product="${Number(product.id)}"
                        enctype="multipart/form-data">
                        <strong>Produto #${Number(product.id)}</strong>
                        <label>Nome<input class="form-control" name="name" value="${escapeHTML(product.name)}" required maxlength="150"></label>
                        <label>Slug<input class="form-control" name="slug" value="${escapeHTML(product.slug)}" required maxlength="180" pattern="[a-z0-9]+(-[a-z0-9]+)*"></label>
                        <label>Categoria<select class="form-control" name="category_id">
                            ${(state.categories ?? []).map((category) => `<option value="${Number(category.id)}" ${Number(category.id) === Number(product.category_id) ? "selected" : ""}>${escapeHTML(category.name)}</option>`).join("")}
                        </select></label>
                        <label>Descrição<textarea class="form-control" name="description" maxlength="5000">${escapeHTML(product.description)}</textarea></label>
                        <label>Preço<input class="form-control" name="price" type="number" step="0.01" min="0" max="99999999.99" value="${escapeHTML(product.price)}" required></label>
                        <label>Estoque<input class="form-control" name="stock" type="number" min="0" max="2147483647" step="1" value="${Number(product.stock)}" required></label>
                        <div class="admin-image-fields">
                            <label>Caminho ou URL da imagem
                                <input class="form-control" name="image_path" maxlength="255" value="${escapeHTML(product.image_path)}">
                            </label>
                            <label>Enviar nova imagem (JPEG, PNG ou WebP; até 5 MB)
                                <input class="form-control" name="image" type="file" accept="image/jpeg,image/png,image/webp">
                            </label>
                        </div>
                        <label>Status<select class="form-control" name="is_active">
                            <option value="1" ${product.is_active ? "selected" : ""}>Ativo</option>
                            <option value="0" ${!product.is_active ? "selected" : ""}>Inativo</option>
                        </select></label>
                        <button class="btn btn-secondary">Salvar alterações</button>
                        ${product.is_active ? `<button class="btn" type="button" data-deactivate-product="${Number(product.id)}">Desativar</button>` : ""}
                    </form>
                `).join("")}</div>` : `<p class="text-secondary">Nenhum produto encontrado para esses filtros.</p>`}
            ` : `<p class="text-secondary">Carregando produtos...</p>`}
        ` : ""}
        ${section === "categorias" ? `
            <section class="admin-grid">
                <form id="admin-category-form" class="panel stack admin-form">
                    <h2>Cadastrar categoria</h2>
                    <label>Nome<input class="form-control" name="name" required maxlength="100"></label>
                    <label>Slug<input class="form-control" name="slug" required maxlength="120" pattern="[a-z0-9]+(-[a-z0-9]+)*"></label>
                    <label>Descrição<textarea class="form-control" name="description" maxlength="2000"></textarea></label>
                    <button class="btn">Salvar categoria</button>
                </form>
            </section>
            <h2>Categorias cadastradas</h2>
            <div class="stack">${(state.categories ?? []).map((category) => `
                <form class="panel category-edit-form" data-admin-category="${Number(category.id)}">
                    <label>Nome<input class="form-control" name="name" value="${escapeHTML(category.name)}" required maxlength="100"></label>
                    <label>Slug<input class="form-control" name="slug" value="${escapeHTML(category.slug)}" required maxlength="120" pattern="[a-z0-9]+(-[a-z0-9]+)*"></label>
                    <label>Descrição<textarea class="form-control" name="description" maxlength="2000">${escapeHTML(category.description)}</textarea></label>
                    <button class="btn btn-secondary">Salvar categoria</button>
                    <button class="btn" type="button" data-delete-category="${Number(category.id)}">Excluir categoria</button>
                </form>
            `).join("")}</div>
        ` : ""}
        ${section === "pedidos" ? `
            <section class="admin-orders-header">
                <div>
                    <h2>Pedidos da loja</h2>
                    <p class="text-secondary">Acompanhe os pedidos e avance seus status conforme necessário.</p>
                </div>
                <label>Filtrar por status
                    <select class="form-control" id="admin-status-filter">
                        <option value="" ${!state.adminOrderFilter ? "selected" : ""}>Todos os status</option>
                        ${["pending", "paid", "shipped", "delivered", "cancelled"].map((status) => `<option value="${status}" ${state.adminOrderFilter === status ? "selected" : ""}>${statusLabel(status)}</option>`).join("")}
                    </select>
                </label>
            </section>
            ${Array.isArray(state.adminOrders) ? `
                ${state.adminOrders.length ? `
                    <div class="stack admin-orders-list">${state.adminOrders.map((order) => `
                        <form class="panel admin-order-card" data-admin-order="${Number(order.id)}">
                            <div class="admin-order-summary">
                                <div class="admin-order-customer">
                                    <strong>Pedido #${Number(order.id)}</strong>
                                    <span>${escapeHTML(order.user?.name ?? "Cliente")}</span>
                                    ${order.user?.email ? `<span class="text-secondary">${escapeHTML(order.user.email)}</span>` : ""}
                                </div>
                                <div class="admin-order-meta">
                                    <span class="order-status order-status--${statusClass(order.status)}">${statusLabel(order.status)}</span>
                                    <strong>${formatPrice(order.total)}</strong>
                                    <time datetime="${escapeHTML(order.created_at)}">${formatDateTime(order.created_at)}</time>
                                </div>
                            </div>
                            <div class="admin-order-actions">
                                <label>Avançar status
                                    <select class="form-control" name="status" required ${["delivered", "cancelled"].includes(order.status) ? "disabled" : ""}>
                                        <option value="" selected>${["delivered", "cancelled"].includes(order.status) ? "Pedido finalizado" : "Escolha uma transição"}</option>
                                        ${( {
                                            pending: ["paid", "cancelled"],
                                            paid: ["shipped"],
                                            shipped: ["delivered"],
                                            delivered: [],
                                            cancelled: [],
                                        }[order.status] ?? []).map((status) => `<option value="${status}">${statusLabel(status)}</option>`).join("")}
                                    </select>
                                </label>
                                <button class="btn btn-secondary" ${["delivered", "cancelled"].includes(order.status) ? "disabled" : ""}>Atualizar pedido</button>
                            </div>
                        </form>
                    `).join("")}</div>
                ` : `<p class="panel empty-state">Nenhum pedido encontrado${state.adminOrderFilter ? " com este status" : ""}.</p>`}
            ` : `<p class="text-secondary">Carregando pedidos...</p>`}
        ` : ""}
        ${section === "usuarios" ? `
            <h2>Usuários cadastrados</h2>
            ${Array.isArray(state.adminUsers) ? state.adminUsers.length ? `
                <div class="table-scroll">
                    <table class="admin-users-table">
                        <thead>
                            <tr>
                                <th scope="col">Nome</th>
                                <th scope="col">E-mail</th>
                                <th scope="col">Privilégio da conta</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.adminUsers.map((user) => `
                                <tr>
                                    <td>${escapeHTML(user.name)}</td>
                                    <td>${escapeHTML(user.email)}</td>
                                    <td>${user.role === "admin" ? "Administrador" : "Cliente"}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            ` : `<p class="text-secondary">Nenhum usuário cadastrado.</p>` : `<p class="text-secondary">Carregando usuários...</p>`}
        ` : ""}
    `;
}
