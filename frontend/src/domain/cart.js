export function getCartItemCount(cart) {
    if (!cart || !Array.isArray(cart.items)) {
        return 0;
    }

    return cart.items.reduce(
        (total, item) => total + Number(item.quantity),
        0
    );
}

export function getCartSubtotal(cart) {
    if (!cart || !Array.isArray(cart.items)) {
        return 0;
    }

    return cart.items.reduce((total, item) => {
        const price = Number(item.product?.price ?? item.unit_price ?? 0);
        const quantity = Number(item.quantity);

        return total + price * quantity;
    }, 0);
}

export function isCartEmpty(cart) {
    return getCartItemCount(cart) === 0;
}