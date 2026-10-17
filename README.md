# smooth-tabs

Accessible, scrollable React tabs with an animated indicator, overflow-aware scroll buttons, full keyboard support, and built-in **scroll-spy** for sticky section navigation.

[![npm](https://img.shields.io/npm/v/smooth-tabs)](https://www.npmjs.com/package/smooth-tabs)
[![min+gzip: 3.4 kB](https://img.shields.io/badge/min%2Bgzip-3.4%20kB-blue)](#size)
[![dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json)
[![license](https://img.shields.io/npm/l/smooth-tabs)](./LICENSE)

> Formerly published as [`react-smooth-tabs`](https://www.npmjs.com/package/react-smooth-tabs). See [Migrating from v4](#migrating-from-v4).

**[Live demo →](https://www.m2toolkit.com/npm-packages/smooth-tabs)**

-   **Zero dependencies.** About 3.4 kB gzipped for the component, plus 1.3 kB of optional CSS.
-   **Scrolls the way users expect.** Touch, trackpad, and wheel scrolling work. Arrow buttons appear only when tabs overflow and disable themselves at either end. Edges fade where more tabs are hidden.
-   **Keeps the selected tab in view** by scrolling only the tab strip. It never scrolls the page (unlike `scrollIntoView`).
-   **Accessible by default.** It follows the [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): `tablist`/`tab` roles, roving focus, arrow keys, Home/End, and manual or automatic activation.
-   **Scroll-spy built in.** `useScrollSpy` ties the tabs to sections of the page, which covers category bars, docs pages, and restaurant menus.
-   Horizontal and vertical layouts, **RTL**, disabled tabs, icons, and badges.
-   Typed generics, so `value` and `onChange` infer your tab value type.
-   Works on the server (SSR) and in Next.js App Router, which needs no `"use client"` wrapper from you. Ships ESM and CJS for React 16.8 to 19.
-   Themed with CSS custom properties. Works with plain CSS, Tailwind, CSS Modules, or any design system.

## Install

```bash
npm install smooth-tabs
```

## Quick start

```tsx
import { useState } from "react";
import { ScrollableTabs } from "smooth-tabs";
import "smooth-tabs/styles.css";

const tabs = [
    { value: "overview", label: "Overview" },
    { value: "pricing", label: "Pricing" },
    { value: "reviews", label: "Reviews", badge: 12 },
    { value: "faq", label: "FAQ" },
];

export function ProductTabs() {
    const [tab, setTab] = useState("overview");
    return (
        <ScrollableTabs
            aria-label="Product sections"
            tabs={tabs}
            value={tab}
            onChange={setTab}
        />
    );
}
```

Uncontrolled usage works too: omit `value`, optionally pass `defaultValue`, and listen with `onChange`.

## Scroll-spy: tabs that follow the page

A sticky bar of category tabs that highlights the section you're reading, scrolls itself to keep that tab visible, and jumps to a section on click. Building this by hand means solving several problems:

-   after a click, the active tab flickers through every section the page passes during the smooth scroll
-   `scrollIntoView` on the tab also scrolls the page, fighting the user's scroll
-   short final sections never reach the top, so they can never become active
-   the sticky header height has to be accounted for

`useScrollSpy` solves these, and its output plugs straight into `ScrollableTabs`:

```tsx
import { ScrollableTabs, useScrollSpy } from "smooth-tabs";
import "smooth-tabs/styles.css";

const sections = [
    { id: "starters", title: "Starters" },
    { id: "mains", title: "Mains" },
    { id: "desserts", title: "Desserts" },
    { id: "drinks", title: "Drinks" },
];

export function Menu() {
    const { activeId, scrollTo } = useScrollSpy(
        sections.map((s) => s.id),
        { offset: 64 } // height of the sticky bar
    );

    return (
        <>
            <nav style={{ position: "sticky", top: 0, background: "white" }}>
                <ScrollableTabs
                    aria-label="Menu categories"
                    tabs={sections.map((s) => ({
                        value: s.id,
                        label: s.title,
                    }))}
                    value={activeId}
                    onChange={scrollTo}
                    scrollAlign="center"
                />
            </nav>
            {sections.map((s) => (
                <section key={s.id} id={s.id}>
                    <h2>{s.title}</h2>
                    {/* … */}
                </section>
            ))}
        </>
    );
}
```

How it behaves:

-   A section becomes active when its top crosses `offset` pixels below the top of the scroll container.
-   At the bottom of the page the last section becomes active, even if it's too short to reach the top.
-   After `scrollTo(id)` the active id stays on the target until scrolling settles, with no flicker through intermediate sections.
-   Users who prefer reduced motion get instant scrolling.
-   Pass `root` (an element or a ref) to spy on a scrollable container instead of the window.

> Wrap the bar in a `<nav>` so assistive technology can find it. The tabs themselves are still announced as a tab list. If you need each item to be a real link, see [Limitations](#limitations).

## Linking tabs to panels

For real tab panels, set `idPrefix` and give each panel the matching id. The tabs then get `aria-controls`, and the panels can reference the tabs:

```tsx
import { ScrollableTabs, getPanelId, getTabId } from "smooth-tabs";

<ScrollableTabs idPrefix="account" aria-label="Account" tabs={tabs} value={tab} onChange={setTab} />
<div
    role="tabpanel"
    id={getPanelId("account", tab)}
    aria-labelledby={getTabId("account", tab)}
    tabIndex={0}
>
    {/* panel content */}
</div>
```

## Examples

### Icons, badges and disabled tabs

```tsx
const tabs = [
    {
        value: "inbox",
        label: "Inbox",
        icon: <InboxIcon />,
        badge: { value: 4, color: "#e11d48" },
    },
    { value: "sent", label: "Sent", icon: <SendIcon /> },
    { value: "spam", label: "Spam", badge: <span aria-label="new">•</span> },
    { value: "archive", label: "Archive", disabled: true },
];
```

`badge` accepts any React node, or `{ value, color }` for a pill. Keyboard navigation skips disabled tabs.

### Vertical

Give the component a height (or `max-height`) so it has something to overflow:

```tsx
<ScrollableTabs
    orientation="vertical"
    style={{ height: 320 }}
    tabs={tabs}
    value={tab}
    onChange={setTab}
/>
```

### Numeric values (typed)

```tsx
const [step, setStep] = useState(1);
<ScrollableTabs
    tabs={[
        { value: 1, label: "Details" },
        { value: 2, label: "Payment" },
    ]}
    value={step}
    onChange={setStep} // (value: number) => void
/>;
```

### Custom scroll buttons

```tsx
<ScrollableTabs prevIcon={<ChevronLeft />} nextIcon={<ChevronRight />} arrows="always" … />
<ScrollableTabs prevIcon="/img/left.svg" nextIcon="/img/right.svg" … /> {/* strings are image URLs */}
<ScrollableTabs arrows="never" … />                                     {/* swipe / trackpad only */}
<ScrollableTabs arrowAction="select" … />                               {/* buttons select the adjacent tab */}
```

### Right-to-left

Nothing to configure. Under `dir="rtl"`, scrolling, arrow-key direction, button placement, chevrons and edge fades all flip.

### Next.js (App Router)

The bundle starts with `"use client"`, so you can import it from a Server Component file. Import the CSS once, for example in `app/layout.tsx`:

```tsx
import "smooth-tabs/styles.css";
```

### Tailwind

The stylesheet is scoped to `.rst*` classes and contains no reset, so it doesn't conflict with Tailwind. Style tabs with `tabClassName`, or skip `styles.css` entirely and target the class names below.

## API

### `<ScrollableTabs>`

| Prop                                     | Type                                  | Default           | Description                                                                                             |
| ---------------------------------------- | ------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `tabs`                                   | `TabItem<V>[]`                        | —                 | Tabs to render, in order.                                                                               |
| `value`                                  | `V \| null`                           | —                 | Selected tab (controlled). `null` means no selection.                                                   |
| `defaultValue`                           | `V`                                   | first enabled tab | Initially selected tab (uncontrolled).                                                                  |
| `onChange`                               | `(value: V, tab: TabItem<V>) => void` | —                 | Called when the user selects a different tab.                                                           |
| `orientation`                            | `"horizontal" \| "vertical"`          | `"horizontal"`    | Layout and arrow-key axis.                                                                              |
| `arrows`                                 | `"auto" \| "always" \| "never"`       | `"auto"`          | When to render the scroll buttons. `auto` shows them only when tabs overflow.                           |
| `arrowAction`                            | `"scroll" \| "select"`                | `"scroll"`        | Buttons scroll by ~80% of the visible width, or select the adjacent tab.                                |
| `prevIcon` / `nextIcon`                  | `ReactNode`                           | chevrons          | Button content. A string is used as an image URL.                                                       |
| `scrollAlign`                            | `"nearest" \| "center"`               | `"nearest"`       | How the selected tab is brought into view.                                                              |
| `indicator`                              | `boolean`                             | `true`            | Render the animated active-tab indicator.                                                               |
| `fade`                                   | `boolean`                             | `true`            | Fade edges that have hidden tabs behind them.                                                           |
| `activation`                             | `"automatic" \| "manual"`             | `"automatic"`     | Whether arrow keys select tabs, or only move focus (Enter/Space selects).                               |
| `idPrefix`                               | `string`                              | auto              | Prefix for element ids. Enables `aria-controls`; see [Linking tabs to panels](#linking-tabs-to-panels). |
| `tabClassName`                           | `string`                              | —                 | Class added to every tab.                                                                               |
| `activeColor`                            | `string`                              | `#0f766e`         | Shortcut for `--rst-active-color`.                                                                      |
| `lineColor`                              | `string`                              | translucent grey  | Shortcut for `--rst-line-color`.                                                                        |
| `aria-label` / `aria-labelledby`         | `string`                              | —                 | Accessible name of the tab list (recommended).                                                          |
| `ref`, `className`, `style`, `data-*`, … |                                       |                   | Forwarded to the root `<div>`.                                                                          |

### `TabItem<V>`

| Field       | Type                                                | Description                              |
| ----------- | --------------------------------------------------- | ---------------------------------------- |
| `value`     | `string \| number`                                  | Unique identifier.                       |
| `label`     | `ReactNode`                                         | Visible content.                         |
| `icon`      | `ReactNode`                                         | Rendered before the label.               |
| `badge`     | `ReactNode \| { value: ReactNode; color?: string }` | Rendered after the label.                |
| `disabled`  | `boolean`                                           | Not selectable; skipped by the keyboard. |
| `className` | `string`                                            | Extra class for this tab.                |

### `useScrollSpy(ids, options?)`

Returns `{ activeId, scrollTo }`.

| Option     | Type                                    | Default    | Description                                                                                                                                                 |
| ---------- | --------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `offset`   | `number`                                | `0`        | Pixels from the top of the container where a section becomes active, usually your sticky header's height. Also used as the landing position for `scrollTo`. |
| `root`     | `HTMLElement \| RefObject<HTMLElement>` | window     | Scroll container to observe.                                                                                                                                |
| `behavior` | `ScrollBehavior`                        | `"smooth"` | Behavior used by `scrollTo`. Becomes `"auto"` for reduced-motion users.                                                                                     |
| `enabled`  | `boolean`                               | `true`     | Pause tracking without unmounting.                                                                                                                          |

`ids` are element ids in document order. Ids with no matching element are ignored.

### `getTabId(idPrefix, value)` / `getPanelId(idPrefix, value)`

Return the ids the component uses, for wiring up panels.

## Styling

Every visual detail is a CSS custom property on `.rst`. Override them anywhere:

```css
.my-tabs {
    --rst-active-color: #7c3aed;
    --rst-active-font-weight: 600;
    --rst-indicator-size: 3px;
    --rst-tab-padding: 12px 16px;
}
```

| Variable                                          | Default                  |                                                                  |
| ------------------------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `--rst-active-color`                              | `#0f766e`                | Selected text, indicator, focus ring.                            |
| `--rst-active-font-weight`                        | `inherit`                | Weight of the selected tab. Changing it changes the tab's width. |
| `--rst-line-color` / `--rst-line-width`           | translucent grey / `1px` | Baseline under (or beside) the list.                             |
| `--rst-indicator-size` / `--rst-indicator-radius` | `2px` / `2px`            | Indicator thickness and rounding.                                |
| `--rst-gap`                                       | `4px`                    | Space between tabs.                                              |
| `--rst-tab-padding` / `--rst-tab-radius`          | `10px 14px` / `6px`      | Tab box.                                                         |
| `--rst-hover-bg`                                  | translucent grey         | Hover background of tabs and buttons.                            |
| `--rst-badge-bg` / `--rst-badge-color`            | `#64748b` / `#fff`       | Default badge colors.                                            |
| `--rst-arrow-size`                                | `32px`                   | Scroll button size.                                              |
| `--rst-fade-size`                                 | `24px`                   | Width of the edge fade.                                          |
| `--rst-duration` / `--rst-easing`                 | `250ms` / ease-out curve | Animation timing.                                                |

Class names you can target: `.rst`, `.rst--horizontal`, `.rst--vertical`, `.rst--overflow-start`, `.rst--overflow-end`, `.rst__viewport`, `.rst__list`, `.rst__tab`, `.rst__tab--active`, `.rst__icon`, `.rst__label`, `.rst__badge`, `.rst__indicator`, `.rst__arrow`, `.rst__arrow--prev`, `.rst__arrow--next`. Each tab also carries `data-state="active" | "inactive"`.

The demo's pill style, where the indicator becomes the pill behind the active tab, takes a few lines. See [`demo/src/demo.css`](./demo/src/demo.css).

## Accessibility

| Key                                                                              | Action                                                   |
| -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| <kbd>←</kbd> / <kbd>→</kbd> (horizontal), <kbd>↑</kbd> / <kbd>↓</kbd> (vertical) | Previous / next enabled tab, wrapping. Flipped in RTL.   |
| <kbd>Home</kbd> / <kbd>End</kbd>                                                 | First / last enabled tab.                                |
| <kbd>Enter</kbd> / <kbd>Space</kbd>                                              | Select the focused tab (`activation="manual"`).          |
| <kbd>Tab</kbd>                                                                   | Moves into the list at the selected tab, then out of it. |

-   Tabs are `<button role="tab">` elements with `aria-selected`, roving `tabIndex`, and `aria-controls` when `idPrefix` is set.
-   The scroll buttons are a pointer convenience. They are `aria-hidden` and out of the tab order, because keyboard and screen-reader users reach every tab with the arrow keys.
-   Focus moves without scrolling the page (`focus({ preventScroll: true })`), and the strip scrolls just enough to show the focused tab.
-   All animation is disabled under `prefers-reduced-motion: reduce`.
-   Give the list a name with `aria-label` or `aria-labelledby`.

## Compatibility

Checked by the test suite and `npm run test:compat`:

-   **React 16.8, 17, 18 and 19**, through both `require()` and `import` in Node. Each run covers server rendering, mounting, click selection and keyboard navigation.
-   **SSR**: no DOM access during render. Ids come from `React.useId` on React 18+, so they're hydration-safe there.
-   **Bundlers**: ESM and CJS builds with separate type declarations (validated with `publint` and `@arethetypeswrong/cli`), `sideEffects` declared so unused exports are tree-shaken, and `"use client"` for React Server Components.
-   **Browsers**: current Chrome, Edge, Firefox and Safari. Uses `ResizeObserver` (with a window-resize fallback), CSS `mask-image` for the edge fade (if a browser lacks it, the fade is skipped), and `scrollTo` with smooth behavior.

## Size

Measured with `npm run size`: minified with esbuild, React excluded.

| Import                            | min    | gzip   |
| --------------------------------- | ------ | ------ |
| `ScrollableTabs` + `useScrollSpy` | 9.3 kB | 4.0 kB |
| `ScrollableTabs` only             | 7.7 kB | 3.4 kB |
| `useScrollSpy` only               | 2.0 kB | 0.9 kB |
| `styles.css`                      | 4.7 kB | 1.3 kB |

## Migrating from v4

v5 is a rewrite, published under a new name. **Your v4 code keeps working** once you switch packages: the old props are still accepted and log a one-time deprecation warning in development.

**Switch the package.** v4 was published as `react-smooth-tabs`; v5 and later are published as `smooth-tabs`.

```bash
npm uninstall react-smooth-tabs
npm install smooth-tabs
```

Then replace `react-smooth-tabs` with `smooth-tabs` in your imports, for example `import { ScrollableTabs } from "smooth-tabs"`.

Things to check after switching:

1. **Dependencies are gone.** v4 accidentally declared `npm`, `tailwindcss`, `autoprefixer` and other build tools as runtime dependencies. Installing it added about 110 packages (roughly 44 MB) to your project. v5 has none.
2. **The stylesheet no longer resets your page.** v4's CSS contained Tailwind's global preflight (`*, ::before, ::after { … }`), which restyled your whole app. If your layout relied on that by accident, add your own reset. Import `smooth-tabs/styles.css`. The v4 file path, `smooth-tabs/dist/index.css`, also still works.
3. **`className` now goes on the root element.** In v4 it was applied to every tab. Use `tabClassName` for per-tab classes.
4. **Markup changed.** Tabs are `<button role="tab">` inside a `role="tablist"` instead of `<li>` elements. The class names `CustomTabs` and `CustomTab` became `rst__list` and `rst__tab`.
5. **Labels inherit your font.** v4 forced 12px light text. v5 inherits the surrounding size and weight.

| v4                                    | v5                                                                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `activeTab` / `setActiveTab`          | `value` / `onChange`                                                                                                       |
| `position="Horizontal" \| "vertical"` | `orientation="horizontal" \| "vertical"`                                                                                   |
| `displayArrows`                       | `arrows` and `arrowAction`. `displayArrows` keeps its v4 behavior: buttons always shown, and they select the adjacent tab. |
| `leftArrow` / `rightArrow`            | `prevIcon` / `nextIcon`                                                                                                    |
| `lineColor`, `activeColor`            | unchanged                                                                                                                  |
| `tab.qty`                             | `tab.badge`                                                                                                                |

v4 also showed the vertical arrows even with `displayArrows={false}`. v5 respects the prop. The deprecated props will be removed in v6.

## Troubleshooting

-   **No styles**: import `smooth-tabs/styles.css` once in your app.
-   **Vertical tabs don't scroll**: the component needs a constrained height (`style={{ height: … }}` or a flex parent).
-   **Scroll-spy activates a section too early or too late**: set `offset` to the height of whatever is stuck to the top of the page.
-   **Scroll-spy doesn't react**: if the sections scroll inside an element rather than the window, pass that element as `root`.
-   **Warnings in the console**: they name the deprecated prop or the duplicated tab `value` that caused them. Production builds strip them.

## Limitations

-   Every tab renders. There's no virtualization, so lists of hundreds of tabs may be slow.
-   No "More…" overflow dropdown. Hidden tabs are reached by scrolling.
-   Tabs are buttons, not links. For a nav where each item is a URL, render your own links.

## Alternatives

-   **[MUI Tabs](https://mui.com/material-ui/react-tabs/)**: a good fit if you already use Material UI.
-   **[react-tabs-scrollable](https://www.npmjs.com/package/react-tabs-scrollable)**: scrollable tabs with an RTL focus and several selected-tab scroll modes.
-   **[Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)** or **[react-tabs](https://www.npmjs.com/package/react-tabs)**: tab and panel primitives when you don't need scrolling.

## Development

```bash
npm install
npm run dev          # demo at http://localhost:5173 (uses the source directly)
npm test             # unit tests (Vitest + Testing Library)
npm run verify       # lint, format, types, tests, build, package checks, size
npm run test:compat  # installs the packed build next to React 16.8/17/18/19
```

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[ISC](./LICENSE) © Mohsin Zia
