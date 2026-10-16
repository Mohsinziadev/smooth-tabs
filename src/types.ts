import type { HTMLAttributes, ReactNode } from "react";

/** Values that identify a tab. */
export type TabValue = string | number;

/** A small pill rendered after the tab label, e.g. an unread count. */
export interface TabBadge {
    /** Content of the badge, e.g. `12` or `"new"`. */
    value: ReactNode;
    /** Background color of the badge. Defaults to the `--rst-badge-bg` CSS variable. */
    color?: string;
}

export interface TabItem<V extends TabValue = string> {
    /** Unique identifier of the tab. Passed to `onChange`. */
    value: V;
    /** Visible content of the tab. */
    label: ReactNode;
    /** Optional icon rendered before the label. */
    icon?: ReactNode;
    /** Optional badge rendered after the label. Pass a node or `{ value, color }`. */
    badge?: ReactNode | TabBadge;
    /**
     * @deprecated Use `badge` instead. Kept for compatibility with v4.
     */
    qty?: TabBadge;
    /** Disabled tabs are skipped by keyboard navigation and cannot be selected. */
    disabled?: boolean;
    /** Extra class name for this tab only. */
    className?: string;
}

export type TabsOrientation = "horizontal" | "vertical";

export interface ScrollableTabsProps<V extends TabValue = string>
    extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
    /** The tabs to render, in order. */
    tabs: readonly TabItem<V>[];

    /** The selected tab (controlled). */
    value?: V | null;
    /** The initially selected tab (uncontrolled). Defaults to the first enabled tab. */
    defaultValue?: V;
    /** Called when the user selects a different tab. */
    onChange?: (value: V, tab: TabItem<V>) => void;

    /** Layout direction of the tab list. @default "horizontal" */
    orientation?: TabsOrientation;
    /**
     * When to render the scroll buttons.
     * - `"auto"`: only when the tabs overflow (buttons disable themselves at either end)
     * - `"always"`: always rendered
     * - `"never"`: never rendered; users scroll with touch, trackpad, wheel or keyboard
     * @default "auto"
     */
    arrows?: "auto" | "always" | "never";
    /**
     * What the scroll buttons do.
     * - `"scroll"`: scroll the tab list by roughly one viewport
     * - `"select"`: select the previous / next enabled tab (v4 behavior)
     * @default "scroll"
     */
    arrowAction?: "scroll" | "select";
    /**
     * Custom content for the "previous" button. A string is treated as an image URL.
     * The buttons are a pointer convenience and are hidden from assistive technology;
     * keyboard and screen-reader users move between tabs with the arrow keys.
     */
    prevIcon?: ReactNode;
    /** Custom content for the "next" button. A string is treated as an image URL. */
    nextIcon?: ReactNode;

    /**
     * How the selected tab is scrolled into view when it changes.
     * - `"nearest"`: scroll as little as possible
     * - `"center"`: center the selected tab
     * @default "nearest"
     */
    scrollAlign?: "nearest" | "center";
    /** Render the animated active-tab indicator. @default true */
    indicator?: boolean;
    /** Fade the edges of the tab list when more tabs are hidden there. @default true */
    fade?: boolean;
    /**
     * Keyboard activation mode (WAI-ARIA tabs pattern).
     * - `"automatic"`: arrow keys move focus and select
     * - `"manual"`: arrow keys move focus; Enter or Space selects
     * @default "automatic"
     */
    activation?: "automatic" | "manual";

    /**
     * Prefix for the generated element ids. When set, each tab gets
     * `aria-controls` pointing at `getPanelId(idPrefix, value)`, so you can
     * wire up panels. Defaults to an auto-generated id without `aria-controls`.
     */
    idPrefix?: string;
    /** Class name added to every tab. */
    tabClassName?: string;
    /** Color of the selected tab and indicator. Sets `--rst-active-color`. */
    activeColor?: string;
    /** Color of the baseline under the tab list. Sets `--rst-line-color`. */
    lineColor?: string;

    /** @deprecated Use `value`. */
    activeTab?: V | null;
    /** @deprecated Use `onChange`. */
    setActiveTab?: (value: V) => void;
    /** @deprecated Use `orientation`. Accepts the v4 values `"Horizontal"` and `"vertical"` (case-insensitive). */
    position?: string;
    /** @deprecated Use `arrows` and `arrowAction`. */
    displayArrows?: boolean;
    /** @deprecated Use `prevIcon`. */
    leftArrow?: ReactNode;
    /** @deprecated Use `nextIcon`. */
    rightArrow?: ReactNode;
}
