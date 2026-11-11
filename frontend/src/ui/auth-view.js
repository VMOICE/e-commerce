

export function renderAuth(register = false) {
    return `
        <section class="form-panel panel">
            <h1>${register ? "Criar conta" : "Entrar"}</h1>
            <form id="auth-form" class="stack" novalidate>
                ${register ? `<label>Nome<input class="form-control" name="name" autocomplete="name" required maxlength="255"></label>` : ""}
                <label>E-mail<input class="form-control" name="email" type="email" required maxlength="255" autocomplete="email"></label>
                <label>Senha<input class="form-control" name="password" type="password" required ${register ? "minlength=\"8\"" : ""}
                    autocomplete="${register ? "new-password" : "current-password"}"></label>
                ${register ? `<label>Confirmar senha<input class="form-control" name="password_confirmation" type="password" required minlength="8"></label>` : ""}
                <button class="btn">${register ? "Registrar" : "Entrar"}</button>
            </form>
            <p>${register ? `Já tem conta? <a href="#login">Entrar</a>` : `Ainda não tem conta? <a href="#registro">Cadastre-se</a>`}</p>
        </section>
    `;
}

export function addressFields(disabled = false) {
    const disabledAttribute = disabled ? "disabled" : "";
    return `
        <label>Nome de quem recebe<input class="form-control" name="recipient_name" required maxlength="150" ${disabledAttribute}></label>
        <label>CEP<input class="form-control" name="postal_code" type="text" inputmode="numeric"
            autocomplete="postal-code" placeholder="00000-000" pattern="[0-9]{5}-[0-9]{3}"
            title="Informe o CEP no formato 00000-000" required maxlength="9" ${disabledAttribute}></label>
        <label>Rua<input class="form-control" name="street" required maxlength="180" ${disabledAttribute}></label>
        <label>Número<input class="form-control" name="number" required maxlength="30" ${disabledAttribute}></label>
        <label>Bairro<input class="form-control" name="neighborhood" required maxlength="120" ${disabledAttribute}></label>
        <label>Cidade<input class="form-control" name="city" required maxlength="120" ${disabledAttribute}></label>
        <label>Estado<input class="form-control" name="state" required maxlength="80" ${disabledAttribute}></label>
    `;
}
