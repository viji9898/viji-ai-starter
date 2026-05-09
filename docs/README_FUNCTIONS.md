# README_FUNCTIONS

## Netlify Functions Architecture

All backend logic lives inside Netlify Functions.

Frontend must NEVER directly:

- access database
- access Google Workspace APIs
- access OpenAI APIs
- access SendGrid APIs

Current function groups in this app:

- `auth-login.mjs` for sign-in verification
- `test-*.mjs` for integration probes
- `domain-*.mjs` for standalone admin-only delegated domain operations
- `lib/*.mjs` for shared auth and response helpers

---

# Folder Structure

```txt
netlify/
  functions/
    test-google-gmail.mjs
    test-db.mjs
    auth-login.mjs
    lib/
```

Use explicit top-level `test-*.mjs` filenames for test-only handlers. This keeps the public routes obvious, like `/.netlify/functions/test-google-gmail`, without introducing wrapper duplicates.

This layout also matches the current local Netlify Dev behavior more reliably than nested test folders.

---

# Function Naming

Prefer:

```txt
auth-login.mjs
test-google-gmail.mjs
test-google-calendar.mjs
test-db.mjs
```

Avoid:

```txt
api.mjs
utils-api.mjs
generic-handler.mjs
```

Keep functions focused and small.

Current public routes include:

- `/.netlify/functions/auth-login`
- `/.netlify/functions/test-google-gmail`
- `/.netlify/functions/test-google-calendar`
- `/.netlify/functions/test-google-drive`
- `/.netlify/functions/test-google-tasks`
- `/.netlify/functions/test-google-docs`
- `/.netlify/functions/test-google-sheets`
- `/.netlify/functions/test-google-users`
- `/.netlify/functions/test-google-analytics`
- `/.netlify/functions/test-openai`
- `/.netlify/functions/test-sendgrid`
- `/.netlify/functions/test-db`
- `/.netlify/functions/domain-users-readonly`
- `/.netlify/functions/domain-task`
- `/.netlify/functions/domain-meet`

---

# ESM Only

Use:

```js
import { google } from "googleapis";
```

Do NOT use:

```js
const google = require("googleapis");
```

---

# Function Structure

Every function should export:

```js
export const handler = async (event) => {};
```

Current method expectations:

- `auth-login` accepts `POST`
- all `test-*` handlers currently accept `GET`

---

# Google Workspace Helper Pattern

Recommended:

```txt
lib/google-auth.mjs
```

Responsibilities:

- create JWT auth client
- load env vars
- replace escaped newlines
- apply scopes
- impersonate user
- allow explicit subject overrides for standalone admin-only routes when required

---

# Example Google Auth Pattern

```js
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes,
  subject: process.env.GOOGLE_IMPERSONATION_USER,
});
```

Legacy aliases `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` may still be supported for backward compatibility, but prefer the explicit `GOOGLE_SERVICE_ACCOUNT_*` names.

---

# Recommended Test Functions

```txt
test-google-users.mjs
test-google-gmail.mjs
test-google-calendar.mjs
test-google-drive.mjs
test-google-docs.mjs
test-google-sheets.mjs
test-google-tasks.mjs
test-google-analytics.mjs
test-db.mjs
test-openai.mjs
test-sendgrid.mjs
```

Each function should:

- test one capability
- return simple JSON
- fail clearly
- avoid complex abstractions
- preserve auth and authorization status codes from shared helpers where possible

Standalone delegated domain operations should:

- stay separate from `test-*` workshop probes
- require an authenticated admin viewer
- use explicit allowlists for per-user data access
- prefer the narrowest viable scope and narrow field sets

Current probe responsibilities:

- Gmail: list recent messages with readable metadata
- Calendar: return up to seven nearby events
- Drive: sample visible files
- Tasks: list task lists and sample tasks
- Docs: read a configured document
- Sheets: read a configured spreadsheet range
- Users: sample directory users from Admin SDK
- Analytics: list account summaries visible under `analytics.readonly`
- OpenAI: list visible models
- SendGrid: fetch account profile information
- DB: verify Postgres connectivity and server metadata

Standalone operational routes:

- `domain-users-readonly`: list workspace directory users with narrow readonly fields
- `domain-task`: read task lists and tasks for allowlisted operational mailboxes only using the delegated Tasks scope
- `domain-meet`: list this month's Google Meet-backed calendar events for allowlisted operational mailboxes using delegated Calendar readonly access

---

# Database Rules

Database access:

- backend only
- use pg directly
- use raw SQL
- avoid ORM complexity

Recommended:

```js
import pg from "pg";
```

The current database test uses `pg.Client` directly and returns basic server metadata instead of introducing an ORM layer.

---

# OpenAI Rules

OpenAI API calls:

- backend only
- never expose API key
- keep prompts structured
- avoid agent complexity early

---

# SendGrid Rules

SendGrid API calls:

- backend only
- never expose API key
- prefer account/profile checks for connectivity tests over sending real email
- keep email send flows behind explicit backend actions

---

# Error Handling

Always return:

```json
{
  "success": false,
  "error": "message"
}
```

Avoid raw stack traces in production responses.

Recommended status behavior:

- `400` for malformed input
- `401` for missing or invalid authentication
- `403` for forbidden access
- `500` for backend or upstream service failures

Current auth helper behavior:

- `400` for malformed auth-login payloads such as a missing token
- `401` for missing or invalid bearer tokens on protected routes
- `403` for disallowed domains or unapproved users

---

# MVP Philosophy

Build infrastructure first:

1. auth
2. Google Workspace access
3. test endpoints
4. operational visibility
5. AI summaries

Do not build complex autonomous systems early.
