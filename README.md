# app-victor

`app-victor` is an internal Google Workspace assistant shell for authenticated operational tooling.

Today, the app is focused on one job: let an approved Google Workspace user sign in, then run backend-only connectivity and capability checks against the services this assistant will depend on.

That makes it both:

- a working internal app shell
- a validation console for Google Workspace, OpenAI, SendGrid, and Neon/Postgres integration

## What This App Is

This project is a serverless-first web app built with React on the frontend and Netlify Functions on the backend.

It uses two identity layers:

- human identity through Google Sign-In
- machine identity through a delegated Google service account for Workspace API access

The current implementation is intentionally narrow and pragmatic.

Users can:

- sign in with an approved Google Workspace account
- restore a saved session after refresh
- open a clean authenticated home page
- navigate to a dedicated Workspace Tests page
- run backend probe functions for each supported integration
- inspect raw JSON responses from those functions in the UI

## What The App Does Right Now

Current implemented capabilities:

- Google Sign-In landing flow
- backend verification of Google ID tokens through `auth-login`
- backend authorization by allowed domain and approved email lists
- session restore by revalidating the stored Google ID token on app startup
- dedicated Workspace Tests page for backend probe execution
- backend probes for Gmail, Calendar, Drive, Tasks, Docs, Sheets, Admin SDK, Analytics, OpenAI, SendGrid, and Neon Postgres

This app does not yet try to be a full operational assistant. It is the secure shell and validation surface that future assistant workflows can build on.

## How It Works

High-level flow:

```txt
User opens app
-> Google Sign-In returns a Google ID token
-> frontend sends token to /.netlify/functions/auth-login
-> backend verifies token with Google
-> backend checks allowed domain + approval lists
-> frontend stores the token locally for refresh persistence
-> protected routes become available
-> Workspace Tests calls backend functions with Authorization: Bearer <Google ID token>
-> backend re-verifies the user and runs the requested integration check
```

Important constraint:

- the frontend never talks directly to Google Workspace APIs, OpenAI, SendGrid, or Postgres
- all privileged access stays inside Netlify Functions

## User-Facing Routes

- `/` landing page with Google Sign-In
- `/home` authenticated home page
- `/workspace-tests` authenticated test and diagnostics page

While the app is restoring a saved token, it shows a temporary session restore screen instead of flashing the login page.

## Workspace Tests Included

The Workspace Tests page currently exposes these backend checks:

- Gmail test: lists recent messages with readable metadata
- Calendar test: returns up to seven events across a six-month lookback and lookahead window
- Drive test: samples visible Drive files
- Tasks test: lists task lists and a small sample of tasks
- Docs test: reads metadata and content from a configured test Google Doc
- Sheets test: reads a configured spreadsheet range
- Admin SDK test: lists a sample of directory users
- Analytics test: verifies the `analytics.readonly` scope by listing account summaries
- OpenAI test: lists visible models using the backend API key
- SendGrid test: reads SendGrid account profile information
- Neon DB test: opens a Postgres connection and reads basic server metadata

These are intentionally test-oriented functions, not end-user business workflows.

## Architecture

### Frontend

The frontend is built with:

- React
- TypeScript
- React Router
- Ant Design
- small app-level CSS layers in `src/index.css` and `src/App.css`

Frontend responsibilities:

- render routes and page shells
- perform login and logout flows
- restore saved session state
- call backend functions with the Google ID token
- display raw function output clearly

### Backend

The backend is built with Netlify Functions in ESM.

Backend responsibilities:

- verify Google ID tokens
- enforce domain and allowlist authorization
- create delegated Google Workspace clients
- hold external service credentials
- execute integration tests and return JSON responses

### Security Model

Authorization is always backend-controlled.

- frontend gets a Google credential but does not decide access
- backend verifies the token audience, email, hosted domain, and approval status
- admin users come from `ADMIN_EMAILS`
- non-admin users come from `APPROVED_EMAILS`

If `APPROVED_EMAILS` is empty, only admins are allowed in.

## Tech Stack

- Vite
- React 19
- TypeScript
- Ant Design
- React Router
- Netlify Functions
- google-auth-library
- googleapis
- OpenAI SDK
- SendGrid client
- pg

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

```env
VITE_GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_ID=
ALLOWED_EMAIL_DOMAIN=example.com
ADMIN_EMAILS=admin@example.com
APPROVED_EMAILS=

DATABASE_URL=

GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_IMPERSONATION_USER=assistant@example.com
GOOGLE_DOCS_TEST_DOCUMENT_ID=
GOOGLE_SHEETS_TEST_SPREADSHEET_ID=

OPENAI_API_KEY=
SENDGRID_API_KEY=
```

Key notes:

- `VITE_GOOGLE_CLIENT_ID` is the browser-side Google OAuth client id for Google Sign-In
- `GOOGLE_CLIENT_ID` is the backend audience value used when verifying Google ID tokens
- `ALLOWED_EMAIL_DOMAIN` restricts human access to one Google Workspace domain
- `ADMIN_EMAILS` is a comma-separated admin list; admins are implicitly approved
- `APPROVED_EMAILS` is the comma-separated allowlist for non-admin users
- `GOOGLE_IMPERSONATION_USER` is the Workspace user impersonated by the delegated service account
- `GOOGLE_DOCS_TEST_DOCUMENT_ID` and `GOOGLE_SHEETS_TEST_SPREADSHEET_ID` are only required for the Docs and Sheets probes
- `DATABASE_URL`, `OPENAI_API_KEY`, and `SENDGRID_API_KEY` are optional unless you want those specific probes to work
- legacy aliases `GOOGLE_PROJECT_ID`, `GOOGLE_CLIENT_EMAIL`, and `GOOGLE_PRIVATE_KEY` are still accepted by the backend helpers

## Local Development

Install dependencies:

```bash
npm install
```

Run the frontend only:

```bash
npm run dev
```

Run the frontend and Netlify Functions together:

```bash
npm run dev:netlify
```

Expected local ports:

- Netlify Dev serves the app at `http://localhost:8888`
- Vite runs underneath at `http://localhost:5173`

The Vite dev server is pinned to `5173` so Netlify Dev can proxy it reliably.

## How To Use The App

### 1. Configure local environment

Create `.env` from `.env.example` and provide at minimum:

- `VITE_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_ID`
- `ALLOWED_EMAIL_DOMAIN`
- `ADMIN_EMAILS`
- `GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_IMPERSONATION_USER`

Add optional values for Docs, Sheets, OpenAI, SendGrid, and database testing if you want those probes to succeed.

### 2. Configure Google Cloud and Workspace

Make sure you have:

- a Google OAuth client for browser sign-in
- a Google service account with Domain-Wide Delegation enabled
- the required Google Workspace APIs enabled
- the required admin-approved scopes granted in the Workspace admin console
- an impersonation user with access to the target Workspace data

For local browser auth, add these allowed JavaScript origins to the Google OAuth client:

- `http://localhost:8888`
- optionally `http://localhost:5173` if you use plain Vite directly

### 3. Start the app

Use:

```bash
npm run dev:netlify
```

Then open:

```txt
http://localhost:8888
```

### 4. Sign in

Use the Google Sign-In button on the landing page.

If the backend accepts your domain and email, you will be redirected into the authenticated app.

### 5. Open Workspace Tests

Use the navbar to open the Workspace Tests page.

This page is the current operational surface of the app.

### 6. Run integration probes

Click any probe card to execute its backend function.

Each result block shows the latest raw JSON response, which helps you confirm:

- auth is working
- env vars are configured correctly
- delegated Google access is working
- optional integrations are reachable from the backend

## Recommended First-Run Sequence

When bringing up a fresh environment, use this order:

1. sign in successfully
2. run Gmail, Calendar, and Drive tests
3. run Tasks, Docs, Sheets, and Admin SDK tests
4. run Analytics if that scope is configured
5. run OpenAI, SendGrid, and Neon DB if those keys are configured

This narrows failures quickly by separating core auth issues from optional service configuration issues.

## Status Codes And Failure Patterns

Common backend response meanings:

- `400`: malformed auth request or missing required request data
- `401`: invalid or missing Google identity token
- `403`: valid identity, but wrong domain or not approved
- `500`: missing backend env vars or upstream integration failures

If a Workspace Test fails, inspect the raw JSON output first. The UI is designed to expose backend failure details directly.

## Project Structure

```txt
src/
  components/
  constants/
  hooks/
  lib/
  pages/
netlify/
  functions/
    lib/
```

Structure guidance:

- `src/pages` owns route-level screens
- `src/components` owns reusable UI pieces
- `src/hooks/useAppSession.ts` owns session restore, login, logout, and probe execution flow
- `netlify/functions/auth-login.mjs` verifies sign-in tokens
- `netlify/functions/test-*.mjs` owns integration-specific probe handlers
- `netlify/functions/lib` owns shared auth, Google auth, and HTTP response helpers

## Additional Documentation

- `docs/README_AUTH.md`
- `docs/README_FUNCTIONS.md`
- `docs/README_UI_UX.md`
- `docs/README_GOOGLE_WORKSPACE_ASSISTANT.md`
