import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../../../api/categories.js";

export async function loadCategories() {
    try {
        return await getCategories();
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        throw error;
    }
}

export async function registerCategory(categoryData) {
    try {
        return await createCategory(categoryData);
    } catch (error) {
        console.error("Erro ao cadastrar categoria:", error);
        throw error;
    }
}

export async function editCategory(id, categoryData) {
    try {
        return await updateCategory(id, categoryData);
    } catch (error) {
        console.error("Erro ao atualizar categoria:", error);
        throw error;
    }
}

export async function removeCategory(id) {
    try {
        return await deleteCategory(id);
    } catch (error) {
        console.error("Erro ao excluir categoria:", error);
        throw error;
    }
}