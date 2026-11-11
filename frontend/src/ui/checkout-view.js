import { getAddresses } from "../api/addresses.js";
import { setState } from "../app/state.js";
import { escapeHTML, formatPrice } from "./format.js";
import { addressFields } from "./auth-view.js";

export function renderCheckout(state, onError) {
    if (!state.isAuthenticated) {
        sessionStorage.setItem("after-login", "#checkout");
        return `<p>Entre ou crie uma conta para finalizar a compra. <a href="#login">Entrar</a></p>`;
    }
    if (!state.cart?.items?.length) return `<p>Seu carrinho está vazio.</p>`;

    if (!state.addressesLoaded) {
        getAddresses()
            .then((response) => setState({ addresses: response.data, addressesLoaded: true }))
            .catch(onError);
    }
    const addresses = state.addresses ?? [];
    const cartItems = state.cart.items;
    return `
        <h1 class="page-title">Finalizar compra</h1>
        <section class="checkout-summary panel">
            <h2>Resumo do pedido</h2>
            <ul class="checkout-items">
                ${cartItems.map((item) => `
                    <li class="checkout-item">
                        <span>${escapeHTML(item.product?.name ?? "Produto indisponível")} × ${Number(item.quantity)}</span>
                        <span>${formatPrice(item.product?.price ?? 0)} cada</span>
                        <strong>${formatPrice(item.subtotal)}</strong>
                    </li>
                `).join("")}
            </ul>
            <dl class="checkout-totals">
                <div><dt>Subtotal</dt><dd>${formatPrice(state.cart.subtotal)}</dd></div>
                <div><dt>Frete</dt><dd>Grátis</dd></div>
                <div><dt>Total</dt><dd>${formatPrice(state.cart.total ?? state.cart.subtotal)}</dd></div>
            </dl>
        </section>
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
