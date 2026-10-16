import { defineConfig } from "tsup";

export default defineConfig({
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "es2019",
    external: ["react"],
    // Next.js App Router: the components use hooks, so mark the bundle as client code.
    banner: { js: '"use client";' },
    esbuildOptions(options) {
        options.jsx = "transform";
    },
    async onSuccess() {
        const { copyFile } = await import("node:fs/promises");
        await copyFile("src/styles.css", "dist/styles.css");
        // v4 path, for tools that ignore package.json "exports" (webpack 4, Jest).
        await copyFile("src/styles.css", "dist/index.css");
    },
});
