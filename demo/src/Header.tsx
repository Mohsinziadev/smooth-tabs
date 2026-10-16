import * as React from "react";
import { ScrollableTabs, getPanelId, getTabId } from "smooth-tabs";
import pkg from "../../package.json";

export const REPO = "https://github.com/Mohsinziadev/smooth-tabs";
export const NPM = "https://www.npmjs.com/package/smooth-tabs";
const DOCS = `${REPO}#readme`;
const API = `${REPO}#api`;

/** min+gzip of the full ESM build, from `npm run size`. Update when the build changes. */
const BUNDLE_SIZE = "3.4 kB";

const MANAGERS = [
    { value: "npm", command: `npm install ${pkg.name}` },
    { value: "pnpm", command: `pnpm add ${pkg.name}` },
    { value: "yarn", command: `yarn add ${pkg.name}` },
    { value: "bun", command: `bun add ${pkg.name}` },
];

const SNIPPET = `import { useState } from "react";
import { ScrollableTabs } from "smooth-tabs";
import "smooth-tabs/styles.css";

export function ProductTabs() {
  const [tab, setTab] = useState("overview");
  return (
    <ScrollableTabs
      aria-label="Product"
      tabs={tabs}
      value={tab}
      onChange={setTab}
    />
  );
}`;

// ---- Live npm data ------------------------------------------------------------

interface NpmStats {
    version?: string;
    downloads?: number;
    failed?: boolean;
}

function useNpmStats(name: string): NpmStats {
    const [stats, setStats] = React.useState<NpmStats>({});
    React.useEffect(() => {
        let cancelled = false;
        const json = (url: string) =>
            fetch(url).then((r) => {
                if (!r.ok) throw new Error(String(r.status));
                return r.json();
            });
        Promise.all([
            json(`https://registry.npmjs.org/${name}/latest`),
            json(`https://api.npmjs.org/downloads/point/last-month/${name}`),
        ])
            .then(([latest, downloads]) => {
                if (!cancelled) {
                    setStats({
                        version: latest.version,
                        downloads: downloads.downloads,
                    });
                }
            })
            .catch(() => {
                if (!cancelled) setStats({ failed: true });
            });
        return () => {
            cancelled = true;
        };
    }, [name]);
    return stats;
}

// ---- Copy to clipboard ---------------------------------------------------------

function copyText(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    // Fallback for non-secure origins (e.g. a LAN IP during development).
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
}

function CopyButton({ text, label }: { text: string; label: string }) {
    const [state, setState] = React.useState<"idle" | "copied" | "failed">(
        "idle"
    );
    const timer = React.useRef<number>();
    React.useEffect(() => () => window.clearTimeout(timer.current), []);
    const onClick = () => {
        copyText(text).then(
            () => setState("copied"),
            () => setState("failed")
        );
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setState("idle"), 1800);
    };
    return (
        <button
            type="button"
            className="copy"
            onClick={onClick}
            aria-label={label}
            data-state={state}
        >
            {state === "copied" ? <CheckIcon /> : <CopyIcon />}
            <span aria-live="polite">
                {state === "copied"
                    ? "Copied"
                    : state === "failed"
                    ? "Press ⌘C"
                    : "Copy"}
            </span>
        </button>
    );
}

// ---- Code highlighting (just enough for the snippet above) ------------------------

const TOKEN =
    /("[^"]*")|\b(import|from|export|function|const|return)\b|(<\/?[A-Z]\w*|\/?>)|([a-zA-Z-]+)(?==)|\b(useState)\b/g;

function highlight(code: string): React.ReactNode[] {
    const out: React.ReactNode[] = [];
    let last = 0;
    for (const m of code.matchAll(TOKEN)) {
        const i = m.index ?? 0;
        if (i > last) out.push(code.slice(last, i));
        const cls = m[1]
            ? "tk-str"
            : m[2]
            ? "tk-kw"
            : m[3]
            ? "tk-tag"
            : m[4]
            ? "tk-attr"
            : "tk-fn";
        out.push(
            <span key={i} className={cls}>
                {m[0]}
            </span>
        );
        last = i + m[0].length;
    }
    out.push(code.slice(last));
    return out;
}

// ---- Icons ------------------------------------------------------------------------

function CopyIcon() {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <rect
                x="5.5"
                y="5.5"
                width="8"
                height="8"
                rx="1.5"
                fill="none"
                stroke="currentColor"
            />
            <path
                d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"
                fill="none"
                stroke="currentColor"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
                d="M3 8.5l3 3 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function GitHubIcon() {
    return (
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
            />
        </svg>
    );
}

// ---- Pieces -------------------------------------------------------------------------

function Install() {
    const [manager, setManager] = React.useState("npm");
    const command =
        MANAGERS.find((m) => m.value === manager)?.command ??
        MANAGERS[0].command;
    return (
        <div className="install" id="install">
            <div className="install__bar">
                <ScrollableTabs
                    className="pm-tabs"
                    aria-label="Package manager"
                    idPrefix="pm"
                    arrows="never"
                    fade={false}
                    tabs={MANAGERS.map((m) => ({
                        value: m.value,
                        label: m.value,
                    }))}
                    value={manager}
                    onChange={setManager}
                />
                <CopyButton text={command} label="Copy install command" />
            </div>
            <pre
                className="install__cmd"
                role="tabpanel"
                id={getPanelId("pm", manager)}
                aria-labelledby={getTabId("pm", manager)}
            >
                <code>
                    <span className="prompt" aria-hidden="true">
                        ${" "}
                    </span>
                    {command}
                </code>
            </pre>
        </div>
    );
}

function Spec() {
    const npm = useNpmStats(pkg.name);
    const pending = !npm.failed && npm.version === undefined;
    const live = (value: string | undefined) =>
        pending ? (
            <span className="spec__pending">loading</span>
        ) : npm.failed ? (
            <span title="Couldn't reach the npm registry">—</span>
        ) : (
            value
        );
    const items: Array<{
        term: string;
        value: React.ReactNode;
        href?: string;
    }> = [
        {
            term: "Latest on npm",
            value: live(npm.version && `v${npm.version}`),
            href: NPM,
        },
        {
            term: "Downloads",
            value: live(
                npm.downloads === undefined
                    ? undefined
                    : `${new Intl.NumberFormat("en").format(
                          npm.downloads
                      )} / mo`
            ),
            href: `https://npm-stat.com/charts.html?package=${pkg.name}`,
        },
        { term: "Size (min+gzip)", value: BUNDLE_SIZE },
        { term: "Dependencies", value: "0" },
        { term: "TypeScript", value: "Types included" },
        {
            term: "React",
            value: pkg.peerDependencies.react.replace(">=", "≥ "),
        },
        {
            term: "License",
            value: pkg.license,
            href: `${REPO}/blob/main/LICENSE`,
        },
    ];
    return (
        <dl className="spec" aria-label="Package facts">
            {items.map((item) => (
                <div key={item.term} className="spec__item">
                    <dt>{item.term}</dt>
                    <dd>
                        {item.href ? (
                            <a href={item.href}>{item.value}</a>
                        ) : (
                            item.value
                        )}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

// ---- Header ---------------------------------------------------------------------------

export function SiteNav() {
    return (
        <header className="topbar">
            <div className="wrap topbar__inner">
                <a
                    className="brand"
                    href="#top"
                    aria-label={`${pkg.name} home`}
                >
                    <span className="brand__mark" aria-hidden="true" />
                    <span className="brand__name">{pkg.name}</span>
                </a>
                <nav className="topbar__nav" aria-label="Primary">
                    <a className="nav-optional" href="#install">
                        Install
                    </a>
                    <a className="nav-optional" href="#examples">
                        Examples
                    </a>
                    <a href={DOCS}>Docs</a>
                    <a className="nav-optional" href={API}>
                        API
                    </a>
                    <a className="topbar__gh" href={REPO}>
                        <GitHubIcon />
                        <span>GitHub</span>
                    </a>
                </nav>
            </div>
        </header>
    );
}

export function Hero() {
    return (
        <section className="hero" id="top" aria-labelledby="hero-title">
            <div className="wrap hero__grid">
                <div className="hero__intro">
                    <h1 id="hero-title" className="hero__title">
                        {pkg.name}
                    </h1>
                    <p className="hero__desc">
                        A React tab bar for content that doesn&rsquo;t fit.
                        Native scrolling with overflow-aware arrows, an animated
                        indicator, WAI‑ARIA keyboard support, and a{" "}
                        <code>useScrollSpy</code> hook that keeps tabs in sync
                        with page sections.
                    </p>
                    <Install />
                    <div className="hero__actions">
                        <a className="btn btn--primary" href={DOCS}>
                            Read the docs
                        </a>
                        <a className="btn" href={API}>
                            API reference
                        </a>
                        <a className="btn btn--ghost" href={REPO}>
                            <GitHubIcon />
                            Source
                        </a>
                    </div>
                </div>
                <figure className="snippet" aria-label="Usage example">
                    <figcaption className="snippet__bar">
                        <span className="snippet__file">ProductTabs.tsx</span>
                        <CopyButton text={SNIPPET} label="Copy usage example" />
                    </figcaption>
                    <pre tabIndex={0} aria-label="ProductTabs.tsx source">
                        <code>{highlight(SNIPPET)}</code>
                    </pre>
                </figure>
            </div>
            <div className="wrap">
                <Spec />
            </div>
        </section>
    );
}
