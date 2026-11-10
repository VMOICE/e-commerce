import http from "./http.js";

export async function getAdminUsers() {
    const response = await http.get("/admin/users");
    return response.data;
}
