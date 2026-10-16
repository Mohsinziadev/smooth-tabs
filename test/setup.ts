import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
    cleanup();
});

// jsdom has no layout engine and doesn't implement element scrolling.
// Give elements a scrollTo that just sets the scroll position.
if (typeof HTMLElement.prototype.scrollTo !== "function") {
    HTMLElement.prototype.scrollTo = function scrollTo(
        this: HTMLElement,
        options?: ScrollToOptions | number
    ) {
        if (typeof options === "object") {
            if (options.left !== undefined) this.scrollLeft = options.left;
            if (options.top !== undefined) this.scrollTop = options.top;
        }
    } as HTMLElement["scrollTo"];
}
