export function isProductAvailable(product) {
    return (
        product !== null &&
        product !== undefined &&
        product.is_active === true &&
        Number(product.stock) > 0
    );
}

export function hasStockForQuantity(product, quantity) {
    return (
        isProductAvailable(product) &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        Number(product.stock) >= quantity
    );
}