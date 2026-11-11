import { escapeHTML, formatPrice } from "./format.js";

export function renderCart(state) {
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
                            max="${Math.min(Math.max(Number(product?.stock ?? 1), Number(item.quantity)), 1000)}"
                            step="1" value="${Number(item.quantity)}"
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
