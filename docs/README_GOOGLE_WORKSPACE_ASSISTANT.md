# README_GOOGLE_WORKSPACE_ASSISTANT

## Overview

This project is an internal Google Workspace assistant shell with a working authentication layer and a backend integration test surface.

The system supports:

- human authentication using Google Sign-In
- machine authentication using Google Service Accounts
- Google Workspace API integrations
- Netlify Functions backend
- optional OpenAI integration
- optional Neon Postgres integration

In its current form, the app is less of a conversational assistant and more of a secure internal control surface for validating the services a future assistant workflow will rely on.

The architecture is intentionally lightweight and serverless-first.

Related docs:

- `README_AUTH.md`
- `README_FUNCTIONS.md`
- `README_UI_UX.md`

---

# Stack

- Vite + React + TypeScript
- Ant Design
- Netlify Functions
- Neon Postgres
- pg driver
- Google Identity Services auth
- Google Workspace APIs
- OpenAI API optional

---

# Bootstrap

```bash
npm create vite@latest [APP NAME] -- --template react-ts
cd [APP NAME]
npm install
```

Install dependencies:

```bash
npm install react-router-dom antd dayjs @react-oauth/google pg google-auth-library googleapis dotenv openai
npm install -D netlify-cli
```

---

# Objective

The current objective is to provide a secure internal base application with:

- landing page
- Google login button
- authenticated user
- Google Workspace machine access
- Google API test endpoints for Gmail, Calendar, Drive, Tasks, Docs, Sheets, Admin SDK, and Analytics
- optional Neon database, OpenAI, and SendGrid connectivity

This gives the project a stable foundation before adding higher-level assistant workflows, summaries, automations, or operational tasks.

---

# Google Workspace APIs

Enable:

- Gmail API
- Google Tasks API
- Google Calendar API
- Google Drive API
- Google Docs API
- Google Sheets API
- Admin SDK API

Optional:

- Google Analytics Admin API
- Google Analytics Data API

---

# Google Workspace Scopes

```txt
https://www.googleapis.com/auth/gmail.readonly,
https://www.googleapis.com/auth/gmail.modify,
https://www.googleapis.com/auth/gmail.send,
https://www.googleapis.com/auth/gmail.compose,
https://www.googleapis.com/auth/tasks,
https://www.googleapis.com/auth/calendar.readonly,
https://www.googleapis.com/auth/drive.readonly,
https://www.googleapis.com/auth/documents.readonly,
https://www.googleapis.com/auth/spreadsheets.readonly,
https://www.googleapis.com/auth/admin.directory.user.readonly,
https://www.googleapis.com/auth/admin.directory.group.readonly
```

Optional:

```txt
https://www.googleapis.com/auth/analytics.readonly
```

---

# Two Identity Systems

## Human Identity

Google Sign-In authenticates users.

Used for:

- login
- protected route access
- protected pages

## Machine Identity

Google Service Account authenticates the assistant.

Used for:

- Gmail sync
- Calendar sync
- Drive access
- Docs access
- Sheets access
- Admin SDK access

The service account uses Domain-Wide Delegation.

In the current implementation, these two identity layers stay intentionally separate:

- the signed-in human user controls access to the app
- the delegated service account performs Workspace API calls on behalf of the configured impersonation user

---

# Environment Variables

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

Notes:

- `APPROVED_EMAILS` is the explicit non-admin allowlist.
- `ADMIN_EMAILS` users are always implicitly approved.
- `GOOGLE_DOCS_TEST_DOCUMENT_ID` and `GOOGLE_SHEETS_TEST_SPREADSHEET_ID` are optional probe ids for the Docs and Sheets test endpoints.
- `OPENAI_API_KEY` and `SENDGRID_API_KEY` are optional keys for the OpenAI and SendGrid test endpoints.
- `DATABASE_URL` is used by the Neon Postgres test endpoint and any backend database features.
- The backend still accepts legacy aliases `GOOGLE_PROJECT_ID`, `GOOGLE_CLIENT_EMAIL`, and `GOOGLE_PRIVATE_KEY`.

---

# Netlify

Run locally:

```bash
netlify dev
```

Expected local ports:

- Netlify Dev: `http://localhost:8888`
- Vite target app: `http://localhost:5173`

Pin the Vite dev server to `5173` so Netlify can proxy it consistently.

For Google Sign-In to work locally, add `http://localhost:8888` to the OAuth client allowed JavaScript origins. If you also test plain Vite directly, add `http://localhost:5173` as well.

The active function routes are currently exposed under `/.netlify/functions/`, with `auth-login` for sign-in verification and top-level `test-*` handlers for integration probes.

---

# Recommended MVP

Keep the application simple:

- login page
- authenticated home page
- Google Workspace test buttons
- simple operational dashboard later

That is also the current state of the app today.

Avoid over-engineering early.
