import { loadOrder } from "../app/handlers/orders.js";
import { setState } from "../app/state.js";
import { escapeHTML, formatDateTime, formatPrice, statusClass, statusLabel } from "./format.js";

const orderDetailRequests = new Set();

export function renderOrderList(state, includeTitle = true) {
    if (!state.isAuthenticated) {
        sessionStorage.setItem("after-login", "#pedidos");
        return `<p>Entre para visualizar seus pedidos. <a href="#login">Entrar</a></p>`;
    }
    const orders = state.orders ?? [];
    if (!orders.length) return `${includeTitle ? `<h1 class="page-title">Meus pedidos</h1>` : ""}<p>Você ainda não fez pedidos.</p>`;
    return `
        ${includeTitle ? `<h1 class="page-title">Meus pedidos</h1>` : ""}
        <div class="stack">${orders.map((order) => `
            <article class="panel order-row">
                <div>
                    <strong>Pedido #${Number(order.id)}</strong>
                    <span>${formatDateTime(order.created_at)}</span>
                    ${order.paid_at ? `<span>Pagamento: ${formatDateTime(order.paid_at)}</span>` : ""}
                </div>
                <span class="order-status order-status--${statusClass(order.status)}">${statusLabel(order.status)}</span>
                <strong>${formatPrice(order.total)}</strong>
                <button class="btn btn-secondary" type="button" data-order-detail="${Number(order.id)}">Detalhes</button>
                ${order.status === "pending" ? `<button class="btn" data-pay-order="${Number(order.id)}">Confirmar pagamento simulado</button><button class="btn btn-secondary" data-cancel-order="${Number(order.id)}">Cancelar</button>` : ""}
            </article>
        `).join("")}</div>
    `;
}

export function renderOrderDetail(state, id, onError) {
    const order = state.selectedOrder;
    if (!order || String(order.id) !== String(id)) {
        if (String(state.selectedOrderNotFoundId) === String(id)) {
            return `
                <section class="panel empty-state">
                    <h1>Pedido indisponível</h1>
                    <p>Este pedido não existe ou você não tem permissão para acessá-lo.</p>
                    <a class="btn" href="#pedidos">Voltar aos meus pedidos</a>
                </section>
            `;
        }

        if (!orderDetailRequests.has(String(id))) {
            orderDetailRequests.add(String(id));
            loadOrder(id)
                .then((data) => setState({
                    selectedOrder: data,
                    selectedOrderNotFoundId: null,
                }))
                .catch((error) => {
                    if (error.response?.status === 404) {
                        setState({ selectedOrderNotFoundId: String(id) });
                        return;
                    }
                    onError(error);
                })
                .finally(() => orderDetailRequests.delete(String(id)));
        }
        return `<p>Carregando pedido...</p>`;
    }
    return `
        <a href="#pedidos">← Voltar aos pedidos</a>
        <h1 class="page-title">Pedido #${Number(order.id)}</h1>
        <p>Status: <span class="order-status order-status--${statusClass(order.status)}">${statusLabel(order.status)}</span></p>
        ${order.paid_at ? `<p>Pagamento confirmado em: ${formatDateTime(order.paid_at)}</p>` : ""}
        <p>Endereço: ${escapeHTML(order.shipping_address?.street)}, ${escapeHTML(order.shipping_address?.number)} — ${escapeHTML(order.shipping_address?.city)}/${escapeHTML(order.shipping_address?.state)}</p>
        <ul class="panel">${(order.items ?? []).map((item) => `<li>${escapeHTML(item.product_name)} · ${Number(item.quantity)} × ${formatPrice(item.unit_price)} = ${formatPrice(item.subtotal)}</li>`).join("")}</ul>
        <strong>Total: ${formatPrice(order.total)}</strong>
        ${order.status === "pending" ? `<p><button class="btn" data-pay-order="${Number(order.id)}">Confirmar pagamento simulado</button> <button class="btn btn-secondary" data-cancel-order="${Number(order.id)}">Cancelar pedido</button></p>` : ""}
    `;
}
