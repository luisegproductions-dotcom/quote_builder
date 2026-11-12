# EG Signs Solutions · Quote Builder

Mobile-first quoting app. English, USD, no individual app accounts. Hosted on GitHub Pages, with Google Sheets + Apps Script for shared prices.

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
- Price settings on the home page stores one shared rate for each product in Google Sheets. No rates are supplied automatically. Blank settings remove a default; zero is valid.
- Each product opens with its saved default. Customize price enables a quote-only override; Use default price and Clear quote restore the saved default. Returning to a product also restores its default.
- No saved quote history or individual app accounts. Reloading clears the quote; shared default prices remain in Google Sheets and are loaded across devices. Internet access is required for shared defaults and saves.

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

## Google Sheets shared prices (active)

`price-config.js` points to the deployed Google Apps Script service. Google Sheets is now the source of shared defaults. Browser-only defaults are ignored and are not silently migrated. The sheet initially contains eight blank rates; staff enter verified prices using their private edit key. [Google setup and key management](google-apps-script/SETUP.md).

After activation, each product/settings opening fetches fresh shared defaults; quote overrides never write to the sheet. A shared staff key is requested when saving and remembered on this device after a successful save. No Google credentials or edit key are shipped to GitHub Pages. Reads are public, writes validated, and conflicting in-app saves rejected. An unconfirmed request is reported as an error, never silently treated as a successful shared save. Existing browser defaults are not automatically uploaded: enter verified prices after setup.

`node tests/shared-prices.cjs` exercises two isolated browser users against a mocked service. `npm test` also validates the Apps Script handler using mocked Google APIs. Live Google reads and cross-origin POST responses have been verified; unauthorized writes are rejected. An authorized live write still requires a staff member to enter the private EDIT_KEY in the app. `node tests/shared-live.cjs` performs non-mutating live connectivity checks.

Staff edit keys are stored in localStorage on the staff device after a successful save, scoped to the service URL. Forget saved key removes that device’s saved key. Rejected keys are cleared automatically. A private browsing session or blocked browser storage may require entering the key again.

## Google account sign-in upgrade (Google activation pending)

The frontend supports Google Identity Services, and the new Apps Script source verifies signed ID tokens and the staff allowlist on every write. Run through [Google sign-in activation](google-apps-script/GOOGLE-SIGN-IN.md) to create the OAuth client and update the existing service. Until the service is redeployed, the frontend preserves its previous key flow; this compatibility does not grant key access to the new service.

Approved accounts: info@11eg11.com (Workspace), luis.egproductions@gmail.com, suarezl@gmail.com. Configure ALLOWED_EMAILS and GOOGLE_CLIENT_ID in server script properties. The public GET response supplies the client ID to the frontend, so it cannot drift from the server's expected audience. Tokens are memory-only, with sign-out and expiry handling. Prices remain public, while writes require server approval. Columns D/E record the editor and time.

`npm test` verifies real RSA signatures using local test keys, issuer/audience/expiry checks, denied/removed users, and legacy-key rejection. `node tests/google-auth.cjs` tests mocked Google sign-in, expiry, logout, denied writes, and public quoting. An actual Google-authorized save remains pending Google setup. Existing shared-price tests exercise compatibility with the currently deployed legacy service.
