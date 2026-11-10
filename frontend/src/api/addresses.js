import http from "./http.js";

export async function getAddresses() {
    const response = await http.get("/addresses");
    return response.data;
}

export async function createAddress(address) {
    const response = await http.post("/addresses", address);
    return response.data;
}

export async function updateAddress(id, address) {
    const response = await http.patch(`/addresses/${id}`, address);
    return response.data;
}

export async function deleteAddress(id) {
    const response = await http.delete(`/addresses/${id}`);
    return response.data;
}
