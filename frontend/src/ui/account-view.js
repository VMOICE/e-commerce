import { getAddresses } from "../api/addresses.js";
import { setState } from "../app/state.js";
import { escapeHTML } from "./format.js";
import { addressFields } from "./auth-view.js";
import { renderOrderList } from "./orders-view.js";

export function renderAccount(state, section = "perfil", onError) {
    const sections = [
        ["perfil", "Meu perfil"],
        ["enderecos", "Endereços"],
        ["pedidos", "Meus pedidos"],
    ];
    if (!sections.some(([key]) => key === section)) {
        section = "perfil";
    }

    if (section === "enderecos" && !state.addressesLoaded) {
        getAddresses()
            .then((response) => setState({ addresses: response.data, addressesLoaded: true }))
            .catch(onError);
    }
    return `
        <h1 class="page-title">Minha conta</h1>
        <nav class="account-tabs" aria-label="Seções da conta">
            ${sections.map(([key, label]) => `
                <a class="btn ${section === key ? "" : "btn-secondary"}"
                    href="#conta/${key}" ${section === key ? 'aria-current="page"' : ""}>${label}</a>
            `).join("")}
        </nav>
        ${section === "perfil" ? `
            <section class="panel form-panel">
                <form id="profile-form" class="stack" novalidate>
                    <h2>Dados pessoais</h2>
                    <label>Nome<input class="form-control" name="name" value="${escapeHTML(state.user?.name)}" required></label>
                    <label>E-mail<input class="form-control" name="email" type="email" value="${escapeHTML(state.user?.email)}" required></label>
                    <button class="btn">Salvar perfil</button>
                </form>
            </section>
        ` : ""}
        ${section === "enderecos" ? `
            <section class="account-section">
                <h2>Endereços salvos</h2>
                ${state.addressesLoaded
                    ? state.addresses?.length
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
                        : `<p>Nenhum endereço cadastrado.</p>`
                    : `<p class="text-secondary">Carregando endereços...</p>`}
                <h2>Adicionar endereço</h2>
                <form id="address-form" class="panel stack address-edit-form">${addressFields()}<button class="btn">Salvar endereço</button></form>
            </section>
        ` : ""}
        ${section === "pedidos" ? renderOrderList(state, false) : ""}
    `;
}
