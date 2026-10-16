import React from "./react";
import type {
    CSSProperties,
    KeyboardEvent,
    ReactElement,
    ReactNode,
    Ref,
} from "react";
import type {
    ScrollableTabsProps,
    TabBadge,
    TabItem,
    TabValue,
    TabsOrientation,
} from "./types";
import {
    getPanelId,
    getTabId,
    isRtl,
    scrollElementTo,
    smoothBehavior,
    useIsomorphicLayoutEffect,
    useStableId,
    warnOnce,
} from "./utils";

/** Space kept between a tab scrolled into view and the edge, so neighbours peek in. */
const EDGE_GAP = 32;
/** Fraction of the visible area scrolled by one arrow click. */
const PAGE_FRACTION = 0.8;

interface Overflow {
    start: boolean;
    end: boolean;
}

function cx(...names: Array<string | false | null | undefined>): string {
    return names.filter(Boolean).join(" ");
}

function isBadgeObject(badge: unknown): badge is TabBadge {
    return (
        typeof badge === "object" &&
        badge !== null &&
        !Array.isArray(badge) &&
        !React.isValidElement(badge) &&
        "value" in badge
    );
}

function renderBadge(badge: ReactNode | TabBadge): ReactNode {
    if (badge === null || badge === undefined || badge === false) return null;
    if (isBadgeObject(badge)) {
        return (
            <span
                className="rst__badge"
                style={badge.color ? { background: badge.color } : undefined}
            >
                {badge.value}
            </span>
        );
    }
    return <span className="rst__badge">{badge}</span>;
}

function renderArrowContent(
    icon: ReactNode,
    direction: "prev" | "next"
): ReactNode {
    if (typeof icon === "string") {
        return <img src={icon} alt="" className="rst__arrow-img" />;
    }
    if (icon !== undefined && icon !== null) return icon;
    return (
        <svg
            className="rst__chevron"
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <polyline
                points={
                    direction === "prev" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"
                }
            />
        </svg>
    );
}

/**
 * Scroll `tab` into view inside `viewport` without touching any other scroll
 * container. `Element.scrollIntoView` would also scroll the page, which
 * makes the page jump and fights page-level smooth scrolling (e.g. scroll-spy).
 */
function scrollTabIntoView(
    viewport: HTMLElement,
    tab: HTMLElement,
    orientation: TabsOrientation,
    align: "nearest" | "center",
    behavior: ScrollBehavior
): void {
    const horizontal = orientation === "horizontal";
    const vp = viewport.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    const vpStart = horizontal ? vp.left : vp.top;
    const vpSize = horizontal ? vp.width : vp.height;
    const tStart = horizontal ? t.left : t.top;
    const tSize = horizontal ? t.width : t.height;

    let delta = 0;
    if (align === "center" || tSize >= vpSize) {
        delta =
            tSize >= vpSize
                ? tStart - vpStart
                : tStart + tSize / 2 - (vpStart + vpSize / 2);
    } else {
        const gap = Math.max(0, Math.min(EDGE_GAP, (vpSize - tSize) / 2));
        if (tStart < vpStart + gap) {
            delta = tStart - vpStart - gap;
        } else if (tStart + tSize > vpStart + vpSize - gap) {
            delta = tStart + tSize - (vpStart + vpSize) + gap;
        }
    }
    if (Math.abs(delta) < 1) return;

    if (horizontal) {
        scrollElementTo(
            viewport,
            { left: viewport.scrollLeft + delta },
            behavior
        );
    } else {
        scrollElementTo(
            viewport,
            { top: viewport.scrollTop + delta },
            behavior
        );
    }
}

function findEnabled<V extends TabValue>(
    tabs: readonly TabItem<V>[],
    from: number,
    step: 1 | -1,
    wrap: boolean
): number {
    const n = tabs.length;
    for (let i = 1; i <= n; i++) {
        let idx = from + step * i;
        if (wrap) idx = ((idx % n) + n) % n;
        else if (idx < 0 || idx >= n) return -1;
        if (!tabs[idx].disabled) return idx;
    }
    return -1;
}

function warnAboutProps<V extends TabValue>(props: ScrollableTabsProps<V>) {
    const legacy: Array<[keyof ScrollableTabsProps<V>, string]> = [
        ["activeTab", "value"],
        ["setActiveTab", "onChange"],
        ["position", "orientation"],
        ["displayArrows", "arrows / arrowAction"],
        ["leftArrow", "prevIcon"],
        ["rightArrow", "nextIcon"],
    ];
    for (const [name, replacement] of legacy) {
        if (props[name] !== undefined) {
            warnOnce(
                `prop:${String(name)}`,
                `\`${String(
                    name
                )}\` is deprecated and will be removed in v6. Use \`${replacement}\` instead.`
            );
        }
    }
    if (props.tabs.some((tab) => tab.qty !== undefined)) {
        warnOnce(
            "prop:qty",
            "`tab.qty` is deprecated and will be removed in v6. Use `tab.badge` instead."
        );
    }
    const seen = new Set<string>();
    for (const tab of props.tabs) {
        const key = String(tab.value);
        if (seen.has(key)) {
            warnOnce(
                `dup:${key}`,
                `Duplicate tab value "${key}". Each tab needs a unique \`value\`.`
            );
        }
        seen.add(key);
    }
}

function ScrollableTabsInner<V extends TabValue = string>(
    props: ScrollableTabsProps<V>,
    ref: React.ForwardedRef<HTMLDivElement>
): ReactElement {
    const {
        tabs,
        value: valueProp,
        defaultValue,
        onChange,
        orientation: orientationProp,
        arrows: arrowsProp,
        arrowAction: arrowActionProp,
        prevIcon,
        nextIcon,
        scrollAlign = "nearest",
        indicator = true,
        fade = true,
        activation = "automatic",
        idPrefix,
        tabClassName,
        activeColor,
        lineColor,
        activeTab,
        setActiveTab,
        position,
        displayArrows,
        leftArrow,
        rightArrow,
        className,
        style,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        ...rest
    } = props;

    // ---- Resolve v4 props onto the v5 API ---------------------------------
    const orientation: TabsOrientation =
        orientationProp ??
        (position && position.toLowerCase() === "vertical"
            ? "vertical"
            : "horizontal");
    const legacyArrows = displayArrows !== undefined;
    const arrows =
        arrowsProp ??
        (legacyArrows ? (displayArrows ? "always" : "never") : "auto");
    const arrowAction = arrowActionProp ?? (legacyArrows ? "select" : "scroll");
    const horizontal = orientation === "horizontal";

    React.useEffect(() => {
        warnAboutProps(props);
    });

    // ---- Selection ---------------------------------------------------------
    const isControlled = valueProp !== undefined || activeTab !== undefined;
    const [internalValue, setInternalValue] = React.useState<V | undefined>(
        defaultValue
    );
    let selected: V | null | undefined;
    if (isControlled) {
        selected = valueProp !== undefined ? valueProp : activeTab;
    } else {
        selected = tabs.some(
            (tab) => tab.value === internalValue && !tab.disabled
        )
            ? internalValue
            : tabs.find((tab) => !tab.disabled)?.value;
    }
    const selectedIndex = tabs.findIndex((tab) => tab.value === selected);
    const focusIndex =
        selectedIndex >= 0 && !tabs[selectedIndex].disabled
            ? selectedIndex
            : findEnabled(tabs, -1, 1, false);

    const select = (tab: TabItem<V>) => {
        if (tab.disabled || tab.value === selected) return;
        if (!isControlled) setInternalValue(tab.value);
        onChange?.(tab.value, tab);
        setActiveTab?.(tab.value);
    };

    // ---- Refs ----------------------------------------------------------------
    const autoId = useStableId();
    const baseId = idPrefix ?? autoId;
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    const indicatorRef = React.useRef<HTMLSpanElement>(null);
    const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
    tabRefs.current.length = tabs.length;

    // ---- Overflow detection ----------------------------------------------------
    const [overflow, setOverflow] = React.useState<Overflow>({
        start: false,
        end: false,
    });

    const updateOverflow = React.useCallback(() => {
        const vp = viewportRef.current;
        if (!vp) return;
        // In RTL, scrollLeft runs from 0 to negative values.
        const pos = Math.abs(horizontal ? vp.scrollLeft : vp.scrollTop);
        const max = horizontal
            ? vp.scrollWidth - vp.clientWidth
            : vp.scrollHeight - vp.clientHeight;
        const start = pos > 1;
        const end = max - pos > 1;
        setOverflow((prev) =>
            prev.start === start && prev.end === end ? prev : { start, end }
        );
    }, [horizontal]);

    // ---- Indicator ----------------------------------------------------------------
    const positionIndicator = () => {
        const bar = indicatorRef.current;
        if (!bar) return;
        const tab = selectedIndex >= 0 ? tabRefs.current[selectedIndex] : null;
        if (!tab) {
            bar.style.opacity = "0";
            return;
        }
        if (horizontal) {
            bar.style.transform = `translateX(${tab.offsetLeft}px)`;
            bar.style.width = `${tab.offsetWidth}px`;
            bar.style.height = "";
        } else {
            bar.style.transform = `translateY(${tab.offsetTop}px)`;
            bar.style.height = `${tab.offsetHeight}px`;
            bar.style.width = "";
        }
        bar.style.opacity = "1";
        if (!bar.hasAttribute("data-ready")) {
            // Enable the transition only after the first placement, so the
            // indicator doesn't slide in from the start on mount.
            requestAnimationFrame(() => bar.setAttribute("data-ready", ""));
        }
    };
    const positionIndicatorRef = React.useRef(positionIndicator);
    positionIndicatorRef.current = positionIndicator;

    const revealSelected = (behavior: ScrollBehavior) => {
        const vp = viewportRef.current;
        const tab = selectedIndex >= 0 ? tabRefs.current[selectedIndex] : null;
        if (vp && tab) {
            scrollTabIntoView(vp, tab, orientation, scrollAlign, behavior);
        }
    };
    const revealSelectedRef = React.useRef(revealSelected);
    revealSelectedRef.current = revealSelected;
    /** False once the user scrolls the strip, so resizes don't pull it back. */
    const followSelectedRef = React.useRef(true);

    useIsomorphicLayoutEffect(() => {
        positionIndicatorRef.current();
    }, [selectedIndex, orientation, tabs, indicator]);

    React.useEffect(() => {
        const vp = viewportRef.current;
        const list = listRef.current;
        if (!vp) return;
        let frame = 0;
        const onScroll = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                updateOverflow();
            });
        };
        const onResize = () => {
            // Tabs change size after mount (web fonts, async labels). Keep the
            // selected tab in view until the user scrolls the strip themselves.
            if (followSelectedRef.current) revealSelectedRef.current("auto");
            updateOverflow();
            positionIndicatorRef.current();
        };
        const onUserScroll = () => {
            followSelectedRef.current = false;
        };
        vp.addEventListener("scroll", onScroll, { passive: true });
        vp.addEventListener("wheel", onUserScroll, { passive: true });
        vp.addEventListener("touchstart", onUserScroll, { passive: true });
        let observer: ResizeObserver | undefined;
        if (typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(onResize);
            observer.observe(vp);
            if (list) observer.observe(list);
        } else {
            window.addEventListener("resize", onResize);
        }
        updateOverflow();
        return () => {
            vp.removeEventListener("scroll", onScroll);
            vp.removeEventListener("wheel", onUserScroll);
            vp.removeEventListener("touchstart", onUserScroll);
            if (frame) cancelAnimationFrame(frame);
            if (observer) observer.disconnect();
            else window.removeEventListener("resize", onResize);
        };
    }, [updateOverflow]);

    // ---- Keep the selected tab visible ------------------------------------------------
    const hasScrolledOnce = React.useRef(false);
    useIsomorphicLayoutEffect(() => {
        followSelectedRef.current = true;
        revealSelectedRef.current(
            hasScrolledOnce.current ? smoothBehavior() : "auto"
        );
        hasScrolledOnce.current = true;
    }, [selectedIndex, orientation, scrollAlign]);

    // ---- Arrow buttons ----------------------------------------------------------------
    const showArrows =
        arrows === "always" ||
        (arrows === "auto" && (overflow.start || overflow.end));

    const prevTarget =
        arrowAction === "select"
            ? findEnabled(tabs, selectedIndex, -1, false)
            : -1;
    const nextTarget =
        arrowAction === "select"
            ? findEnabled(tabs, selectedIndex, 1, false)
            : -1;
    const prevDisabled =
        arrowAction === "select" ? prevTarget < 0 : !overflow.start;
    const nextDisabled =
        arrowAction === "select" ? nextTarget < 0 : !overflow.end;

    const onArrow = (direction: -1 | 1) => {
        if (arrowAction === "select") {
            const target = direction < 0 ? prevTarget : nextTarget;
            if (target >= 0) select(tabs[target]);
            return;
        }
        const vp = viewportRef.current;
        if (!vp) return;
        followSelectedRef.current = false;
        if (horizontal) {
            const sign = isRtl(vp) ? -direction : direction;
            scrollElementTo(
                vp,
                {
                    left: vp.scrollLeft + sign * vp.clientWidth * PAGE_FRACTION,
                },
                smoothBehavior()
            );
        } else {
            scrollElementTo(
                vp,
                {
                    top:
                        vp.scrollTop +
                        direction * vp.clientHeight * PAGE_FRACTION,
                },
                smoothBehavior()
            );
        }
    };

    // ---- Keyboard (WAI-ARIA tabs pattern) ------------------------------------------------
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const index = Number(
            (event.target as HTMLElement).getAttribute("data-index")
        );
        if (Number.isNaN(index) || !tabs[index]) return;

        let prevKey = horizontal ? "ArrowLeft" : "ArrowUp";
        let nextKey = horizontal ? "ArrowRight" : "ArrowDown";
        if (horizontal && listRef.current && isRtl(listRef.current)) {
            [prevKey, nextKey] = [nextKey, prevKey];
        }

        let target = -1;
        if (event.key === nextKey) target = findEnabled(tabs, index, 1, true);
        else if (event.key === prevKey)
            target = findEnabled(tabs, index, -1, true);
        else if (event.key === "Home") target = findEnabled(tabs, -1, 1, false);
        else if (event.key === "End")
            target = findEnabled(tabs, tabs.length, -1, false);
        else return;

        event.preventDefault();
        const el = tabRefs.current[target];
        if (target < 0 || !el) return;
        el.focus({ preventScroll: true });
        if (viewportRef.current) {
            scrollTabIntoView(
                viewportRef.current,
                el,
                orientation,
                "nearest",
                smoothBehavior()
            );
        }
        if (activation === "automatic") select(tabs[target]);
        else followSelectedRef.current = target === selectedIndex;
    };

    // ---- Render --------------------------------------------------------------------
    const cssVars: Record<string, string> = {};
    if (activeColor) cssVars["--rst-active-color"] = activeColor;
    if (lineColor) cssVars["--rst-line-color"] = lineColor;

    const renderArrow = (direction: "prev" | "next") => (
        <button
            type="button"
            className={`rst__arrow rst__arrow--${direction}`}
            tabIndex={-1}
            aria-hidden="true"
            disabled={direction === "prev" ? prevDisabled : nextDisabled}
            onClick={() => onArrow(direction === "prev" ? -1 : 1)}
        >
            {renderArrowContent(
                direction === "prev"
                    ? prevIcon ?? leftArrow
                    : nextIcon ?? rightArrow,
                direction
            )}
        </button>
    );

    return (
        <div
            {...rest}
            ref={ref}
            className={cx(
                "rst",
                `rst--${orientation}`,
                fade && "rst--fade",
                overflow.start && "rst--overflow-start",
                overflow.end && "rst--overflow-end",
                className
            )}
            style={{ ...(cssVars as CSSProperties), ...style }}
            data-orientation={orientation}
        >
            {showArrows && renderArrow("prev")}
            <div className="rst__viewport" ref={viewportRef}>
                <div
                    role="tablist"
                    aria-orientation={orientation}
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledBy}
                    className="rst__list"
                    ref={listRef}
                    onKeyDown={onKeyDown}
                >
                    {tabs.map((tab, index) => {
                        const isSelected = index === selectedIndex;
                        return (
                            <button
                                key={String(tab.value)}
                                ref={(el) => {
                                    tabRefs.current[index] = el;
                                }}
                                type="button"
                                role="tab"
                                id={getTabId(baseId, tab.value)}
                                aria-selected={isSelected}
                                aria-controls={
                                    idPrefix
                                        ? getPanelId(idPrefix, tab.value)
                                        : undefined
                                }
                                tabIndex={index === focusIndex ? 0 : -1}
                                disabled={tab.disabled}
                                data-index={index}
                                data-state={isSelected ? "active" : "inactive"}
                                className={cx(
                                    "rst__tab",
                                    isSelected && "rst__tab--active",
                                    tabClassName,
                                    tab.className
                                )}
                                onClick={() => select(tab)}
                            >
                                {tab.icon !== undefined &&
                                    tab.icon !== null && (
                                        <span className="rst__icon">
                                            {tab.icon}
                                        </span>
                                    )}
                                <span className="rst__label">{tab.label}</span>
                                {renderBadge(tab.badge ?? tab.qty)}
                            </button>
                        );
                    })}
                    {indicator && (
                        <span
                            className="rst__indicator"
                            ref={indicatorRef}
                            aria-hidden="true"
                        />
                    )}
                </div>
            </div>
            {showArrows && renderArrow("next")}
        </div>
    );
}

/**
 * Accessible, scrollable tabs with an animated indicator and overflow-aware
 * scroll buttons. Import `smooth-tabs/styles.css` once for default styles.
 *
 * @example
 * <ScrollableTabs
 *   aria-label="Sections"
 *   tabs={[{ value: "a", label: "Overview" }, { value: "b", label: "Pricing" }]}
 *   value={tab}
 *   onChange={setTab}
 * />
 */
export const ScrollableTabs = /* @__PURE__ */ (() => {
    const component = React.forwardRef(ScrollableTabsInner);
    component.displayName = "ScrollableTabs";
    return component;
})() as <V extends TabValue = string>(
    props: ScrollableTabsProps<V> & { ref?: Ref<HTMLDivElement> }
) => ReactElement;
