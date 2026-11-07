# EG Signs Solutions · Quote Builder

Mobile-first static internal quoting app. English, USD, no accounts or backend.

## Run

`npm start` serves the app at http://localhost:5173. No package installation is required. Run calculation tests with `npm test`.

Deploy the repository files to any static web host. Relative asset paths support subdirectory hosting. This implementation does not publish a deployment automatically.

## Features

- Product-first selection for all eight requested services; extend the product list in `app.js`.
- Multiple panel sizes and quantities, live area and price summary.
- Inches/metric switch with automatic dimension conversion; retains all original input units (in, ft, yd, mm, cm, m).
- Manually entered USD rates per in² or ft², copy quote, print/save PDF, and confirmed clearing.
- Changing the billing unit keeps the numerical rate, matching the original calculator. Review the rate when changing billing units.
- No saved quotes, user accounts, server storage, or shared history. Reloading clears the quote.

## Pricing source and verification

Reviewed source: https://github.com/ivanvelascoklee-web/cotizador-EG/blob/main/index.html (v2.4.1, blob `849f83e928522c3e9b5fde9c52548682c8e7992b`). It contains **no preset product rates**. Prices are manually entered. Every product uses the original rectangular area calculation; vehicle and letter pricing are not inferred from a preset.

Calculation: convert dimensions using exactly 25.4 mm/in, round individual billable area to 2 decimals, multiply by quantity and round, multiply by rate and round, then sum subtotals and round. No tax, installation, markup, minimum charge, or other fees are invented. Invalid/incomplete panels block copying and printing a final quote.

Design uses the source calculator's black/white palette and multicolor accent. The main company website could not be reached from the execution environment (HTTP proxy 403), so exact website styling and its logo remain to be verified. The header is a typographic company wordmark, not a downloaded official logo.

## Browser verification

`node tests/browser.cjs` uses Playwright when available, against the local server on port 5173. Covers mobile widths, product selection, multiple panels, unit conversion, invalid-input blocking, clearing, copying, and print layout. Screenshots go to `/tmp/eg-quote-*.png`.
