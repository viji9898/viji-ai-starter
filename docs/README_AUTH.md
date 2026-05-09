# README_AUTH

## Authentication Architecture

This project uses:

- Google Sign-In for human authentication
- Google Service Account for machine authentication

Current implementation details:

- browser sign-in is provided by `@react-oauth/google`
- the frontend posts the Google ID token to `/.netlify/functions/auth-login`
- the frontend persists the raw Google ID token for refresh restore
- protected backend probe routes require `Authorization: Bearer <Google ID token>`

The system intentionally does NOT use a custom session token system.

Instead:

- frontend stores the Google credential in browser storage for refresh persistence
- frontend revalidates the stored Google credential with the backend on app startup
- frontend sends Google ID token with requests
- backend verifies Google token directly with Google

In this app, session restore happens before protected routes are rendered so the user does not see a brief login-page flash during token revalidation.

This keeps the architecture simple for MVP development.

---

# Human Authentication Flow

```txt
Google Sign-In
↓
Google returns ID token
↓
Frontend stores token in browser storage
↓
Frontend reloads or restarts later
↓
Frontend sends stored token to auth-login for revalidation
↓
Backend verifies token with Google
↓
Backend authorizes request
```

---

# Important Security Rule

The frontend must NEVER decide authorization.

Frontend only:

- obtains Google credential
- sends credential to backend

Backend always:

- verifies token
- validates domain/email
- determines role

---

# Recommended Role Model

## Admin

- full application access
- operational visibility
- task management

## Team

- limited task/update access

---

# Authorization Rules

Backend should validate:

```txt
payload.hd
payload.email
payload.email_verified
payload.aud
payload.exp
```

Recommended checks:

```txt
hd === allowed workspace domain
email is approved
email_verified === true
```

Recommended approval model:

```txt
ADMIN_EMAILS => admin role + implicitly approved
ALLOWED_SIGNIN_EMAILS => non-admin sign-in allowlist
```

Only `ADMIN_EMAILS` users receive admin access to delegated domain routes.

If `ALLOWED_SIGNIN_EMAILS` is empty, only explicitly listed admins are approved to sign in.

---

# Frontend Responsibilities

Frontend should:

- render Google login button
- send Google credential to backend
- store current user state
- restore the saved Google ID token on refresh and revalidate it with the backend
- protect routes visually
- attach the Google ID token as a bearer token when calling protected backend functions

Frontend should NOT:

- trust decoded JWT payload
- authorize users
- store backend secrets

---

# Backend Responsibilities

Backend should:

- verify Google token using google-auth-library
- validate allowed domain
- validate approved users
- reject unauthorized access
- protect all backend routes
- return `401` for missing or invalid bearer tokens
- return `403` for valid identities that are not allowed to access the app
- return the normalized authenticated user shape used by the frontend session

---

# Recommended Backend Helper

Example:

```txt
requireAuth(event)
```

Responsibilities:

1. Read Authorization header
2. Extract Google token
3. Verify token
4. Validate domain/email
5. Return authenticated user
6. Reject invalid requests

The current authenticated user payload contains:

- `email`
- `name`
- `picture`
- `hd`
- `role`

---

# Why No Session Token?

For this MVP:

Advantages:

- simpler architecture
- fewer moving parts
- no JWT signing logic
- no cookie complexity
- no session persistence layer

Tradeoffs:

- backend verifies token more frequently
- Google token expiration must be handled
- less flexible for long-term enterprise auth

For internal operational tools, this is acceptable early on.

It also keeps the Netlify Function layer simple because every protected request can independently verify the caller without maintaining server-side session state.

---

# Future Upgrade Path

Later, if needed:

```txt
Google Sign-In
→ backend verification
→ httpOnly session cookie
```

can be added without major architecture changes.
