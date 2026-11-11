export function getCartItemCount(cart) {
    if (!cart || !Array.isArray(cart.items)) {
        return 0;
    }

    return cart.items.reduce(
        (total, item) => total + Number(item.quantity),
        0
    );
}
