// Installs the packed tarball next to several React versions and checks that it
// renders on the server, mounts in a DOM, and responds to clicks and keys,
// through both `require` and `import`.
//
//   npm run build && npm run test:compat
//   REACT_VERSIONS="18 19" npm run test:compat

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const versions = (process.env.REACT_VERSIONS || "16.8.0 17 18 19").split(/\s+/);

const npm = (args, cwd) =>
    execFileSync("npm", args, { cwd, stdio: ["ignore", "pipe", "inherit"] })
        .toString()
        .trim();

const work = mkdtempSync(join(tmpdir(), "rst-compat-"));
// `npm pack` runs the `prepare` script, whose output precedes the JSON.
const packOutput = npm(["pack", "--json", "--pack-destination", work], root);
const tarball = join(
    work,
    JSON.parse(packOutput.slice(packOutput.indexOf("[")))[0].filename
);

const check = String.raw`
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const React = require("react");
const h = React.createElement;

async function run(lib, label) {
    const { ScrollableTabs, useScrollSpy } = lib;
    assert.equal(typeof useScrollSpy, "function");
    const tabs = [
        { value: "a", label: "Alpha" },
        { value: "b", label: "Beta", badge: { value: 3 } },
        { value: "c", label: "Gamma" },
    ];

    const html = require("react-dom/server").renderToString(
        h(ScrollableTabs, { tabs, defaultValue: "b", "aria-label": "T" })
    );
    assert.match(html, /role="tablist"/);
    assert.match(html, /aria-selected="true"[^>]*>.*?Beta/s);

    const dom = new JSDOM("<!doctype html><div id=root></div>", { pretendToBeVisual: true });
    for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "KeyboardEvent", "MouseEvent", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) {
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key] });
    }
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.getElementById("root");
    const changes = [];
    const element = h(ScrollableTabs, { tabs, onChange: (v) => changes.push(v) });

    const ReactDOM = require("react-dom");
    // Synchronous act() only: async act() arrived in React 16.9.
    const act = React.act || require("react-dom/test-utils").act;
    let unmount;
    try {
        const { createRoot } = require("react-dom/client");
        const r = createRoot(container);
        act(() => { r.render(element); });
        unmount = () => r.unmount();
    } catch (error) {
        if (error.code !== "MODULE_NOT_FOUND") throw error;
        act(() => { ReactDOM.render(element, container); });
        unmount = () => ReactDOM.unmountComponentAtNode(container);
    }

    const buttons = container.querySelectorAll('[role="tab"]');
    assert.equal(buttons.length, 3);
    assert.equal(buttons[0].getAttribute("aria-selected"), "true");
    act(() => { buttons[2].dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    assert.equal(buttons[2].getAttribute("aria-selected"), "true");
    act(() => { buttons[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); });
    assert.equal(document.activeElement, buttons[0]);
    assert.deepEqual(changes, ["c", "a"]);
    unmount();
    dom.window.close();
    console.log("  ok  " + label + "  react@" + React.version);
}

module.exports = run;
`;

let failed = false;
for (const version of versions) {
    const dir = join(work, `react-${version}`);
    execFileSync("mkdir", ["-p", dir]);
    writeFileSync(join(dir, "package.json"), '{"private":true}');
    npm(
        [
            "install",
            "--no-audit",
            "--no-fund",
            "--loglevel=error",
            `react@${version}`,
            `react-dom@${version}`,
            "jsdom@26",
            tarball,
        ],
        dir
    );
    writeFileSync(join(dir, "check.cjs"), check);
    writeFileSync(
        join(dir, "cjs.cjs"),
        `require("./check.cjs")(require("smooth-tabs"), "require").then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });`
    );
    writeFileSync(
        join(dir, "esm.mjs"),
        `import { createRequire } from "node:module";
const run = createRequire(import.meta.url)("./check.cjs");
const lib = await import("smooth-tabs");
await run(lib, "import ");
process.exit(0);`
    );
    for (const file of ["cjs.cjs", "esm.mjs"]) {
        try {
            const out = execFileSync("node", [file], {
                cwd: dir,
                timeout: 60_000,
                env: { ...process.env, NODE_ENV: "test" },
            }).toString();
            process.stdout.write(out);
        } catch (error) {
            failed = true;
            console.error(`  FAIL ${file} react@${version}`);
            console.error(error.stdout?.toString(), error.stderr?.toString());
        }
    }
}

rmSync(work, { recursive: true, force: true });
if (failed) process.exit(1);
console.log("All compatibility checks passed.");
