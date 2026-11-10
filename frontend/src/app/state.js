const state = {
    user: null,
    isAuthenticated: false,
    authInitialized: false,

    products: [],
    productFilters: {},
    productPagination: null,
    productDetail: null,
    productDetailNotFoundId: null,

    categories: [],
    addresses: [],
    addressesLoaded: false,

    cart: null,
    orders: [],

    loading: false,
    error: null,
};

const listeners = new Set();

export function getState() {
    return state;
}

export function setState(newState) {
    Object.assign(state, newState);

    listeners.forEach((listener) => {
        listener(state);
    });
}

export function subscribe(listener) {
    if (typeof listener !== "function") {
        throw new TypeError("O listener precisa ser uma função.");
    }

    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}