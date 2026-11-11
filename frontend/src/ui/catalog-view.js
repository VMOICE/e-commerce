import { loadProduct } from "../app/handlers/products.js";
import { setState } from "../app/state.js";
import { escapeHTML, formatPrice, productImage } from "./format.js";

const productDetailRequests = new Set();

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
    const image = productImage(product.image_path, product.category?.slug);
    return `
        <article class="product-card">
            <a class="product-image" href="#produto/${Number(product.id)}">
                <img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}">
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
    if (state.loading) return `<p class="text-secondary">Carregando produtos...</p>`;
    if (state.error) return `<p class="message error">${escapeHTML(state.error)}</p>`;

    if (categoriesOnly && !state.productFilters?.category_id) {
        return state.categories.length
            ? `<div class="category-grid">${state.categories.map((category) => `
                <button class="category-card" type="button" data-category-select="${Number(category.id)}">
                    <span class="category-card-icon" aria-hidden="true">▧</span>
                    <strong>${escapeHTML(category.name)}</strong>
                    <span>${Number(category.products_count ?? 0)} produtos</span>
                </button>
            `).join("")}</div>`
            : `<p class="empty-state">Nenhuma categoria disponível.</p>`;
    }

    const products = categoriesOnly
        ? state.products.filter((product) => Number(product.category_id) === Number(state.productFilters?.category_id))
        : state.products;

    if (!products.length) return `<p class="empty-state">Nenhum produto encontrado.</p>`;

    return `
        <div class="product-grid">${products.map(renderProductCard).join("")}</div>
        ${renderPagination(state)}
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

export function renderCatalogPage(state, categoriesOnly = false) {
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

export function renderProductDetail(state, id, onError) {
    const product = state.productDetail;
    if (!product || String(product.id) !== String(id)) {
        if (String(state.productDetailNotFoundId) === String(id)) {
            return `
                <section class="panel empty-state">
                    <h1>Produto não encontrado</h1>
                    <p>Este produto não existe ou não está disponível no momento.</p>
                    <a class="btn" href="#catalogo">Voltar ao catálogo</a>
                </section>
            `;
        }

        if (!productDetailRequests.has(String(id))) {
            productDetailRequests.add(String(id));
            loadProduct(id)
                .then((data) => setState({
                    productDetail: data,
                    productDetailNotFoundId: null,
                }))
                .catch((error) => {
                    if (error.response?.status === 404) {
                        setState({ productDetailNotFoundId: String(id) });
                        return;
                    }
                    onError(error);
                })
                .finally(() => productDetailRequests.delete(String(id)));
        }
        return `<p class="text-secondary">Carregando produto...</p>`;
    }
    const image = productImage(product.image_path, product.category?.slug);
    return `
        <a href="#catalogo">← Voltar ao catálogo</a>
        <article class="detail-layout panel">
            <div class="product-image detail-image">
                <img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}">
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
