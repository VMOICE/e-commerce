import http from "./http.js";

/**
 * Consulta todas as categorias.
 */
export async function getCategories() {
    const response = await http.get("/categories");

    return response.data;
}

/**
 * Cadastra uma nova categoria.
 * Requer autenticação de administrador.
 */
export async function createCategory(categoryData) {
    const response = await http.post(
        "/admin/categories",
        categoryData
    );

    return response.data;
}

/**
 * Atualiza uma categoria existente.
 * Requer autenticação de administrador.
 */
export async function updateCategory(id, categoryData) {
    const response = await http.put(
        `/admin/categories/${id}`,
        categoryData
    );

    return response.data;
}

/**
 * Exclui uma categoria.
 * Requer autenticação de administrador.
 */
export async function deleteCategory(id) {
    const response = await http.delete(
        `/admin/categories/${id}`
    );

    return response.data;
}