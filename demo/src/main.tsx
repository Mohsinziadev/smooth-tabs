import * as React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "smooth-tabs/styles.css";
import "./demo.css";
import { App } from "./App";

const root = document.getElementById("root")!;
const app = (
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// `npm run build:site` prerenders the page; the dev server serves an empty root.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
