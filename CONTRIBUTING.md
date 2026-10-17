# Contributing

Thanks for helping improve smooth-tabs.

## Setup

Requires Node.js 22.12 or newer for the development tooling. The published package itself runs wherever React does.

```bash
npm install
npm run dev     # demo site, live-reloading against src/
```

## Before opening a pull request

```bash
npm run verify        # lint, formatting, types, tests, build, package checks, size
npm run test:compat   # optional: React 16.8 / 17 / 18 / 19 against the packed build
```

-   Add or update tests in `test/` for any behavior change. jsdom has no layout engine, so fake layout with the helpers in `test/layout.ts`.
-   Keep the package dependency-free. New runtime dependencies need a strong justification.
-   Public API changes need README and CHANGELOG updates.
-   For changes to scrolling, focus or the indicator, also check the demo in a real browser, including `dir="rtl"` and the vertical layout.

## Project layout

```
src/              library source (published as dist/)
  ScrollableTabs.tsx
  useScrollSpy.ts
  styles.css
test/             Vitest + Testing Library
demo/             Vite demo site (deployed to Vercel)
scripts/          size report and React version compatibility check
```

## Landing page

The demo doubles as this package's landing page at https://www.m2toolkit.com/npm-packages/smooth-tabs.
That URL is also the `homepage` in `package.json`, which npm shows as the package's homepage.

-   `npm run build:site` builds the demo as prerendered static HTML into `site-dist/`. It adds the
    canonical, Open Graph and JSON-LD tags, and writes `package-info.json` (listing data taken from
    `package.json` and `site.config.json`). `scripts/build-site.mjs` is shared verbatim with the other
    M2Toolkit packages, and per-package settings go in `site.config.json`.
-   Keep the demo server-renderable. Browser APIs (`window`, `localStorage`, `navigator`, …) belong
    in effects or event handlers, not in render.
-   Keep one `<h1>`, a `<title>` of 15–65 characters and a meta description of 70–170 characters.
-   To publish a change to the site, run `npm run sync:packages` in the m2toolkit repo and commit the
    result there. See `docs/NPM-PACKAGES.md` in m2toolkit.

## Releasing

1. Update `CHANGELOG.md` and the version in `package.json`.
1. If `npm run size` reports a different size, update the size badge and the Size table in `README.md`, and `BUNDLE_SIZE` in `demo/src/Header.tsx`.
1. `npm run verify && npm run test:compat`
1. `npm publish` (runs `verify` again via `prepublishOnly`).
