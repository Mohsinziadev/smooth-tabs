import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const src = (path) => fileURLToPath(new URL(`../src/${path}`, import.meta.url));

// The demo imports the package by name; point it at the source for live editing.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            {
                find: "smooth-tabs/styles.css",
                replacement: src("styles.css"),
            },
            { find: /^smooth-tabs$/, replacement: src("index.ts") },
        ],
    },
    build: { outDir: "dist", emptyOutDir: true },
});
