import { defineConfig } from "vite";

const apiProxyTarget =
    process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8081";

export default defineConfig({
    server: {
        proxy: {
            "/api": {
                target: apiProxyTarget,
            },
            "/sanctum": {
                target: apiProxyTarget,
            },
        },
    },
});
