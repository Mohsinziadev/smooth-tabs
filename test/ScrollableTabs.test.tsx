import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScrollableTabs, getPanelId, getTabId } from "../src";
import type { ScrollableTabsProps, TabItem } from "../src";
import { layoutHorizontal } from "./layout";

const TABS: TabItem[] = [
    { value: "overview", label: "Overview" },
    { value: "pricing", label: "Pricing" },
    { value: "reviews", label: "Reviews" },
    { value: "faq", label: "FAQ" },
];

function tab(name: string) {
    return screen.getByRole("tab", { name });
}

function Controlled(
    props: Partial<ScrollableTabsProps> & { initial?: string }
) {
    const [value, setValue] = React.useState(props.initial ?? "overview");
    return (
        <ScrollableTabs
            aria-label="Sections"
            tabs={TABS}
            value={value}
            onChange={setValue}
            {...props}
        />
    );
}

function resize() {
    act(() => {
        window.dispatchEvent(new Event("resize"));
    });
}

describe("rendering and ARIA", () => {
    it("renders a labelled tablist with one tab per item", () => {
        render(<ScrollableTabs aria-label="Sections" tabs={TABS} />);
        const list = screen.getByRole("tablist", { name: "Sections" });
        expect(list).toHaveAttribute("aria-orientation", "horizontal");
        expect(screen.getAllByRole("tab")).toHaveLength(4);
    });

    it("marks only the selected tab with aria-selected and tabIndex 0", () => {
        render(<Controlled initial="reviews" />);
        for (const t of screen.getAllByRole("tab")) {
            const selected = t.textContent === "Reviews";
            expect(t).toHaveAttribute("aria-selected", String(selected));
            expect(t).toHaveAttribute("tabindex", selected ? "0" : "-1");
        }
    });

    it("adds aria-controls only when idPrefix is set, matching getPanelId", () => {
        const { rerender } = render(<ScrollableTabs tabs={TABS} />);
        expect(tab("Pricing")).not.toHaveAttribute("aria-controls");

        rerender(<ScrollableTabs tabs={TABS} idPrefix="product" />);
        expect(tab("Pricing")).toHaveAttribute(
            "aria-controls",
            getPanelId("product", "pricing")
        );
        expect(tab("Pricing")).toHaveAttribute(
            "id",
            getTabId("product", "pricing")
        );
    });

    it("generates ids that never contain whitespace", () => {
        render(
            <ScrollableTabs
                idPrefix="x"
                tabs={[{ value: "two words", label: "Two" }]}
            />
        );
        expect(tab("Two").id).toBe("x-tab-two-words");
    });

    it("renders icons and badges, including the legacy qty object", () => {
        render(
            <ScrollableTabs
                tabs={[
                    {
                        value: "a",
                        label: "Inbox",
                        icon: <svg data-testid="icon" />,
                        badge: { value: 0, color: "red" },
                    },
                    { value: "b", label: "Sent", badge: <b>new</b> },
                    {
                        value: "c",
                        label: "Spam",
                        qty: { value: "12", color: "#f00" },
                    },
                ]}
            />
        );
        expect(screen.getByTestId("icon")).toBeInTheDocument();
        const badges = document.querySelectorAll(".rst__badge");
        expect(badges).toHaveLength(3);
        expect(badges[0]).toHaveTextContent("0");
        expect(badges[0]).toHaveStyle({ background: "red" });
        expect(badges[1].querySelector("b")).toHaveTextContent("new");
        expect(badges[2]).toHaveTextContent("12");
    });

    it("passes className, style and other attributes to the root", () => {
        const ref = React.createRef<HTMLDivElement>();
        render(
            <ScrollableTabs
                ref={ref}
                tabs={TABS}
                className="mine"
                style={{ maxWidth: 300 }}
                data-testid="root"
                activeColor="hotpink"
            />
        );
        const root = screen.getByTestId("root");
        expect(ref.current).toBe(root);
        expect(root).toHaveClass("rst", "rst--horizontal", "mine");
        expect(root.style.maxWidth).toBe("300px");
        expect(root.style.getPropertyValue("--rst-active-color")).toBe(
            "hotpink"
        );
    });

    it("handles values that would break a CSS selector", async () => {
        const onChange = vi.fn();
        render(
            <ScrollableTabs
                tabs={[
                    { value: 'say "hi"', label: "Quote" },
                    { value: "a]b", label: "Bracket" },
                ]}
                onChange={onChange}
            />
        );
        await userEvent.click(tab("Bracket"));
        expect(onChange).toHaveBeenCalledWith("a]b", expect.anything());
    });

    it("renders on the server without touching the DOM", async () => {
        const { renderToString } = await import("react-dom/server");
        const html = renderToString(<ScrollableTabs tabs={TABS} />);
        expect(html).toContain('role="tablist"');
        expect(html).toContain('aria-selected="true"');
    });
});

describe("selection", () => {
    it("is uncontrolled by default and selects the first enabled tab", async () => {
        const onChange = vi.fn();
        render(
            <ScrollableTabs
                tabs={[{ value: "x", label: "X", disabled: true }, ...TABS]}
                onChange={onChange}
            />
        );
        expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
        await userEvent.click(tab("FAQ"));
        expect(tab("FAQ")).toHaveAttribute("aria-selected", "true");
        expect(onChange).toHaveBeenCalledWith("faq", TABS[3]);
    });

    it("respects defaultValue", () => {
        render(<ScrollableTabs tabs={TABS} defaultValue="pricing" />);
        expect(tab("Pricing")).toHaveAttribute("aria-selected", "true");
    });

    it("selects the first tab once tabs arrive asynchronously", () => {
        const { rerender } = render(<ScrollableTabs tabs={[]} />);
        rerender(<ScrollableTabs tabs={TABS} />);
        expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
    });

    it("in controlled mode only changes when the parent updates value", async () => {
        const onChange = vi.fn();
        render(
            <ScrollableTabs tabs={TABS} value="overview" onChange={onChange} />
        );
        await userEvent.click(tab("Reviews"));
        expect(onChange).toHaveBeenCalledWith("reviews", TABS[2]);
        expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
    });

    it("allows no selection with value={null}", () => {
        render(<ScrollableTabs tabs={TABS} value={null} />);
        for (const t of screen.getAllByRole("tab")) {
            expect(t).toHaveAttribute("aria-selected", "false");
        }
        // The first tab stays reachable with the Tab key.
        expect(tab("Overview")).toHaveAttribute("tabindex", "0");
    });

    it("does not fire onChange when the selected tab is clicked again", async () => {
        const onChange = vi.fn();
        render(<Controlled onChange={onChange} />);
        await userEvent.click(tab("Overview"));
        expect(onChange).not.toHaveBeenCalled();
    });

    it("ignores clicks on disabled tabs", async () => {
        const onChange = vi.fn();
        render(
            <ScrollableTabs
                tabs={[...TABS, { value: "off", label: "Off", disabled: true }]}
                onChange={onChange}
            />
        );
        expect(tab("Off")).toBeDisabled();
        await userEvent.click(tab("Off"));
        expect(onChange).not.toHaveBeenCalled();
    });

    it("supports numeric values with inferred types", async () => {
        const onChange = vi.fn<(value: number) => void>();
        render(
            <ScrollableTabs
                tabs={[
                    { value: 1, label: "One" },
                    { value: 2, label: "Two" },
                ]}
                defaultValue={1}
                onChange={onChange}
            />
        );
        await userEvent.click(tab("Two"));
        expect(onChange).toHaveBeenCalledWith(2, expect.anything());
    });
});

describe("keyboard navigation", () => {
    it("moves with arrow keys, wraps, and skips disabled tabs", async () => {
        const user = userEvent.setup();
        render(
            <Controlled
                tabs={[
                    TABS[0],
                    { ...TABS[1], disabled: true },
                    TABS[2],
                    TABS[3],
                ]}
            />
        );
        await user.click(tab("Overview"));
        await user.keyboard("{ArrowRight}");
        expect(tab("Reviews")).toHaveFocus();
        expect(tab("Reviews")).toHaveAttribute("aria-selected", "true");

        await user.keyboard("{ArrowRight}{ArrowRight}");
        expect(tab("Overview")).toHaveFocus();

        await user.keyboard("{ArrowLeft}");
        expect(tab("FAQ")).toHaveFocus();
    });

    it("supports Home and End", async () => {
        const user = userEvent.setup();
        render(<Controlled />);
        await user.click(tab("Pricing"));
        await user.keyboard("{End}");
        expect(tab("FAQ")).toHaveFocus();
        await user.keyboard("{Home}");
        expect(tab("Overview")).toHaveFocus();
    });

    it("in manual mode moves focus without selecting until Enter", async () => {
        const user = userEvent.setup();
        render(<Controlled activation="manual" />);
        await user.click(tab("Overview"));
        await user.keyboard("{ArrowRight}");
        expect(tab("Pricing")).toHaveFocus();
        expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
        await user.keyboard("{Enter}");
        expect(tab("Pricing")).toHaveAttribute("aria-selected", "true");
    });

    it("uses Up/Down in vertical orientation", async () => {
        const user = userEvent.setup();
        render(<Controlled orientation="vertical" />);
        expect(screen.getByRole("tablist")).toHaveAttribute(
            "aria-orientation",
            "vertical"
        );
        await user.click(tab("Overview"));
        await user.keyboard("{ArrowRight}");
        expect(tab("Overview")).toHaveFocus();
        await user.keyboard("{ArrowDown}");
        expect(tab("Pricing")).toHaveFocus();
        await user.keyboard("{ArrowUp}");
        expect(tab("Overview")).toHaveFocus();
    });

    it("flips arrow keys in right-to-left layouts", async () => {
        // jsdom doesn't inherit `direction`; a browser reports "rtl" under dir="rtl".
        const real = window.getComputedStyle.bind(window);
        vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
            const style = real(el);
            Object.defineProperty(style, "direction", { value: "rtl" });
            return style;
        });
        const user = userEvent.setup();
        render(<Controlled />);
        await user.click(tab("Overview"));
        await user.keyboard("{ArrowLeft}");
        expect(tab("Pricing")).toHaveFocus();
    });
});

describe("overflow and scroll buttons", () => {
    it("hides arrows in auto mode while everything fits", () => {
        const { container } = render(<Controlled />);
        layoutHorizontal(container.firstElementChild as HTMLElement, {
            viewportWidth: 1000,
            tabWidth: 100,
        });
        resize();
        expect(container.querySelector(".rst__arrow")).toBeNull();
    });

    it("shows arrows on overflow and disables the one at the current edge", () => {
        const { container } = render(<Controlled />);
        const root = container.firstElementChild as HTMLElement;
        layoutHorizontal(root, { viewportWidth: 250, tabWidth: 100 });
        resize();
        const prev = container.querySelector(".rst__arrow--prev")!;
        const next = container.querySelector(".rst__arrow--next")!;
        expect(prev).toBeDisabled();
        expect(next).toBeEnabled();
        expect(root).toHaveClass("rst--overflow-end");
        expect(root).not.toHaveClass("rst--overflow-start");
        // Arrows are a pointer convenience, hidden from assistive tech.
        expect(next).toHaveAttribute("aria-hidden", "true");
        expect(next).toHaveAttribute("tabindex", "-1");
    });

    it("scrolls by most of a page when an arrow is clicked", () => {
        const { container } = render(<Controlled />);
        const root = container.firstElementChild as HTMLElement;
        const { viewport } = layoutHorizontal(root, {
            viewportWidth: 250,
            tabWidth: 100,
        });
        resize();
        fireEvent.click(container.querySelector(".rst__arrow--next")!);
        expect(viewport.scrollLeft).toBe(150); // 0.8 * 250 = 200, clamped to max 150
        resize();
        expect(root).toHaveClass("rst--overflow-start");
        expect(container.querySelector(".rst__arrow--next")).toBeDisabled();
    });

    it("never renders arrows with arrows='never', always with 'always'", () => {
        const { container, rerender } = render(
            <ScrollableTabs tabs={TABS} arrows="never" />
        );
        layoutHorizontal(container.firstElementChild as HTMLElement, {
            viewportWidth: 100,
            tabWidth: 100,
        });
        resize();
        expect(container.querySelector(".rst__arrow")).toBeNull();
        rerender(<ScrollableTabs tabs={TABS} arrows="always" />);
        expect(container.querySelectorAll(".rst__arrow")).toHaveLength(2);
    });

    it("selects adjacent tabs with arrowAction='select'", () => {
        const { container } = render(
            <Controlled arrows="always" arrowAction="select" />
        );
        const prev = container.querySelector(".rst__arrow--prev")!;
        expect(prev).toBeDisabled();
        fireEvent.click(container.querySelector(".rst__arrow--next")!);
        expect(tab("Pricing")).toHaveAttribute("aria-selected", "true");
    });

    it("accepts custom arrow icons, treating strings as image URLs", () => {
        const { container } = render(
            <ScrollableTabs
                tabs={TABS}
                arrows="always"
                prevIcon="/left.svg"
                nextIcon={<span data-testid="next">→</span>}
            />
        );
        expect(
            container.querySelector(".rst__arrow--prev img")
        ).toHaveAttribute("src", "/left.svg");
        expect(screen.getByTestId("next")).toBeInTheDocument();
    });
});

describe("scrolling the selected tab into view", () => {
    it("scrolls only the tab strip, never the page", () => {
        const scrollIntoView = vi.fn();
        Element.prototype.scrollIntoView = scrollIntoView;
        const windowScroll = vi
            .spyOn(window, "scrollTo")
            .mockImplementation(() => {});

        const { container, rerender } = render(
            <ScrollableTabs tabs={TABS} value="overview" />
        );
        const { viewport } = layoutHorizontal(
            container.firstElementChild as HTMLElement,
            { viewportWidth: 250, tabWidth: 100 }
        );
        rerender(<ScrollableTabs tabs={TABS} value="faq" />);

        // FAQ spans 300–400; it should end 32px before the viewport's right edge,
        // clamped to the maximum scroll of 150.
        expect(viewport.scrollLeft).toBe(150);
        expect(scrollIntoView).not.toHaveBeenCalled();
        expect(windowScroll).not.toHaveBeenCalled();
    });

    it("re-reveals the selected tab when tabs resize after mount (e.g. web fonts)", () => {
        const { container } = render(
            <ScrollableTabs tabs={TABS} defaultValue="faq" />
        );
        // Mounted before layout was known; now the tabs get their real width.
        const { viewport } = layoutHorizontal(
            container.firstElementChild as HTMLElement,
            { viewportWidth: 250, tabWidth: 100 }
        );
        resize();
        expect(viewport.scrollLeft).toBe(150);
    });

    it("stops following the selected tab once the user scrolls the strip", () => {
        const { container } = render(
            <ScrollableTabs tabs={TABS} defaultValue="faq" />
        );
        const { viewport } = layoutHorizontal(
            container.firstElementChild as HTMLElement,
            { viewportWidth: 250, tabWidth: 100 }
        );
        fireEvent.wheel(viewport);
        viewport.scrollLeft = 0;
        resize();
        expect(viewport.scrollLeft).toBe(0);
    });

    it("centers the selected tab with scrollAlign='center'", () => {
        const { container, rerender } = render(
            <ScrollableTabs
                tabs={[...TABS, { value: "x", label: "X" }]}
                value="overview"
                scrollAlign="center"
            />
        );
        const { viewport } = layoutHorizontal(
            container.firstElementChild as HTMLElement,
            { viewportWidth: 200, tabWidth: 100 }
        );
        rerender(
            <ScrollableTabs
                tabs={[...TABS, { value: "x", label: "X" }]}
                value="reviews"
                scrollAlign="center"
            />
        );
        // Reviews spans 200–300; its center (250) lands at viewport center (100).
        expect(viewport.scrollLeft).toBe(150);
    });

    it("moves the indicator under the selected tab", () => {
        const { container, rerender } = render(
            <ScrollableTabs tabs={TABS} value="overview" />
        );
        layoutHorizontal(container.firstElementChild as HTMLElement, {
            viewportWidth: 1000,
            tabWidth: 120,
        });
        rerender(<ScrollableTabs tabs={TABS} value="reviews" />);
        const bar = container.querySelector<HTMLElement>(".rst__indicator")!;
        expect(bar.style.transform).toBe("translateX(240px)");
        expect(bar.style.width).toBe("120px");
        expect(bar.style.opacity).toBe("1");

        rerender(<ScrollableTabs tabs={TABS} value={null} />);
        expect(bar.style.opacity).toBe("0");
    });

    it("can turn the indicator off", () => {
        const { container } = render(
            <ScrollableTabs tabs={TABS} indicator={false} />
        );
        expect(container.querySelector(".rst__indicator")).toBeNull();
    });
});

describe("v4 compatibility", () => {
    it("supports activeTab / setActiveTab / position / displayArrows / arrow images", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        function Legacy() {
            const [activeTab, setActiveTab] = React.useState("overview");
            return (
                <ScrollableTabs
                    tabs={TABS}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    position="Horizontal"
                    displayArrows={true}
                    leftArrow="/l.svg"
                    rightArrow="/r.svg"
                    lineColor="#008080"
                />
            );
        }
        const { container } = render(<Legacy />);
        expect(container.firstElementChild).toHaveClass("rst--horizontal");
        // v4 always showed the arrows and they selected the adjacent tab.
        const next = container.querySelector(".rst__arrow--next")!;
        expect(next.querySelector("img")).toHaveAttribute("src", "/r.svg");
        fireEvent.click(next);
        expect(tab("Pricing")).toHaveAttribute("aria-selected", "true");
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining("`activeTab` is deprecated")
        );
    });

    it("maps position='vertical' (any case) to vertical orientation", () => {
        render(<ScrollableTabs tabs={TABS} position="Vertical" />);
        expect(screen.getByRole("tablist")).toHaveAttribute(
            "aria-orientation",
            "vertical"
        );
    });

    it("warns once about duplicate values", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        render(
            <ScrollableTabs
                tabs={[
                    { value: "dupe", label: "A" },
                    { value: "dupe", label: "B" },
                ]}
            />
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('Duplicate tab value "dupe"')
        );
    });
});
