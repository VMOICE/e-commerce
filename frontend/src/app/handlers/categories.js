import {
    getCategories,
} from "../../api/categories.js";

import { setState } from "../state.js";

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
