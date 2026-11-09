import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deactivateProduct,
} from "../../../api/products.js";

import { getState, setState } from "../../state.js";

// Carrega a lista de produtos.
export async function loadProducts(filters = {}) {
    try {
        const response = await getProducts(filters);
        const products = response.data;

        setState({ products });

        return products;
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        throw error;
    }
}

// Carrega um produto específico.
export async function loadProduct(id) {
    try {
        return await getProduct(id);
    } catch (error) {
        console.error("Erro ao carregar produto:", error);
        throw error;
    }
}

// Cadastra um novo produto e atualiza a lista.
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

// Atualiza um produto e atualiza a lista.
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

// Desativa um produto e atualiza a lista.
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