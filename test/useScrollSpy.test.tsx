import * as React from "react";
import {
    act,
    fireEvent,
    render,
    renderHook,
    screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollableTabs, useScrollSpy } from "../src";
import { rect, setProps } from "./layout";

const IDS = ["intro", "pricing", "faq"] as const;
const SECTION_HEIGHT = 500;

/** Three stacked 500px sections; their rects follow window.scrollY. */
function mountSections() {
    let scrollY = 0;
    Object.defineProperty(window, "scrollY", {
        configurable: true,
        get: () => scrollY,
    });
    setProps(window as unknown as Element, { innerHeight: 400 });
    setProps(document.documentElement, {
        scrollHeight: IDS.length * SECTION_HEIGHT,
    });
    for (const [i, id] of IDS.entries()) {
        const el = document.createElement("section");
        el.id = id;
        el.getBoundingClientRect = () =>
            rect(0, i * SECTION_HEIGHT - scrollY, 800, SECTION_HEIGHT);
        document.body.appendChild(el);
    }
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(((
        options: ScrollToOptions
    ) => {
        scrollY = options.top ?? scrollY;
    }) as typeof window.scrollTo);
    return {
        scrollTo,
        scroll(y: number) {
            scrollY = y;
            window.dispatchEvent(new Event("scroll"));
        },
    };
}

beforeEach(() => {
    vi.useFakeTimers({
        toFake: [
            "setTimeout",
            "clearTimeout",
            "requestAnimationFrame",
            "cancelAnimationFrame",
        ],
    });
});

afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
});

function flush() {
    act(() => {
        vi.advanceTimersByTime(300);
    });
}

describe("useScrollSpy", () => {
    it("starts on the first section", () => {
        mountSections();
        const { result } = renderHook(() => useScrollSpy(IDS));
        expect(result.current.activeId).toBe("intro");
    });

    it("follows the section that crosses the offset line", () => {
        const page = mountSections();
        const { result } = renderHook(() => useScrollSpy(IDS, { offset: 60 }));
        act(() => page.scroll(430)); // pricing top is at 70: below the line
        flush();
        expect(result.current.activeId).toBe("intro");

        act(() => page.scroll(445)); // pricing top is at 55: above the line
        flush();
        expect(result.current.activeId).toBe("pricing");
    });

    it("activates the last section at the bottom of the page", () => {
        const page = mountSections();
        const { result } = renderHook(() => useScrollSpy(IDS));
        // Make the page end 300px into "faq" so its top can never reach the line.
        setProps(document.documentElement, { scrollHeight: 1300 });
        act(() => page.scroll(900)); // max scroll: 1300 - 400; faq top is at +100
        flush();
        expect(result.current.activeId).toBe("faq");
    });

    it("scrollTo scrolls the window to the section minus the offset", () => {
        const page = mountSections();
        const { result } = renderHook(() => useScrollSpy(IDS, { offset: 64 }));
        act(() => result.current.scrollTo("faq"));
        expect(page.scrollTo).toHaveBeenCalledWith({
            top: 1000 - 64,
            behavior: "smooth",
        });
        expect(result.current.activeId).toBe("faq");
    });

    it("keeps the target active while the smooth scroll passes other sections", () => {
        const page = mountSections();
        page.scrollTo.mockImplementation(() => {}); // the scroll happens over time
        const { result } = renderHook(() => useScrollSpy(IDS));

        act(() => result.current.scrollTo("faq"));
        // Simulated smooth-scroll frames passing through "pricing".
        for (const y of [200, 500, 700, 900]) {
            act(() => page.scroll(y));
            act(() => {
                vi.advanceTimersByTime(16);
            });
            expect(result.current.activeId).toBe("faq");
        }
        act(() => page.scroll(1000));
        flush(); // scrolling settled
        expect(result.current.activeId).toBe("faq");

        // Normal tracking resumes afterwards.
        act(() => page.scroll(100));
        flush();
        expect(result.current.activeId).toBe("intro");
    });

    it("ignores ids with no matching element", () => {
        mountSections();
        const { result } = renderHook(() => useScrollSpy(["missing", ...IDS]));
        flush();
        expect(result.current.activeId).toBe("intro");
    });

    it("tracks a custom scroll container", () => {
        mountSections();
        const container = document.createElement("div");
        let top = 0;
        Object.defineProperty(container, "scrollTop", {
            configurable: true,
            get: () => top,
        });
        setProps(container, { clientHeight: 400, scrollHeight: 1500 });
        container.getBoundingClientRect = () => rect(0, 100, 800, 400);
        container.scrollTo = vi.fn() as unknown as typeof container.scrollTo;
        // Sections are positioned relative to the container's top (100).
        for (const [i, id] of IDS.entries()) {
            document.getElementById(id)!.getBoundingClientRect = () =>
                rect(0, 100 + i * SECTION_HEIGHT - top, 800, SECTION_HEIGHT);
        }
        const { result } = renderHook(() =>
            useScrollSpy(IDS, { root: container })
        );
        top = 600;
        act(() => {
            container.dispatchEvent(new Event("scroll"));
        });
        flush();
        expect(result.current.activeId).toBe("pricing");

        act(() => result.current.scrollTo("faq"));
        expect(container.scrollTo).toHaveBeenCalledWith({
            top: 600 + (100 + 1000 - 600) - 100,
            behavior: "smooth",
        });
    });

    it("does nothing while disabled", () => {
        const page = mountSections();
        const { result } = renderHook(() =>
            useScrollSpy(IDS, { enabled: false })
        );
        act(() => page.scroll(700));
        flush();
        expect(result.current.activeId).toBe("intro");
    });

    it("uses instant scrolling for users who prefer reduced motion", () => {
        const page = mountSections();
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        const { result } = renderHook(() => useScrollSpy(IDS));
        act(() => result.current.scrollTo("pricing"));
        expect(page.scrollTo).toHaveBeenCalledWith({
            top: 500,
            behavior: "auto",
        });
        delete (window as { matchMedia?: unknown }).matchMedia;
    });

    it("drives ScrollableTabs end to end", () => {
        const page = mountSections();
        function Nav() {
            const { activeId, scrollTo } = useScrollSpy(IDS);
            return (
                <ScrollableTabs
                    tabs={IDS.map((id) => ({ value: id, label: id }))}
                    value={activeId}
                    onChange={scrollTo}
                />
            );
        }
        render(<Nav />);
        act(() => page.scroll(600));
        flush();
        expect(screen.getByRole("tab", { name: "pricing" })).toHaveAttribute(
            "aria-selected",
            "true"
        );

        fireEvent.click(screen.getByRole("tab", { name: "faq" }));
        expect(page.scrollTo).toHaveBeenLastCalledWith({
            top: 1000,
            behavior: "smooth",
        });
        expect(screen.getByRole("tab", { name: "faq" })).toHaveAttribute(
            "aria-selected",
            "true"
        );
    });
});
