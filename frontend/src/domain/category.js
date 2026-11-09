export function hasCategoryProducts(category) {
    return (
        category !== null &&
        category !== undefined &&
        Number(category.products_count) > 0
    );
}

export function getCategoryProductCount(category) {
    if (!category || category.products_count === undefined) {
        return 0;
    }

    return Number(category.products_count);
}