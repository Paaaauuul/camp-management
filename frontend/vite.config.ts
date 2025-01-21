import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        "process.env": process.env,
    },
    optimizeDeps: {
        exclude: ["lucide-react"],
    },
    resolve: {
        alias: {
            "@lib": path.resolve(__dirname, "src/lib"),
            "@components": path.resolve(__dirname, "src/components"),
            "@backend": path.resolve(__dirname, "../backend/src"), // Alias for supabase
        },
    },
});
