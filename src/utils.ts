import React from "./react";
import type { TabValue } from "./types";

export const canUseDOM =
    typeof window !== "undefined" && typeof document !== "undefined";

/** `useLayoutEffect` on the client, `useEffect` during SSR (avoids React's warning). */
export const useIsomorphicLayoutEffect = canUseDOM
    ? React.useLayoutEffect
    : React.useEffect;

let idCounter = 0;
// Looked up dynamically so bundlers don't fail on React < 18, which has no useId.
const reactUseId = (React as { useId?: () => string })["useId"];

/** A stable unique id. Uses `React.useId` when available (SSR-safe on React 18+). */
export function useStableId(): string {
    // The branch taken is fixed for the app's lifetime, so hook order is stable.
    if (reactUseId) {
        return "rst" + reactUseId().replace(/:/g, "");
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [id] = React.useState(() => "rst-" + ++idCounter);
    return id;
}

function idSafe(value: TabValue): string {
    return String(value).replace(/\s+/g, "-");
}

/** The `id` attribute given to a tab when `idPrefix` is set. */
export function getTabId(idPrefix: string, value: TabValue): string {
    return `${idPrefix}-tab-${idSafe(value)}`;
}

/** The `id` your panel element should use so the tab's `aria-controls` points at it. */
export function getPanelId(idPrefix: string, value: TabValue): string {
    return `${idPrefix}-panel-${idSafe(value)}`;
}

export function prefersReducedMotion(): boolean {
    return (
        canUseDOM &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

export function smoothBehavior(): ScrollBehavior {
    return prefersReducedMotion() ? "auto" : "smooth";
}

/** `element.scrollTo` with a fallback for environments that lack it. */
export function scrollElementTo(
    el: Element,
    options: { left?: number; top?: number },
    behavior: ScrollBehavior
): void {
    if (typeof el.scrollTo === "function") {
        el.scrollTo({ ...options, behavior });
        return;
    }
    if (options.left !== undefined) el.scrollLeft = options.left;
    if (options.top !== undefined) el.scrollTop = options.top;
}

export function isRtl(el: Element): boolean {
    return getComputedStyle(el).direction === "rtl";
}

let isDev = false;
try {
    // Written as a literal so bundlers can replace it and strip warnings in production.
    isDev = process.env.NODE_ENV !== "production";
} catch {
    // No `process` global (unbundled ESM in a browser): stay quiet.
}

const warned = new Set<string>();

export function warnOnce(key: string, message: string): void {
    if (!isDev || warned.has(key)) return;
    warned.add(key);
    console.warn(`[smooth-tabs] ${message}`);
}
