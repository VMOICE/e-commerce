import http from "./http.js";

// Busca os produtos com filtros opcionais.
export async function getProducts(filters = {}) {
    const response = await http.get("/products", {
        params: filters,
    });
    return response.data;
}

// Busca um produto específico.
export async function getProduct(id) {
    const response = await http.get(`/products/${id}`);
    return response.data;
}

// Cadastra um produto.
export async function createProduct(productData) {
    const response = await http.post("/admin/products", productData);
    return response.data;
}

// Atualiza um produto.
export async function updateProduct(id, productData) {
    const response = await http.put(`/admin/products/${id}`, productData);
    return response.data;
}

// Desativa um produto.
export async function deactivateProduct(id) {
    const response = await http.delete(`/admin/products/${id}`);
    return response.data;
}