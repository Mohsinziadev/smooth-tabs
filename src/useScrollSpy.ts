import type { RefObject } from "react";
import React from "./react";
import { smoothBehavior } from "./utils";

export interface UseScrollSpyOptions {
    /**
     * Distance in pixels from the top of the scroll container at which a
     * section becomes active. Set it to the height of your sticky header.
     * @default 0
     */
    offset?: number;
    /**
     * The element that scrolls. Defaults to the window.
     * Accepts an element or a ref to one.
     */
    root?: HTMLElement | RefObject<HTMLElement | null> | null;
    /**
     * Scroll behavior used by `scrollTo`. Users who prefer reduced motion
     * always get `"auto"`. @default "smooth"
     */
    behavior?: ScrollBehavior;
    /** Turn tracking off without unmounting. @default true */
    enabled?: boolean;
}

export interface ScrollSpy<Id extends string> {
    /** The section currently at the top of the scroll container. */
    activeId: Id | undefined;
    /**
     * Scroll to a section. While the scroll is in progress the active id stays
     * on the target instead of flickering through the sections in between.
     */
    scrollTo: (id: Id) => void;
}

/** How long scrolling must pause before a programmatic scroll counts as finished. */
const SETTLE_MS = 120;

function resolveRoot(root: UseScrollSpyOptions["root"]): HTMLElement | null {
    if (!root) return null;
    if ("current" in root) return root.current;
    return root;
}

/**
 * Tracks which section (by element id) is currently in view, and scrolls to
 * sections on demand. Pair it with `ScrollableTabs` to build a sticky
 * category bar that follows the page:
 *
 * @example
 * const { activeId, scrollTo } = useScrollSpy(["intro", "pricing", "faq"], { offset: 64 });
 * <ScrollableTabs tabs={tabs} value={activeId} onChange={scrollTo} />
 */
export function useScrollSpy<Id extends string>(
    ids: readonly Id[],
    options: UseScrollSpyOptions = {}
): ScrollSpy<Id> {
    const { offset = 0, root, behavior = "smooth", enabled = true } = options;
    const [activeId, setActiveId] = React.useState<Id | undefined>(ids[0]);

    // Read inside event handlers; kept in refs so listeners aren't re-attached.
    const idsRef = React.useRef(ids);
    idsRef.current = ids;
    const offsetRef = React.useRef(offset);
    offsetRef.current = offset;
    const lockRef = React.useRef<{
        id: Id;
        timer: ReturnType<typeof setTimeout>;
    } | null>(null);

    const compute = React.useCallback((): Id | undefined => {
        const list = idsRef.current;
        const container = resolveRoot(root);
        const top = container ? container.getBoundingClientRect().top : 0;
        const line = top + offsetRef.current + 1;

        let current: Id | undefined;
        let last: Id | undefined;
        for (const id of list) {
            const el = document.getElementById(id);
            if (!el) continue;
            if (current === undefined) current = id;
            last = id;
            if (el.getBoundingClientRect().top <= line) current = id;
        }

        // Short final sections can never reach the top: activate the last one
        // once the container is scrolled to the bottom.
        const scrollTop = container ? container.scrollTop : window.scrollY;
        const viewHeight = container
            ? container.clientHeight
            : window.innerHeight;
        const scrollHeight = container
            ? container.scrollHeight
            : document.documentElement.scrollHeight;
        if (
            scrollTop > 0 &&
            scrollHeight > viewHeight &&
            scrollTop + viewHeight >= scrollHeight - 2
        ) {
            current = last;
        }
        return current;
    }, [root]);

    const idsKey = ids.join("\u0000");

    React.useEffect(() => {
        if (!enabled) return;
        const container = resolveRoot(root);
        const target: HTMLElement | Window = container ?? window;
        let frame = 0;

        const update = () => {
            frame = 0;
            const next = compute();
            setActiveId((prev) => (next === undefined ? prev : next));
        };
        const onScroll = () => {
            const lock = lockRef.current;
            if (lock) {
                // A programmatic scroll is running; release once it settles.
                clearTimeout(lock.timer);
                lock.timer = setTimeout(release, SETTLE_MS);
                return;
            }
            if (!frame) frame = requestAnimationFrame(update);
        };
        const release = () => {
            lockRef.current = null;
            update();
        };

        target.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        update();
        return () => {
            target.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
        // idsKey stands in for `ids` so a new array with the same ids is a no-op.
    }, [enabled, root, compute, idsKey]);

    React.useEffect(
        () => () => {
            if (lockRef.current) clearTimeout(lockRef.current.timer);
        },
        []
    );

    const scrollTo = React.useCallback(
        (id: Id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const container = resolveRoot(root);
            const resolvedBehavior =
                behavior === "smooth" ? smoothBehavior() : behavior;

            if (lockRef.current) clearTimeout(lockRef.current.timer);
            // If no scroll event arrives (already in place), release anyway.
            lockRef.current = {
                id,
                timer: setTimeout(() => {
                    lockRef.current = null;
                    setActiveId(compute() ?? id);
                }, SETTLE_MS * 2),
            };
            setActiveId(id);

            const rectTop = el.getBoundingClientRect().top;
            if (container) {
                const top =
                    container.scrollTop +
                    rectTop -
                    container.getBoundingClientRect().top -
                    offsetRef.current;
                container.scrollTo({ top, behavior: resolvedBehavior });
            } else {
                const top = window.scrollY + rectTop - offsetRef.current;
                window.scrollTo({ top, behavior: resolvedBehavior });
            }
        },
        [root, behavior, compute]
    );

    return { activeId, scrollTo };
}
