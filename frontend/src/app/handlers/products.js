import {
    getProducts,
    getProduct,
} from "../../api/products.js";

import { getState, setState } from "../state.js";

export async function loadProducts(filters = {}) {
    try {
        const normalizedFilters = { ...filters };
        if (!normalizedFilters.category_id) {
            delete normalizedFilters.category_id;
        }
        if (!normalizedFilters.search) {
            delete normalizedFilters.search;
        }

        const response = await getProducts(normalizedFilters);
        const products = response.data;

        setState({
            products,
            productFilters: normalizedFilters,
            productPagination: {
                currentPage: response.meta?.current_page ?? 1,
                lastPage: response.meta?.last_page ?? 1,
                total: response.meta?.total ?? products.length,
            },
        });

        return products;
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        throw error;
    }
}

export async function loadProduct(id) {
    try {
        const response = await getProduct(id);
        return response.data;
    } catch (error) {
        if (error.response?.status !== 404) {
            console.error("Erro ao carregar produto:", error);
        }
        throw error;
    }
}
