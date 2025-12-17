import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    base: "/polish-trainer-pwa/",
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                name: "Polish Trainer",
                short_name: "Polish",
                start_url: "/polish-trainer-pwa/",
                scope: "/polish-trainer-pwa/",
                display: "standalone",
                background_color: "#242424",
                theme_color: "#242424",
                icons: [
                    { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
                    { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
                ],
            },
        }),
    ],
});
