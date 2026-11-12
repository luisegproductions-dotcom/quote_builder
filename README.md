# EG Signs Solutions · Quote Builder

Mobile-first quoting app. English, USD, no individual app accounts. Hosted on GitHub Pages, with an optional Google Sheets + Apps Script service for shared prices.

## Open without a server

Download `EG-Quote-Builder.html` and open it in your browser. This bundled version works directly from your computer without localhost or installing anything. Rebuild it after source changes with `python3 scripts/build-standalone.py`.

## Run

`npm start` serves the app at http://localhost:5173. No package installation is required. Run calculation tests with `npm test`.

Run `npm run build` to create the static site in `dist/`. Relative asset paths support subdirectory hosting.

## GitHub Pages

This app publishes directly from `main` at `/(root)`; no build or external hosting service is needed. `.nojekyll` tells Pages to serve the files as plain static assets.

One-time setup in the repository's **Settings → Pages**:

1. Set Source to **Deploy from a branch**.
2. Select **main** and **/(root)**.
3. Click **Save** and wait for GitHub's Pages deployment to complete.

Live URL: https://luisegproductions-dotcom.github.io/quote_builder/

Subsequent pushes to `main` automatically update the site. All app assets use relative URLs, so the `/quote_builder/` path works without special routing.

The repository is private. GitHub Pages for private repositories requires an eligible GitHub plan. Keep the repository private unless its owner explicitly chooses otherwise.

## Features

- Product-first selection for all eight requested services; extend the product list in `app.js`.
- Multiple panel sizes and quantities, live area and price summary.
- Inches/metric switch with automatic dimension conversion; retains all original input units (in, ft, yd, mm, cm, m).
- Manually entered USD rates per in² or ft², copy quote, print/save PDF, and confirmed clearing.
- Changing the billing unit keeps the numerical rate, matching the original calculator. Review the rate when changing billing units.
- Price settings on the home page stores one rate for each product in this browser’s local storage. No rates are supplied automatically. Blank settings remove a default; zero is valid.
- Each product opens with its saved default. Customize price enables a quote-only override; Use default price and Clear quote restore the saved default. Returning to a product also restores its default.
- No saved quotes, user accounts, server storage, or shared history. Reloading clears the quote, but saved default prices remain in this browser. Settings do not sync across devices; standalone-file storage depends on the browser.

## Pricing source and verification

Reviewed source: https://github.com/ivanvelascoklee-web/cotizador-EG/blob/main/index.html (v2.4.1, blob `849f83e928522c3e9b5fde9c52548682c8e7992b`). It contains **no preset product rates**. Prices are manually entered. Every product uses the original rectangular area calculation; vehicle and letter pricing are not inferred from a preset.

Calculation: convert dimensions using exactly 25.4 mm/in, round individual billable area to 2 decimals, multiply by quantity and round, multiply by rate and round, then sum subtotals and round. No tax, installation, markup, minimum charge, or other fees are invented. Invalid/incomplete panels block copying and printing a final quote.

## Verified company design

Inspected the live company website and its stylesheet on November 10, 2026. The app uses its official white EG Productions & Signs logo, navy (#020912) background, blue (#31a7ff) accents, thin blue borders, subtle glow, uppercase display headings, and compact rectangular buttons. The company declares Impact/Haettenschweiler/Arial Narrow Bold with a sans-serif fallback for display type and Arial/Helvetica for body copy; this app uses the same stacks. Desktop includes its illuminated Balmain sign image; phones prioritize the product buttons and quoting fields. Print output stays white with a black logo.

Assets in `assets/` come from the company's `/assets/eg-logo-transparent.png` and `/assets/hero-balmain.png`. They are served locally and embedded in the standalone HTML, so quoting works offline without loading third-party assets.

Rechecked the original live calculator (v2.4.1) directly. All six units, both billing bases, zero-dollar rates, multiple sizes, quantities, and per-panel rounding are retained. Deliberate differences: English/USD only, product selection, automatic dimension conversion when switching units, confirmation before clearing, and blocking final exports if any panel is incomplete or invalid. Clear retains the measurement unit and restores the selected product’s saved default price; the original resets units. No product-specific rates exist in the original or this app.

## Browser verification

`node tests/browser.cjs` uses Playwright when available, against the local server on port 5173. Covers mobile widths, product selection, multiple panels, unit conversion, invalid-input blocking, clearing, copying, and print layout. Screenshots go to `/tmp/eg-quote-*.png`. Set `APP_URL` to test the deployed Pages URL with the same suite. `node tests/parity.cjs` compares the live original calculator against the pricing engine for all six units and both billing bases.

Run `node tests/settings.cjs` for saved price defaults, the same saved number for either billing unit, overrides, validation, persistence, and settings layouts. Both browser suites accept `APP_URL` for production verification.

Price settings has one USD field per product. Its numeric value applies unchanged to either in² or ft² on the quote page; rates are not converted. Previously saved rates are retained, and their former billing-unit preference is ignored. Quote-page billing units remain selectable without enabling Customize price.

Each product card has its own right-aligned Save price button. Saving validates and persists only that product and keeps the settings page open. Cancel discards unsaved edits but keeps individually saved prices.

## Google Sheets shared prices (activation pending)

The integration and service source are prepared. `price-config.js` intentionally has an empty deployment URL until the Google account owner completes [Google setup](google-apps-script/SETUP.md). Until then, the existing browser-only defaults remain active and the app labels them as such.

After activation, each product/settings opening fetches fresh shared defaults; quote overrides never write to the sheet. A shared staff key is requested when saving and retained only in memory. No Google credentials or edit key are shipped to GitHub Pages. Reads are public, writes validated, and conflicting in-app saves rejected. An unconfirmed request is reported as an error, never silently treated as a successful shared save. Existing browser defaults are not automatically uploaded: enter verified prices after setup.

`node tests/shared-prices.cjs` exercises two isolated browser users against a mocked service. `npm test` also validates the Apps Script handler using mocked Google APIs. Actual Google deployment, cross-origin requests, authorization, and live persistence must still be verified after the web-app URL is configured.
