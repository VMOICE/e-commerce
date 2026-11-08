import http from "./http.js";

/**
 * Consulta os produtos do catálogo.
 *
 * Filtros disponíveis:
 * search, category_id, sort e per_page.
 */
export async function getProducts(filters = {}) {
    const response = await http.get("/products", {
        params: filters,
    });

    return response.data;
}

/**
 * Consulta um produto específico.
 */
export async function getProduct(id) {
    const response = await http.get(`/products/${id}`);

    return response.data;
}

/**
 * Cadastra um novo produto.
 * Requer autenticação de administrador.
 */
export async function createProduct(productData) {
    const response = await http.post(
        "/admin/products",
        productData
    );

    return response.data;
}

/**
 * Atualiza os dados de um produto.
 * Requer autenticação de administrador.
 */
export async function updateProduct(id, productData) {
    const response = await http.put(
        `/admin/products/${id}`,
        productData
    );

    return response.data;
}

/**
 * Desativa um produto.
 * Requer autenticação de administrador.
 */
export async function deactivateProduct(id) {
    const response = await http.delete(
        `/admin/products/${id}`
    );

    return response.data;
}