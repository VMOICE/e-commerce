import http from "./http.js";

export async function getProducts(filters = {}) {
    const response = await http.get("/products", {
        params: filters,
    });
    return response.data;
}

export async function getAdminProducts(filters = {}) {
    const response = await http.get("/admin/products", { params: filters });
    return response.data;
}

export async function getProduct(id) {
    const response = await http.get(`/products/${id}`);
    return response.data;
}

export async function createProduct(productData) {
    const response = await http.post("/admin/products", productData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
}

export async function updateProduct(id, productData) {
    const response = await http.post(`/admin/products/${id}`, productData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
}

export async function deactivateProduct(id) {
    const response = await http.delete(`/admin/products/${id}`);
    return response.data;
}