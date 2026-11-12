# Activate Google sign-in for price editing

The frontend is ready. The deployed Google service still uses the previous staff key until you update its code. This upgrade keeps your spreadsheet, existing prices, public quoting, and service URL.

## 1. Create a Google OAuth client

Open https://console.cloud.google.com/auth/clients in your Google account and select/create the project you want to use for the quote builder.

- If prompted to configure Google Auth Platform, set the app name to **EG Signs Solutions Quote Builder** and enter your support/contact email.
- Select **External** audience: two approved staff accounts are Gmail addresses. During Testing, add all three staff emails below as test users. Use Production when ready for regular staff use.
- Create a client of type **Web application**.
- Add this exact **Authorized JavaScript origin**: `https://luisegproductions-dotcom.github.io` (no `/quote_builder/` path).
- No redirect URI is needed for the Google Identity Services popup/callback flow.
- Copy the **Client ID** ending in `.apps.googleusercontent.com`. The Client ID is public. Do not send or put a client secret in the quote builder; none is needed.

## 2. Update your existing Apps Script project

Open the existing EG price-service project, not a new spreadsheet/project.

1. Replace the existing `Code.gs` contents with the entire generated [`Install.gs`](Install.gs). It combines the JWT verification library and the service. Do not also add `JwtLibrary.gs` or a second copy of the service.
2. In **Project Settings → Script properties**, add `GOOGLE_CLIENT_ID` with your Client ID.
3. Add/update `ALLOWED_EMAILS` with:
   `info@11eg11.com,luis.egproductions@gmail.com,suarezl@gmail.com`
4. Keep `SHEET_ID` unchanged. `EDIT_KEY` can be removed: the new service never accepts it.
5. Save. If running `setup`, it preserves the current sheet and prices and fills ALLOWED_EMAILS only when absent. No new database is created.
6. Choose **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. Keep **Execute as: Me** and access **Anyone**. Approve additional authorization for fetching Google's public signing keys if requested. Updating the existing deployment keeps the `/exec` URL.

## 3. Verify

Open the quote builder and go to Price settings. It should now show **Sign in with Google** instead of asking for a key. Sign in with one of the three approved accounts and save a real price. The spreadsheet records the account and UTC timestamp in columns D/E. Another browser should see that price when opening a product.

Send the developer your public Client ID and confirm the service was redeployed so the public configuration can be checked. If Google gives you a different `/exec` URL, send that too. Never send passwords, client secrets, or ID tokens.

## Access and sessions

- Every save verifies the JWT signature against Google's rotating public RSA keys and checks algorithm, audience, issuer, expiration, verified email, and the current server-side email allowlist. The service never trusts an email supplied separately by the browser.
- `info@11eg11.com` must be a Google Workspace account. The other two accounts are Gmail. Third-party Google-account emails without Workspace are intentionally not accepted as proof of current email ownership.
- Remove an email from ALLOWED_EMAILS to revoke price editing immediately on its next request; no frontend deployment is required. Revocation does not depend on hiding a button.
- ID tokens stay only in memory. Google can reuse its existing account session when signing in, but a reload or expiration may require clicking the Google button again. This app does not create a separate long-lived session database or store passwords.
- Sign out clears the app's token and does not sign you out of Google globally. Public quotes and quote-only custom rates remain available without login.
- Standalone HTML opened as `file://` cannot use Google's registered web origin to sign in. Use the hosted app for authenticated saves; local quoting still works.
- After receiving the upgraded service metadata, the frontend deletes its old saved staff key. There is no key fallback on the upgraded server.

## Sources and maintenance

Verification follows Google's guidance: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token . This uses the vendored general-purpose JWT verifier, not Google's development-only tokeninfo endpoint.

`JwtLibrary.gs` vendors `lib/jsrsasign-all-min.js` from npm **jsrsasign@11.1.5** (the distributed file's own banner reports 11.1.4), with a two-line navigator shim for Apps Script. License: `JWT-LICENSE.txt`. Google signing keys are cached for one hour and refreshed for an unknown key ID. Run `python3 scripts/build-google-service.py` after editing source to regenerate Install.gs.

Automated tests verify real RSA signatures with local test keys plus mocked Google UI flows. Google OAuth consent/account policy and a live approved-account write require activation and a staff login; they are not claimed as tested before deployment.
