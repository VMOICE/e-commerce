const state = {
    user: null,
    isAuthenticated: false,

    products: [],
    categories: [],

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
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}