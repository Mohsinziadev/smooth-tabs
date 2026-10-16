// Reports the minified + compressed size of the built package, the way a
// consumer's bundler would see it (React excluded).
//
//   npm run build && npm run size

import { readFileSync } from "node:fs";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { build, transform } from "esbuild";

const kb = (n) => (n / 1024).toFixed(2) + " kB";

async function measure(label, code) {
    const buf = Buffer.from(code);
    console.log(
        `${label.padEnd(34)} min ${kb(buf.length).padStart(9)}   gzip ${kb(
            gzipSync(buf, { level: 9 }).length
        ).padStart(8)}   brotli ${kb(brotliCompressSync(buf).length).padStart(
            8
        )}`
    );
}

async function bundle(entry) {
    const result = await build({
        stdin: { contents: entry, resolveDir: process.cwd(), loader: "js" },
        bundle: true,
        minify: true,
        format: "esm",
        write: false,
        external: ["react"],
        logLevel: "silent",
        define: { "process.env.NODE_ENV": '"production"' },
    });
    return result.outputFiles[0].text;
}

await measure(
    "everything (ScrollableTabs + hook)",
    await bundle('export * from "./dist/index.js";')
);
await measure(
    "ScrollableTabs only (tree-shaken)",
    await bundle('export { ScrollableTabs } from "./dist/index.js";')
);
await measure(
    "useScrollSpy only (tree-shaken)",
    await bundle('export { useScrollSpy } from "./dist/index.js";')
);
const css = await transform(readFileSync("dist/styles.css", "utf8"), {
    loader: "css",
    minify: true,
});
await measure("styles.css", css.code);
