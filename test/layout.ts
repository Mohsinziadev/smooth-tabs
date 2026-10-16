// Helpers that fake the layout jsdom can't compute.

export function rect(
    left: number,
    top: number,
    width: number,
    height: number
): DOMRect {
    return {
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
    } as DOMRect;
}

export function setProps(el: Element, props: Record<string, number>): void {
    for (const [key, value] of Object.entries(props)) {
        Object.defineProperty(el, key, {
            configurable: true,
            writable: true,
            value,
        });
    }
}

/**
 * Lays out a horizontal strip: each tab is `tabWidth` wide with no gap, the
 * viewport is `viewportWidth` wide and starts at x = 0. Tab rects follow the
 * viewport's current scrollLeft, like a real browser.
 */
export function layoutHorizontal(
    root: HTMLElement,
    { viewportWidth, tabWidth }: { viewportWidth: number; tabWidth: number }
): { viewport: HTMLElement; tabs: HTMLElement[] } {
    const viewport = root.querySelector<HTMLElement>(".rst__viewport")!;
    const tabs = Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]'));
    let scrollLeft = 0;
    Object.defineProperty(viewport, "scrollLeft", {
        configurable: true,
        get: () => scrollLeft,
        set: (v: number) => {
            const max = tabs.length * tabWidth - viewportWidth;
            scrollLeft = Math.max(0, Math.min(v, Math.max(0, max)));
        },
    });
    setProps(viewport, {
        clientWidth: viewportWidth,
        scrollWidth: Math.max(viewportWidth, tabs.length * tabWidth),
    });
    viewport.getBoundingClientRect = () => rect(0, 0, viewportWidth, 40);
    tabs.forEach((tab, i) => {
        setProps(tab, { offsetLeft: i * tabWidth, offsetWidth: tabWidth });
        tab.getBoundingClientRect = () =>
            rect(i * tabWidth - scrollLeft, 0, tabWidth, 40);
    });
    return { viewport, tabs };
}
