# Copilot Instructions

Read:

- docs/README_GOOGLE_WORKSPACE_ASSISTANT.md
- docs/README_AUTH.md
- docs/README_FUNCTIONS.md

before implementing features.

Project name:
APP-NAME

Core rules:

- Never access DB from frontend
- Never access Google APIs from frontend
- Use Netlify Functions for backend logic
- Use Google Sign-In for human auth
- Use Service Account for machine auth
- Use ESM imports only
- Use pg directly, no ORM

Requirements:

- Bootstrap using Vite React TypeScript
- Use Netlify Functions backend
- Use Google Sign-In for human auth
- Use Google Service Account for machine auth
- Do NOT use custom session token system
- Backend verifies Google tokens directly
- Create a simple landing page with login button
- Create authenticated home page
- Create Google Workspace test functions
- Use Ant Design
- Keep implementation simple, minimal, and serverless-first

Implement the full starter app step-by-step following the docs.
