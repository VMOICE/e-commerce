import { loadProducts } from "../app/handlers/products/products.js";
import { addProductToCart } from "../app/handlers/cart/cart.js";
import { getCartItemCount } from "../domain/cart.js";
import { getState, subscribe } from "../app/state.js";

// Protege os valores dinâmicos inseridos no HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };

        return entities[character];
    });
}

// Formata valores monetários.
function formatPrice(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

// Gera o caminho da imagem do produto.
function getProductImage(imagePath) {
    if (!imagePath) {
        return null;
    }

    if (imagePath.startsWith("http")) {
        return imagePath;
    }

    return `http://localhost:8081/storage/${imagePath.replace(/^\/+/, "")}`;
}

// Menu lateral.
function renderSidebar() {
    const links = [
        { icon: "⌂", label: "Início", href: "#inicio" },
        { icon: "▦", label: "Produtos", href: "#catalogo" },
        { icon: "◇", label: "Categorias", href: "#categorias" },
        { icon: "🛒", label: "Carrinho", href: "#carrinho" },
        { icon: "▤", label: "Pedidos", href: "#pedidos" },
        { icon: "♙", label: "Minha conta", href: "#conta" },
    ];

    return `
        <aside class="sidebar">
            <a href="#inicio" class="sidebar-logo" aria-label="MobileStore">
                M
            </a>

            <nav class="sidebar-menu">
                ${links.map((link, index) => `
                    <a
                        href="${link.href}"
                        class="sidebar-link ${index === 0 ? "active" : ""}"
                        title="${link.label}"
                        aria-label="${link.label}"
                    >
                        ${link.icon}
                    </a>
                `).join("")}
            </nav>
        </aside>
    `;
}

// Barra superior.
function renderTopbar(state) {
    const cartCount = getCartItemCount(state.cart);

    const accountName = state.isAuthenticated
        ? state.user?.name ?? "Minha conta"
        : "Entrar";

    return `
        <header class="topbar">
            <a href="#inicio" class="logo">
                Mobile<span>Store</span>
            </a>

            <form class="topbar-search" id="search-form">
                <input
                    type="search"
                    class="form-control"
                    id="search-input"
                    placeholder="Pesquisar produtos..."
                    aria-label="Pesquisar produtos"
                    value="${escapeHTML(state.productFilters?.search ?? "")}"
                >
            </form>

            <div class="topbar-actions">
                <a href="#conta" class="sidebar-link" title="${escapeHTML(accountName)}">
                    ♙
                </a>

                <a href="#carrinho" class="sidebar-link" title="Carrinho">
                    🛒 ${cartCount}
                </a>
            </div>
        </header>
    `;
}

// Filtros laterais.
function renderFilters(state) {
    return `
        <aside class="panel catalog-filters">
            <div class="section-header">
                <h2>Filtros</h2>
                <button class="btn btn-outline" type="button" id="clear-filters">
                    Limpar
                </button>
            </div>

            <div class="section">
                <h3>Categorias</h3>

                ${state.categories.map((category) => `
                    <label class="filter-option">
                        <input
                            type="radio"
                            name="category"
                            value="${Number(category.id)}"
                            ${Number(state.productFilters?.category_id) === Number(category.id) ? "checked" : ""}
                        >
                        ${escapeHTML(category.name)}
                    </label>
                `).join("")}

                <label class="filter-option">
                    <input
                        type="radio"
                        name="category"
                        value=""
                        ${!state.productFilters?.category_id ? "checked" : ""}
                    >
                    Todas as categorias
                </label>
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

// Cartão individual do produto.
function renderProductCard(product) {
    const image = getProductImage(product.image_path);

    return `
        <article class="product-card">
            <div class="product-image">
                ${image
                    ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}">`
                    : `<span class="text-secondary">Sem imagem</span>`
                }
            </div>

            <div class="product-info">
                <span class="text-secondary">
                    ${escapeHTML(product.category?.name ?? "Acessório")}
                </span>

                <h3 class="product-name">
                    ${escapeHTML(product.name)}
                </h3>

                <p class="product-price">
                    ${formatPrice(product.price)}
                </p>

                <p class="product-stock">
                    ${Number(product.stock) > 0
                        ? `${Number(product.stock)} unidades disponíveis`
                        : "Produto indisponível"
                    }
                </p>

                <button
                    class="btn btn-primary"
                    type="button"
                    data-add-cart="${Number(product.id)}"
                    ${Number(product.stock) <= 0 ? "disabled" : ""}
                >
                    Adicionar ao carrinho
                </button>
            </div>
        </article>
    `;
}

// Catálogo de produtos.
function renderCatalog(state) {
    if (state.loading) {
        return "<p class='text-secondary'>Carregando produtos...</p>";
    }

    if (state.error) {
        return `<p class="text-secondary">${escapeHTML(state.error)}</p>`;
    }

    if (!state.products.length) {
        return "<p class='text-secondary'>Nenhum produto encontrado.</p>";
    }

    return `
        <div class="product-grid">
            ${state.products.map(renderProductCard).join("")}
        </div>
    `;
}

// Conteúdo principal.
function renderMainContent(state) {
    return `
        <main class="main-content">

            ${renderTopbar(state)}

            <div class="page-container" id="inicio">

                <div class="section-header">
                    <div>
                        <h1 class="page-title">Produtos</h1>
                        <p class="text-secondary">
                            Explore nossos acessórios para celular.
                        </p>
                    </div>

                    <span class="text-secondary">
                        ${state.products.length} produtos
                    </span>
                </div>

                <div class="catalog-layout">

                    ${renderFilters(state)}

                    <section id="catalogo">
                        ${renderCatalog(state)}
                    </section>

                </div>

            </div>

            <footer class="site-footer">
                <p>
                    MobileStore &copy; ${new Date().getFullYear()}
                    — Todos os direitos reservados.
                </p>
            </footer>

        </main>
    `;
}


function normalizeFilters(filters) {
    return Object.fromEntries(
        Object.entries(filters).filter(
            ([, value]) => value !== "" && value !== null && value !== undefined
        )
    );
}

function bindEvents() {
    // Busca de produtos.
    const searchForm = document.querySelector("#search-form");

    searchForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const search = document
            .querySelector("#search-input")
            .value.trim();

        try {
            await loadProducts(normalizeFilters({
                ...getState().productFilters,
                search,
            }));
        } catch (error) {
            console.error("Erro na busca:", error);
        }
    });

    // Filtro por categoria.
    document.querySelectorAll('input[name="category"]')
        .forEach((input) => {
            input.addEventListener("change", async () => {
                try {
                    await loadProducts(normalizeFilters({
                        ...getState().productFilters,
                        category_id: input.value,
                    }));
                } catch (error) {
                    console.error("Erro ao filtrar categoria:", error);
                }
            });
        });

    // Ordenação.
    document.querySelector("#sort-filter")
        ?.addEventListener("change", async (event) => {
            try {
                await loadProducts({
                    ...getState().productFilters,
                    sort: event.target.value,
                });
            } catch (error) {
                console.error("Erro ao ordenar produtos:", error);
            }
        });

    // Limpar filtros.
    document.querySelector("#clear-filters")
        ?.addEventListener("click", async () => {
            try {
                await loadProducts({
                    sort: "newest",
                });
            } catch (error) {
                console.error("Erro ao limpar filtros:", error);
            }
        });

    // Adicionar ao carrinho.
    document.querySelectorAll("[data-add-cart]")
        .forEach((button) => {
            button.addEventListener("click", async () => {
                const productId = Number(button.dataset.addCart);

                button.disabled = true;

                try {
                    await addProductToCart(productId);
                    alert("Produto adicionado ao carrinho!");
                } catch (error) {
                    console.error("Erro ao adicionar ao carrinho:", error);

                    alert(
                        error.response?.data?.message ??
                        "Não foi possível adicionar o produto ao carrinho."
                    );
                } finally {
                    button.disabled = false;
                }
            });
        });

}


// Renderiza toda a aplicação.
export function renderApp() {
    const app = document.querySelector("#app");
    const state = getState();

    if (!app) {
        throw new Error("Elemento #app não encontrado.");
    }

    app.innerHTML = `
        <div class="app-layout">
            ${renderSidebar()}
            ${renderMainContent(state)}
        </div>
    `;

    // Mantém a ordenação selecionada no estado.
    const sortFilter = document.querySelector("#sort-filter");

    if (sortFilter) {
        sortFilter.value = state.productFilters?.sort ?? "newest";
    }

    bindEvents();
}

// Observa as alterações do estado.
export function observeState() {
    subscribe(() => {
        renderApp();
    });
}