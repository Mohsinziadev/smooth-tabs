# Changelog

This project follows [Semantic Versioning](https://semver.org/).

## 5.0.3

Package metadata only; no code changes.

-   Homepage and the README demo link now point to the live demo at https://www.m2toolkit.com/npm-packages/smooth-tabs.

## 5.0.1

Package metadata only; no code changes.

-   Homepage now points to the demo at https://smooth-tabs.vercel.app/.
-   Repository and issue links now point to https://github.com/Mohsinziadev/smooth-tabs.

## 5.0.0

A rewrite focused on reliability, accessibility and real-world scrolling. v4 props keep working, with deprecation warnings. See "Migrating from v4" in the README.

### Renamed

-   The package is now published as **`smooth-tabs`**. Versions up to 4.1.0 were published as `react-smooth-tabs`, which will be marked deprecated on npm in favour of this package. Install `smooth-tabs` and update your imports; the API is unchanged apart from the notes below.

### Added

-   `useScrollSpy(ids, options)`: tracks the section in view and scrolls to sections without the active tab flickering mid-scroll. Handles short final sections, sticky-header offsets, custom scroll containers and reduced motion.
-   Full WAI-ARIA tabs pattern: `tablist`/`tab` roles, `aria-selected`, roving `tabIndex`, arrow keys, Home/End, `activation="manual"`, and `aria-controls` via `idPrefix`.
-   `getTabId` / `getPanelId` helpers for wiring up tab panels.
-   Uncontrolled mode (`defaultValue`) alongside controlled mode (`value` + `onChange`).
-   Overflow detection: `arrows="auto"` shows the scroll buttons only when needed and disables them at either end. Edges fade where tabs are hidden (`fade`).
-   Animated active-tab indicator (`indicator`).
-   `scrollAlign="nearest" | "center"`, `arrowAction="scroll" | "select"`, `orientation`, `prevIcon` / `nextIcon`, `tabClassName`.
-   Disabled tabs, `badge` (any node or `{ value, color }`), per-tab `className`.
-   RTL support for scrolling, arrow keys, buttons and fades.
-   TypeScript generics: `value` and `onChange` infer string or number tab values.
-   CommonJS build, separate `.d.cts` types, `"use client"` banner, `sideEffects` for tree-shaking.
-   CSS custom properties for theming.

### Fixed

-   Tabs could not be scrolled by touch, trackpad or wheel (`overflow: hidden`).
-   Selecting a tab called `scrollIntoView`, which also scrolled the page.
-   Tab values containing quotes or brackets crashed (`querySelector` with an unescaped value).
-   Vertical arrows rendered even with `displayArrows={false}`, inside the `<ul>` (invalid markup), with mislabelled images.
-   Badges were fixed at 16px and clipped values of three or more digits.
-   The stylesheet shipped Tailwind's global preflight, which restyled the host application.
-   Importing the ESM build in Node with React 16 failed (named imports from CommonJS React).

### Changed

-   **No runtime dependencies.** v4 listed `npm`, `install`, `tailwindcss`, `autoprefixer`, `postcss-cli` and others as dependencies.
-   `className` applies to the root element (v4 applied it to every tab). Use `tabClassName` for tabs.
-   Tabs render as `<button role="tab">` instead of `<li>`. Class names are now `rst__*`.
-   Labels inherit font size and weight instead of a forced 12px light.

### Deprecated

-   `activeTab`, `setActiveTab`, `position`, `displayArrows`, `leftArrow`, `rightArrow` and `tab.qty`. They will be removed in v6.

## 4.1.0 and earlier

Published as `react-smooth-tabs` from a separate build setup. See the npm registry for the version history.
