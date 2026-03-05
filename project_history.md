> **Purpose**: Searchable log of features, decisions, and milestones. Use feature IDs for easy lookup.

## Template Entry (Copy Below)

```markdown
## Feature Name

- **Feature**: Brief description of what was built
- **Decisions**:
  - Key decision 1 and rationale
  - Key decision 2 and rationale
- **Notes**: Outcomes, gotchas, or important context
```

## Home Page Initialize

- **Feature**: Home page with minimum content and function.
- **Decisions**:
  - Added form for Session creation to test the flow and create data
  - Added form for Song creation to test the flow and create data
- **Notes**:

---

## Session PIN Validation & Join Flow

- **Feature**: Firestore-backed 4-digit session PIN validation in Join page; loading state, inline error messaging, and navigation to Session view on success; minimal Security Rules for guest access
- **Decisions**:
  - Inline error message in Czech: "Parta s tímto PINem neexistuje." displayed under PIN input with `aria-live` region
- **Notes**: Firestore collection `sessions` with `{pin, isActive, hostId}` contract; PINInput component + Join page updates; unit/component/E2E tests cover validation flow; Firebase emulators used throughout dev/test cycle

---

## Authentication Iteration 1 (Email/Password)

- **Decisions**:
  - Dropped passwordless/magic-link; guest access will use PIN-based join flow in Iteration 2
  - Localized all UI/aria labels to Czech; tests/e2e selectors updated accordingly
- **Notes**: authService (email+logout), useAuth composable, Login page, and Playwright auth flow tests are in place; adjust router guard to avoid stale auth read

- **Decisions**:
  - Selected vite-plugin-pwa with autoUpdate and installable manifest defaults for MVP
  - Configured Firebase Hosting for SPA rewrites and env-driven client SDK setup (Auth/Firestore ready)
