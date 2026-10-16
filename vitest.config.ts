import { defineConfig } from "vitest/config";

export default defineConfig({
    esbuild: { jsx: "transform" },
    test: {
        environment: "jsdom",
        include: ["test/**/*.test.{ts,tsx}"],
        setupFiles: ["test/setup.ts"],
        restoreMocks: true,
        coverage: {
            include: ["src/**/*.{ts,tsx}"],
            exclude: ["src/env.d.ts"],
        },
    },
});
