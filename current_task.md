# Implement Session PIN Validation & Join Flow

## Overview

Add Firebase-backed validation of 4-digit session PINs in the Join page, with loading and inline error states, and redirect to Session view on success.

## Context

Free-tier Firebase only (no Cloud Functions). The Join page exists in [src/pages/Join.vue](src/pages/Join.vue) and `joinSession()` is a stub in [src/lib/session.ts](src/lib/session.ts). We will query Firestore from the client and enforce access via Security Rules.

## Key Decisions

- Client-side Firestore query: validate `pin` and `isActive` for sessions.
- Inline error (Czech): "Parta s tímto PINem neexistuje." displayed under PIN input.
- Loading state: disable button and show busy state during query.
- Store: persist valid PIN in Pinia store, then navigate to Session view.
- Security Rules: minimally allow reads for active sessions while protecting non-active data.

## Assumptions & Constraints

- Free tier only; no custom backend APIs or Cloud Functions.
- Firestore collection: `sessions` with `{ pin: string; isActive: boolean; hostId: string }`.
- Capacity/host online checks are out of scope.
- Must work with Firebase emulators in dev/test; strict TypeScript in place.

## Dependencies

- Firebase Web SDK (Auth/Firestore) already configured in [src/lib/firebase.ts](src/lib/firebase.ts).
- Emulator env via `vitest.setup.ts` and `playwright.config.ts`.
- Firestore Security Rules in [firestore.rules](firestore.rules).

## Implementation Plan

1. Define `sessions` collection contract in code (types) and docs.
2. Implement `joinSession(pin)` in [src/lib/session.ts](src/lib/session.ts): Firestore query `where('pin','==',pin)` and `where('isActive','==',true)`; return success/failure.
3. Update [src/pages/Join.vue](src/pages/Join.vue):
   - Show loading (disable button) while querying.
   - On failure, show inline error: "Parta s tímto PINem neexistuje." via an `aria-live` region.
   - On success, navigate.
4. Create `Session.vue` page and route entry; navigate after successful validation.
5. Add minimal Security Rules to allow reading active sessions by guests.
6. Tests:
   - Unit tests for `joinSession()` with mocked Firestore.
   - Component test for Join.vue interactions.
   - E2E test: full join flow with emulators.

## Test Plan

### Unit

- `joinSession()` returns success when session with `pin` exists and `isActive=true`.
- Returns failure when no doc or inactive.
- Handles Firestore errors gracefully (surface generic error in UI).

### Integration

- Join.vue calls `joinSession()` with concatenated `pin` digits.
- Loading state toggles during query; button disabled.
- Error message appears when invalid; cleared on input change.
- Success triggers navigation.

### E2E

- User enters 4 digits; clicks "Připojit"; sees loading.
- If PIN invalid, sees "Parta s tímto PINem neexistuje.".
- If valid (seeded emulator), navigates to Session view and store has PIN.

### Test IDs / Descriptions

- Unit: "session: joinSession returns active session"; "session: joinSession handles inactive/none".
- Component: "join: shows error on invalid PIN"; "join: navigates on valid PIN".
- E2E: "auth: join by PIN navigates to Session".

## Accessibility

- Maintain keyboard operability for PIN inputs.
- Inline error uses `role="alert"` or `aria-live="polite"`; focus moves to error on failure.
- Ensure button disabled state and focus styles are visible; contrast meets WCAG AA.

## Acceptance Criteria

- [x] Firestore query validates `pin` and `isActive` for `sessions`.
- [x] Loading state disables "Připojit" while querying.
- [x] Invalid/inactive PIN shows inline message: "Parta s tímto PINem neexistuje.".
- [x] Valid PIN navigates to Session view.
- [x] Security Rules allow reading active sessions while preventing other reads.
- [x] Unit, component, and E2E tests implemented and passing.
- [x] Works with Firebase emulators (no real Firebase calls during tests).

## Risks & Rollback

- Risk: Misconfigured Security Rules block reads; detect via failing tests and emulator logs.
- Risk: Query latency or errors; UI must show error and allow retry.
- Rollback: Keep `joinSession()` stubbed and UI-only validation if Firestore unavailable.

## Definition of Done

- [x] All acceptance criteria met
- [x] Tests written and passing (Unit/Integration/E2E as applicable)
- [x] Accessibility checks pass (manual + automated)
- [x] Docs/notes updated (README/internal docs)
- [x] Peer review completed

## Success Metrics (optional)

- E2E join flow pass rate ≥ 95% locally.
- No emulator connection errors during test runs.

## References

- [src/pages/Join.vue](src/pages/Join.vue)
- [src/lib/session.ts](src/lib/session.ts)
- [src/lib/firebase.ts](src/lib/firebase.ts)
- [vitest.setup.ts](vitest.setup.ts)
- [playwright.config.ts](playwright.config.ts)
- Attachments: Session, Session PIN, Song Votes
