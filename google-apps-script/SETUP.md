# Google Sheets price service setup

For the existing EG quote builder, follow [Activate Google sign-in](GOOGLE-SIGN-IN.md). This replaces the staff key with approved Google accounts while retaining your current spreadsheet and URL.

For a new installation, paste `Install.gs` into a new Apps Script project and run `setup` once to create the sheet. Then follow the Google OAuth configuration in the sign-in guide. Deploy as a Web app, execute as Me, access Anyone. Configure the resulting public `/exec` URL in `price-config.js`.

The three approved staff accounts are `info@11eg11.com`, `luis.egproductions@gmail.com`, and `suarezl@gmail.com`. Only the server's ALLOWED_EMAILS property controls write access. Public reads and quoting need no login. No product prices are prefilled or inferred from browser screenshots.

If the service is still running its earlier deployed version, the live app continues its previous key-based behavior until you redeploy. The repository's current service source does not accept shared keys.
