import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    base: "/polish-trainer-pwa/",
    plugins: [react()],
});
