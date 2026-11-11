import accessoryIllustration from "../assets/categories/acessorios.svg";
import audioIllustration from "../assets/categories/audio-e-acessorios.svg";
import protectionIllustration from "../assets/categories/capas-e-protecao.svg";
import chargingIllustration from "../assets/categories/carregadores-e-cabos.svg";

const storageBaseUrl = import.meta.env.VITE_STORAGE_BASE_URL
    ?? (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api")
        .replace(/\/api\/?$/, "/storage");
const categoryImagePaths = {
    "capas-e-protecao": protectionIllustration,
    "carregadores-e-cabos": chargingIllustration,
    "audio-e-acessorios": audioIllustration,
};

export function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    })[character]);
}

export function formatPrice(value) {
    return Number(value ?? 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

export function formatDateTime(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-BR");
}

export function productImage(imagePath, categorySlug) {
    if (/^https?:\/\//i.test(imagePath)) {
        return imagePath;
    }

    if (!imagePath || String(imagePath).startsWith("images/categories/")) {
        return categoryImagePaths[categorySlug] ?? accessoryIllustration;
    }

    return `${storageBaseUrl}/${String(imagePath).replace(/^\/+/, "")}`;
}

export function statusLabel(status) {
    return ({
        pending: "Aguardando pagamento",
        paid: "Pago",
        shipped: "Enviado",
        delivered: "Entregue",
        cancelled: "Cancelado",
    })[status] ?? status;
}

export function statusClass(status) {
    return ({
        pending: "pending",
        paid: "paid",
        shipped: "shipped",
        delivered: "delivered",
        cancelled: "cancelled",
    })[status] ?? "unknown";
}
