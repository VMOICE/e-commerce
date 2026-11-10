import http from "./http.js";

export async function getCategories() {
    const response = await http.get("/categories");
    return response.data;
}

export async function createCategory(categoryData) {
    const response = await http.post("/admin/categories", categoryData);
    return response.data;
}

export async function updateCategory(id, categoryData) {
    const response = await http.put(`/admin/categories/${id}`, categoryData);
    return response.data;
}

export async function deleteCategory(id) {
    const response = await http.delete(`/admin/categories/${id}`);
    return response.data;
}