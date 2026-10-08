# EpiSafe AI deployment runbook

EpiSafe runs on Netlify and Supabase. The browser application, serverless API, user accounts, and database are hosted cloud services; Resend is an optional email provider for care-circle messages. Provision each account with the project owner and review current pricing and health-data terms before entering real personal data.

## 1. Create the Supabase project

1. Create a Supabase project and choose its region deliberately.
2. In **SQL Editor**, run [`backend/supabase/schema.sql`](../backend/supabase/schema.sql).
3. In **Authentication → URL Configuration**, set the production site URL to the Netlify URL. Add the local development origin only if needed.
4. Keep email confirmation enabled for production sign-ups.
5. Copy the project URL, the **anon/public** key, and the **service_role** key. The service-role key bypasses row-level security and must remain server-only.

The schema creates `daily_logs`, `seizure_events`, and `emergency_contacts`, with per-user row-level security and database constraints. The API also scopes every database query to the authenticated user.

EpiSafe stores a member's display name in Supabase Auth user metadata (`full_name`); a separate public profile table is not required. The sign-up form requires the member's name, email, and password. On an existing account without a saved name, the next sign-in saves the submitted name to Auth metadata. Each care-data table uses the authenticated Supabase user ID and row-level security to keep members' records separate.

## 2. Deploy from GitHub to Netlify

1. In Netlify, create a site and connect the GitHub repository, or create an empty Netlify site for CLI deploys. Note its Site ID and create a Netlify personal access token.
2. In GitHub, add repository Actions variables/secrets under **Settings → Secrets and variables → Actions**:
   - Variable `VITE_SUPABASE_URL`: the Supabase project URL.
   - Secret `VITE_SUPABASE_ANON_KEY`: the Supabase anon/public key.
   - Secret `NETLIFY_AUTH_TOKEN`: the Netlify personal access token.
   - Secret `NETLIFY_SITE_ID`: the Netlify Site ID.
3. Use the repository root as the build base. The checked-in `netlify.toml` configures `npm run build`, `dist`, and `backend/functions`.
4. Set the server-only Netlify Function variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the Supabase URL and service-role key. These have no `VITE_` prefix and are not bundled into the browser.
5. The GitHub Actions workflow `.github/workflows/netlify.yml` runs `npm ci`, the TypeScript check, unit tests, and the production build on pull requests and pushes to `main`. A push to `main` also deploys `dist` to Netlify using the Netlify CLI. Pull requests are validated but do not deploy production.
6. Copy the assigned Netlify HTTPS URL into Supabase's allowed redirect URLs and the Netlify Function variable `APP_BASE_URL`. Redeploy after changing environment variables.

Set secrets in Netlify's site environment-variable settings or CLI secret store; do not put real values in `.env.example`, Git, screenshots, or presentation material. For local cloud development, copy `.env.example` to `.env` and fill it privately; `VITE_` values are public by design, while the service-role key must only be consumed in the Netlify Functions runtime.

## 3. Turn on care-circle email (optional)

1. Create a Resend account and verify a sender domain/address.
2. Set `RESEND_API_KEY` and `EMERGENCY_FROM_EMAIL` as server-side Netlify environment variables.
3. Redeploy and test with consenting test recipients.

The emergency form records the event before attempting notification. The UI reports when there are no contacts, email is not configured, delivery fails, or delivery succeeds. The message intentionally contains no seizure details. EpiSafe does not call emergency services, guarantee email delivery, or replace an agreed emergency action plan.

## 4. Verify the deployed application

- Create an account, confirm the address, sign in, and sign out.
- Create a second account with a different name and confirm the dashboard greeting and profile label match that account.
- Sign in as the first account again and verify the name and care records remain its own.
- Save a check-in and confirm it appears after a reload.
- Submit the same day's check-in twice and confirm it updates rather than duplicates.
- Add a consenting test contact and confirm its priority appears in the care circle.
- Record a test event and confirm it appears in the history and exported CSV.
- With Resend enabled, verify delivery; then test without Resend and confirm the event remains saved and the UI explains delivery is unavailable.
- Confirm a second account cannot see the first account's database rows.
- Review Netlify Function logs and Supabase database/auth settings before introducing real health information.

## Environment variable reference

| Variable | Location | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Netlify build/browser | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Netlify build/browser | Public Supabase Auth client key |
| `SUPABASE_URL` | Function runtime only | Supabase server connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Function runtime only | Server database access; secret |
| `RESEND_API_KEY` | Function runtime only | Optional email delivery; secret |
| `EMERGENCY_FROM_EMAIL` | Function runtime only | Verified Resend sender |
| `APP_BASE_URL` | Function runtime | Production origin for API CORS |
