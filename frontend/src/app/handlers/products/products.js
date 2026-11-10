import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deactivateProduct,
} from "../../../api/products.js";

import { getState, setState } from "../../state.js";

export async function loadProducts(filters = {}) {
    try {
        const response = await getProducts(filters);
        const products = response.data;

        setState({
            products,
            productFilters: filters,
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

export async function registerProduct(productData) {
    try {
        const response = await createProduct(productData);

        await loadProducts(getState().productFilters ?? {});

        return response;
    } catch (error) {
        console.error("Erro ao cadastrar produto:", error);
        throw error;
    }
}

export async function editProduct(id, productData) {
    try {
        const response = await updateProduct(id, productData);

        await loadProducts(getState().productFilters ?? {});

        return response;
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        throw error;
    }
}

export async function removeProduct(id) {
    try {
        const response = await deactivateProduct(id);

        await loadProducts(getState().productFilters ?? {});

        return response;
    } catch (error) {
        console.error("Erro ao desativar produto:", error);
        throw error;
    }
}