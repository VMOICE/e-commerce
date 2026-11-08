import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deactivateProduct,
} from "../../../api/products.js";

export async function loadProducts(filters = {}) {
    try {
        return await getProducts(filters);
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        throw error;
    }
}

export async function loadProduct(id) {
    try {
        return await getProduct(id);
    } catch (error) {
        console.error("Erro ao carregar produto:", error);
        throw error;
    }
}

export async function registerProduct(productData) {
    try {
        return await createProduct(productData);
    } catch (error) {
        console.error("Erro ao cadastrar produto:", error);
        throw error;
    }
}

export async function editProduct(id, productData) {
    try {
        return await updateProduct(id, productData);
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        throw error;
    }
}

export async function removeProduct(id) {
    try {
        return await deactivateProduct(id);
    } catch (error) {
        console.error("Erro ao desativar produto:", error);
        throw error;
    }
}