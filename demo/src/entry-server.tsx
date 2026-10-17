import * as React from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";

/** Used by scripts/build-site.mjs to prerender the landing page. */
export function render() {
    return renderToString(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
