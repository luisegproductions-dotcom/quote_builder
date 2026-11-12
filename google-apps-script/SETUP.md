# Shared prices: one-time Google setup

The quote builder remains on GitHub Pages. Google Sheets holds eight shared prices; Apps Script reads and updates them. No database or individual app accounts are required.

1. In the intended Google account, open https://script.google.com/home/start and create a New project. Name it **EG Quote Builder Prices**.
2. Replace the contents of `Code.gs` with this folder's `Code.gs`.
3. Select **setup** in the function picker, click **Run**, and authorize access. This creates a private spreadsheet with all eight products and blank prices. The execution log contains its link. Run setup again safely if needed; it does not erase existing data.
4. Open **Project Settings → Script properties**. Keep the generated `EDIT_KEY` private and give it only to staff who may save defaults. Do not put it in GitHub or send it in chat. Users enter it when saving; it stays in memory only until the page closes or reloads.
5. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Deploy and authorize. If your Workspace policy disallows Anyone, tell us; this deployment will not work with sign-in-only access from GitHub Pages.
6. Send the **Web app URL** ending in `/exec` to the developer. This URL is public, not the edit key. The developer sets `window.EG_PRICE_SERVICE_URL` in `price-config.js`, publishes, and verifies Google-to-browser reads and saves.
7. Enter your real prices through Price settings after activation (or edit column C in the sheet). Blank removes a default; zero is a valid price. Keep product IDs in column A unchanged. No prices are inferred from screenshots or silently uploaded from a browser.

Price reads are public, just like the quote builder. Only writes require the staff key; the sheet itself need not be shared publicly. To revoke a key, replace EDIT_KEY in Script properties and give the new value to staff. Never embed a Google credential in the static app.

Shared prices refresh when a product or Price settings is opened. An open quote keeps its price until reopened, so another user's edit cannot silently alter a quote in progress. Concurrent in-app edits to the same product are rejected when its saved value has changed. Save updates only that product. Avoid editing the same cell directly in Sheets while a staff member is saving in the app (Apps Script locks cannot lock manual spreadsheet edits).

If Google is unavailable, the app reports the failure and does not claim a save succeeded. Custom quote prices still work. Shared defaults need internet access, including in the standalone HTML. The previous local-only mode remains active until a deployment URL is configured; no shared sync is claimed before activation.
