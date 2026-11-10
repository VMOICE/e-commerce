import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../../../api/categories.js";

import { setState } from "../../state.js";

export async function loadCategories() {
    try {
        const response = await getCategories();
        const categories = response.data;

        setState({ categories });

        return categories;
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        throw error;
    }
}

export async function registerCategory(categoryData) {
    try {
        const response = await createCategory(categoryData);

        await loadCategories();

        return response;
    } catch (error) {
        console.error("Erro ao cadastrar categoria:", error);
        throw error;
    }
}

export async function editCategory(id, categoryData) {
    try {
        const response = await updateCategory(id, categoryData);

        await loadCategories();

        return response;
    } catch (error) {
        console.error("Erro ao atualizar categoria:", error);
        throw error;
    }
}

export async function removeCategory(id) {
    try {
        const response = await deleteCategory(id);

        await loadCategories();

        return response;
    } catch (error) {
        console.error("Erro ao excluir categoria:", error);
        throw error;
    }
}