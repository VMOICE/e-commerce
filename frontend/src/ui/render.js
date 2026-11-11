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
} from "../app/handlers/auth.js";
import {
    addProductToCart,
    changeCartItemQuantity,
    loadCart,
    removeProductFromCart,
} from "../app/handlers/cart.js";
import {
    confirmOrderPayment,
    cancelCustomerOrder,
    loadOrder,
    loadOrders,
    checkout,
} from "../app/handlers/orders.js";
import { loadCategories } from "../app/handlers/categories.js";
import { loadProducts } from "../app/handlers/products.js";
import { getCartItemCount } from "../domain/cart.js";
import { getState, setState, subscribe } from "../app/state.js";
import { escapeHTML } from "./format.js";
import {
    renderRoute,
    resolveHashRoute,
    routeRequiresAuthentication,
} from "./routes.js";

let feedbackId = 0;

function renderSidebar(state, page) {
    const activePage = ({
        inicio: "catalogo",
        produto: "catalogo",
        checkout: "carrinho",
        pedido: "pedidos",
    })[page] ?? page;
    const links = [
        ["▦", "Catálogo", "#catalogo", "catalogo"],
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
                    <a href="${href}" class="sidebar-link ${activePage === key ? "active" : ""}"
                        ${activePage === key ? 'aria-current="page"' : ""}>
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
                <a class="btn btn-secondary cart-indicator" href="#carrinho" aria-label="Carrinho, ${getCartItemCount(state.cart)} itens">
                    🛒 <span class="cart-count" aria-hidden="true">${getCartItemCount(state.cart)}</span>
                </a>
            </div>
        </header>
    `;
}

function showError(error) {
    const message = error.response?.data?.message
        ?? Object.values(error.response?.data?.errors ?? {}).flat()[0]
        ?? error.message
        ?? "Não foi possível concluir a operação.";

    if (!document.querySelector("#app")) {
        console.error(message, error);
        return;
    }

    showFeedback("error", message);
}

function showSuccess(message) {
    showFeedback("success", message);
}

function showFeedback(type, message) {
    const id = ++feedbackId;
    setState({ feedback: { id, type, message } });
    window.setTimeout(() => {
        if (getState().feedback?.id === id) {
            setState({ feedback: null });
        }
    }, 5000);
}

async function refreshAdminProducts(filters = getState().adminProductFilters ?? {}) {
    const activeFilters = { ...filters };
    if (!activeFilters.search) {
        delete activeFilters.search;
    }
    if (activeFilters.is_active === "") {
        delete activeFilters.is_active;
    }

    const response = await getAdminProducts(activeFilters);
    setState({
        adminProducts: response.data,
        adminProductFilters: activeFilters,
    });
}

function formValues(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function productFormData(form) {
    const values = new FormData(form);
    const image = values.get("image");
    if (!(image instanceof File) || image.size === 0) {
        values.delete("image");
    }

    values.set("category_id", String(Number(values.get("category_id"))));
    values.set("price", Number(values.get("price")).toFixed(2));
    values.set("stock", String(Number(values.get("stock"))));

    return values;
}

function validateRequiredFields(form) {
    const requiredFields = [...form.querySelectorAll("[required]:not(:disabled)")];
    const incompleteFields = requiredFields.filter((field) => !field.value.trim());

    form.querySelectorAll("[aria-invalid='true']").forEach((field) => {
        field.removeAttribute("aria-invalid");
    });

    if (incompleteFields.length) {
        incompleteFields.forEach((field) => field.setAttribute("aria-invalid", "true"));
        const labels = incompleteFields.map((field) =>
            field.closest("label")?.textContent.trim() ?? field.name
        );
        showError(new Error(`Preencha os campos obrigatórios: ${labels.join(", ")}.`));
        focusRenderedFormField(form, incompleteFields[0].name);
        return false;
    }

    const nameField = form.querySelector('input[name="name"]');
    if (nameField && !/^[\p{L}\s]+$/u.test(nameField.value.trim())) {
        nameField.setAttribute("aria-invalid", "true");
        showError(new Error("O campo Nome deve conter apenas letras e espaços."));
        focusRenderedFormField(form, nameField.name);
        return false;
    }

    const invalidField = requiredFields.find((field) => !field.checkValidity());
    if (invalidField) {
        invalidField.setAttribute("aria-invalid", "true");
        showError(new Error(`Verifique o campo ${invalidField.closest("label")?.textContent.trim() ?? invalidField.name}.`));
        focusRenderedFormField(form, invalidField.name);
        return false;
    }

    return true;
}

function focusRenderedFormField(form, fieldName) {
    const renderedForm = form.id ? document.getElementById(form.id) : null;
    const field = [...(renderedForm?.elements ?? [])].find((element) => element.name === fieldName);
    field?.setAttribute("aria-invalid", "true");
    field?.focus();
}

function bindEvents(app, page, id) {
    app.querySelector("#search-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await loadProducts({
                ...getState().productFilters,
                search: app.querySelector("#search-input").value.trim(),
                page: 1,
            });
            if (page !== "catalogo" && page !== "categorias") location.hash = "#catalogo";
        } catch (error) {
            showError(error);
        }
    });

    app.querySelectorAll('input[name="category"]').forEach((input) => {
        input.addEventListener("change", () => loadProducts({
            ...getState().productFilters,
            category_id: input.value,
            page: 1,
        }).catch(showError));
    });
    app.querySelectorAll("[data-category-select]").forEach((button) => {
        button.addEventListener("click", () => loadProducts({
            ...getState().productFilters,
            category_id: button.dataset.categorySelect,
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
    app.querySelector("#admin-product-filters")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = formValues(event.currentTarget);
        try {
            await refreshAdminProducts(values);
        } catch (error) { showError(error); }
    });
    app.querySelectorAll("[data-add-product]").forEach((button) => {
        button.addEventListener("click", async () => {
            button.disabled = true;
            try {
                await addProductToCart(Number(button.dataset.addProduct));
                showSuccess("Produto adicionado ao carrinho.");
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
            showSuccess("Produto adicionado ao carrinho.");
            location.hash = "#carrinho";
        } catch (error) {
            showError(error);
        }
    });

    app.querySelectorAll("[data-cart-form]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                await changeCartItemQuantity(
                    Number(form.dataset.cartForm),
                    Number(new FormData(form).get("quantity"))
                );
                showSuccess("Quantidade do item atualizada.");
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-remove-item]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await removeProductFromCart(Number(button.dataset.removeItem));
                showSuccess("Produto removido do carrinho.");
            } catch (error) { showError(error); }
        });
    });
    app.querySelector("#checkout-button")?.addEventListener("click", () => {
        if (!getState().isAuthenticated) sessionStorage.setItem("after-login", "#checkout");
        location.hash = getState().isAuthenticated ? "#checkout" : "#login";
    });

    app.querySelector("#auth-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!validateRequiredFields(form)) return;
        const values = formValues(form);
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
        const form = event.currentTarget;
        try {
            const response = await createAddress(formValues(form));
            form.reset();
            setState({
                addresses: [...(getState().addresses ?? []), response.data],
                addressesLoaded: true,
            });
            showSuccess("Endereço cadastrado com sucesso.");
        } catch (error) { showError(error); }
    });
    app.querySelector("#profile-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!validateRequiredFields(form)) return;
        try {
            const response = await updateMe(formValues(form));
            setState({ user: response.user });
            showSuccess("Perfil atualizado com sucesso.");
        } catch (error) { showError(error); }
    });
    app.querySelectorAll("[data-address-id]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                await updateAddress(form.dataset.addressId, formValues(form));
                const response = await getAddresses();
                setState({ addresses: response.data, addressesLoaded: true });
                showSuccess("Endereço atualizado com sucesso.");
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-delete-address]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await deleteAddress(button.dataset.deleteAddress);
                const response = await getAddresses();
                setState({ addresses: response.data, addressesLoaded: true });
                showSuccess("Endereço removido com sucesso.");
            } catch (error) { showError(error); }
        });
    });
    app.querySelector("#checkout-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const form = event.currentTarget;
            let addressId = new FormData(form).get("address_id");
            if (addressId === "new") {
                const values = Object.fromEntries(new FormData(form).entries());
                const address = await createAddress(values);
                addressId = address.data.id;
            }
            const order = await checkout(Number(addressId));
            setState({ selectedOrder: order });
            showSuccess("Pedido criado com sucesso. O pagamento é simulado.");
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
                showSuccess("Pagamento simulado confirmado com sucesso.");
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-cancel-order]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await cancelCustomerOrder(Number(button.dataset.cancelOrder));
                showSuccess("Pedido cancelado; o estoque foi devolvido.");
            } catch (error) { showError(error); }
        });
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
        const form = event.currentTarget;
        try {
            const values = productFormData(form);
            await createProduct(values);
            form.reset();
            await refreshAdminProducts({});
            showSuccess("Produto cadastrado com sucesso.");
        } catch (error) { showError(error); }
    });
    app.querySelector("#admin-category-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        try {
            await createCategory(formValues(form));
            form.reset();
            await loadCategories();
            showSuccess("Categoria cadastrada com sucesso.");
        } catch (error) { showError(error); }
    });
    app.querySelectorAll("[data-admin-product]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                const values = productFormData(form);
                values.set("is_active", values.get("is_active") === "1" ? "1" : "0");
                values.set("_method", "PUT");
                await updateProduct(form.dataset.adminProduct, values);
                await refreshAdminProducts();
                await loadProducts(getState().productFilters);
                showSuccess("Produto atualizado com sucesso.");
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-deactivate-product]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await deactivateProduct(button.dataset.deactivateProduct);
                await refreshAdminProducts();
                await loadProducts(getState().productFilters);
                showSuccess("Produto desativado com sucesso.");
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-admin-category]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                await updateCategory(form.dataset.adminCategory, formValues(form));
                await loadCategories();
                showSuccess("Categoria atualizada com sucesso.");
            } catch (error) { showError(error); }
        });
    });
    app.querySelectorAll("[data-delete-category]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await deleteCategory(button.dataset.deleteCategory);
                await loadCategories();
                showSuccess("Categoria excluída com sucesso.");
            } catch (error) { showError(error); }
        });
    });
    app.querySelector("#admin-status-filter")?.addEventListener("change", async (event) => {
        try {
            const status = event.target.value;
            const response = await getAdminOrders(status ? { status } : {});
            setState({ adminOrders: response.data, adminOrderFilter: status });
        } catch (error) { showError(error); }
    });
    app.querySelectorAll("[data-admin-order]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                const status = new FormData(form).get("status");
                await updateOrderStatus(form.dataset.adminOrder, status);
                const currentFilter = getState().adminOrderFilter;
                const orders = await getAdminOrders(currentFilter ? { status: currentFilter } : {});
                setState({ adminOrders: orders.data });
                showSuccess("Status do pedido atualizado com sucesso.");
            } catch (error) { showError(error); }
        });
    });
}

export function renderApp() {
    const app = document.querySelector("#app");
    if (!app) throw new Error("Elemento #app não encontrado.");
    const activeCartProduct = app.contains(document.activeElement)
        ? document.activeElement.closest("[data-cart-form]")?.dataset.cartForm ?? null
        : null;
    const state = getState();
    const { page, id } = resolveHashRoute();
    const requiresAuthentication = routeRequiresAuthentication(page);

    if (requiresAuthentication && !state.authInitialized) {
        app.innerHTML = `<main class="page-container"><p class="text-secondary">${state.error
            ? escapeHTML(state.error)
            : "Verificando sua sessão..."}</p></main>`;
        return;
    }

    if (requiresAuthentication && !state.isAuthenticated) {
        sessionStorage.setItem("after-login", location.hash);
        location.hash = "#login";
        return;
    }

    app.innerHTML = `
        <div class="app-layout">
            ${renderSidebar(state, page)}
            <main class="main-content">
                ${renderTopbar(state)}
                <div class="page-container">
                    <p class="page-message ${state.feedback?.type ?? ""}" role="${state.feedback?.type === "error" ? "alert" : "status"}" aria-live="${state.feedback?.type === "error" ? "assertive" : "polite"}">${escapeHTML(state.feedback?.message ?? "")}</p>
                    ${renderRoute(state, page, id, {
                        onError: showError,
                        refreshAdminProducts,
                    })}
                </div>
                <footer class="footer">MobileStore © ${new Date().getFullYear()} · Frete grátis</footer>
            </main>
        </div>
    `;
    bindEvents(app, page, id);

    if (activeCartProduct !== null) {
        app.querySelector(`[data-cart-form="${activeCartProduct}"] input[name="quantity"]`)
            ?.focus({ preventScroll: true });
    }
}

export function observeState() {
    subscribe(renderApp);
    window.addEventListener("hashchange", renderApp);
}
