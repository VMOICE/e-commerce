const state = {
    user: null,
    isAuthenticated: false,

    products: [],
    productFilters: {},

    categories: [],

    cart: null,
    orders: [],

    loading: false,
    error: null,
};

const listeners = new Set();

// Retorna o estado atual da aplicação.
export function getState() {
    return state;
}

// Atualiza o estado e notifica os inscritos.
export function setState(newState) {
    Object.assign(state, newState);

    listeners.forEach((listener) => {
        listener(state);
    });
}

// Registra uma função para acompanhar alterações.
export function subscribe(listener) {
    if (typeof listener !== "function") {
        throw new TypeError("O listener precisa ser uma função.");
    }

    listeners.add(listener);

    // Retorna uma função para cancelar a inscrição.
    return () => {
        listeners.delete(listener);
    };
}