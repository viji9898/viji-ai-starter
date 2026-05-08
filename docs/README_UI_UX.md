# README_UI_UX

## Purpose

This document describes the current frontend structure for the app UI, UX, CSS, and page layout.

Use it when you need to:

- change page structure
- add a new screen or route
- adjust styling without fighting Ant Design defaults
- keep the interface consistent with the current product direction

---

## Frontend Summary

The frontend is intentionally thin.

- React Router handles page-level navigation.
- Ant Design provides most UI primitives.
- custom CSS is limited to app shell, spacing, backgrounds, typography, and a few component wrappers.
- all privileged actions stay in Netlify Functions.

The app also uses an Ant Design `ConfigProvider` theme override to keep the UI consistent without introducing a separate design-token system yet.

The UI currently has three user-facing states:

1. unauthenticated landing page
2. authenticated home page
3. authenticated Workspace Tests page

There is also a session restore screen shown while the app revalidates a stored Google token.

---

## Route Layout

Current routes:

- `/` for the landing and sign-in experience
- `/home` for the authenticated home page
- `/workspace-tests` for backend probe execution

Routing is owned by `src/App.tsx`.

`App.tsx` should remain a route shell and app-state composition layer, not a page implementation file.

Responsibilities in `src/App.tsx`:

- load app-level session state from `useAppSession`
- gate protected routes
- choose which page component to render
- provide shared route props such as logout and current path

Page-specific layout belongs inside `src/pages`.

---

## Page Responsibilities

### Landing Page

File: `src/pages/LandingPage.tsx`

Purpose:

- present Google Sign-In
- show configuration warning if `VITE_GOOGLE_CLIENT_ID` is missing
- surface auth failure and auth-in-progress states

UX notes:

- the login card is centered vertically and horizontally
- only one primary action is shown
- failure and setup states are explicit instead of hidden in console output

### Home Page

File: `src/pages/HomePage.tsx`

Purpose:

- provide a clean authenticated entry screen
- keep the page separate from diagnostic or admin-style tooling

UX notes:

- Workspace Tests was intentionally removed from the home body
- navigation to tests lives in the navbar, not in the page content

### Workspace Tests Page

File: `src/pages/WorkspaceTestsPage.tsx`

Purpose:

- host all backend connectivity and capability checks
- show the authenticated user identity card
- render the probe grid and latest function outputs

UX notes:

- this page is operational and diagnostic by design
- results are shown inline so users can inspect raw function responses without opening devtools

### Session Restore Page

File: `src/pages/SessionRestorePage.tsx`

Purpose:

- avoid flashing the login screen while a stored session is being revalidated

---

## Component Responsibilities

### AppNavbar

File: `src/components/AppNavbar.tsx`

Owns top-level in-app navigation.

Current navigation actions:

- Home
- Workspace Tests
- Log out

Guidance:

- keep navbar actions route-focused
- avoid adding page-specific controls here unless they are truly global

### ProbeGrid

File: `src/components/ProbeGrid.tsx`

Owns the card grid for backend tests.

Each card contains:

- a title
- a short description
- a run button
- the latest raw response block

Guidance:

- keep cards action-oriented
- keep result output readable and raw
- avoid burying function responses behind extra modal layers unless the output becomes too large

### UserIdentityCard

File: `src/components/UserIdentityCard.tsx`

Shows the authenticated user identity used by the session.

Current data shown:

- avatar
- name
- email
- role
- hosted domain
- current route

This card currently belongs on the Workspace Tests page only.

---

## CSS Structure

The app uses two main CSS entry points.

### `src/index.css`

Use this file for global foundations:

- root font setup
- global text rendering
- background color baseline
- box sizing
- app height defaults
- heading font family

Current design direction:

- body and UI text use a clean sans serif stack led by `Avenir Next`
- headings use a serif stack led by `Iowan Old Style`
- this creates a warmer, more editorial feel than default Ant Design styling

### `src/main.tsx`

App-wide theming is currently applied in `src/main.tsx` through Ant Design `ConfigProvider`.

Current theme decisions include:

- primary color `#14532d`
- large rounded corners
- warm translucent card backgrounds
- consistent UI font family for Ant Design components

If the design surface grows, this is the right place to formalize shared tokens before introducing more CSS complexity.

### `src/App.css`

Use this file for app-level layout and shared utility classes:

- shell background and gradients
- content width and spacing
- page sections
- navbar layout
- panel surfaces
- login screen alignment
- result block styling
- responsive adjustments

Do not move component-specific styles into separate files unless the component complexity justifies it.

---

## Visual Direction

The current UI is intentionally simple but not default-looking.

Key traits:

- warm neutral background instead of flat white
- soft radial gradients in the app shell
- serif headings paired with sans serif interface text
- restrained spacing and card-based composition
- minimal color noise so diagnostic data stays readable

This is closer to an internal product dashboard with editorial polish than a generic admin template.

---

## Layout Rules

### App Shell

The shell is defined by `.app-shell` and `.app-content`.

- full viewport height
- centered content column
- max usable width of `1160px`
- consistent top and bottom spacing

### Screens

Each page uses the `.screen` class to establish a vertical layout rhythm.

Standard pattern:

1. navbar
2. page header
3. page-specific content blocks

### Panels and Cards

Shared card styling is provided by `.panel` and `.panel-accent`.

Use these for:

- login card
- identity card
- probe cards

They provide a consistent border, shadow, and surface treatment across the app.

### Result Blocks

The `.result-block` style is reserved for raw JSON or function output.

It is intentionally:

- dark
- scrollable
- preformatted
- large enough to inspect backend responses without collapsing whitespace

---

## Responsive Behavior

Responsive changes currently start at `960px`.

On smaller screens:

- `.app-content` reduces outer spacing
- `.home-header` stacks vertically
- `.app-navbar` stacks vertically and left-aligns actions

Guidance:

- prefer simple stacking over adding separate mobile-only layouts
- preserve button tap area and readable response blocks

---

## UX Guidelines For Future Changes

When extending the UI:

- keep `App.tsx` route-focused
- add new screens under `src/pages`
- add reusable UI under `src/components`
- keep auth and backend orchestration in hooks and serverless functions, not page JSX
- prefer one clear primary action per card or section
- keep diagnostic information visible when the user is expected to verify backend behavior
- avoid putting test and operational flows on the same page unless the workflow truly requires it

When changing CSS:

- prefer extending existing app-level classes before introducing new styling systems
- preserve the serif heading and warm neutral palette unless there is an intentional redesign
- use Ant Design components first, then layer custom CSS for layout and product identity

---

## Suggested Frontend Growth Path

If the app expands beyond test tooling, the next logical UI layers are:

1. a real home dashboard with assistant actions or summaries
2. separate operational pages distinct from test pages
3. shared section components for repeated dashboard patterns
4. tighter design tokens if the stylesheet grows beyond the current small surface

Until then, keep the frontend lean and route-driven.