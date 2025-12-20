# Authentication Implementation Plan — MyPisnicka 2.0 (MVP Phase 1: Authentication)

Type: Feature Development (TDD)
Status: Planned
Owner: You + Agent (TDD Pair)
Target Window: 3–5 days

Scope: Implements the "Authentication" subsection from the MVP checklist using Test-Driven Development methodology. Tests written by agent, implementation by developer.

Session Join UX (from draft screens/spec — distilled requirements):

- Join uses a 4-digit PIN; accept digits only, preserve leading zeros.
- Auto-detect `?pin=` in URL, prefill, and attempt join; otherwise allow manual 4-digit entry with auto-advance/paste support.
- Show status/success/error inline; keep inputs populated on error; disable button while joining.
- Backend should validate PIN length/format, TTL (~15m or session end), short cooldown for reuse, and rate-limit attempts.
- If link PIN is invalid/expired, show a friendly error and allow manual retry; on success, surface session metadata and continue to session view.

---

## Prerequisites

- Phase 1: Project Setup completed ✅
- Vitest + @vue/test-utils installed for unit/component tests
- Playwright installed for E2E tests
- Firebase Emulator Suite set up for auth testing
- Understanding of Firebase Auth API (email/password + passwordless magic links)

Validation checkpoint: `npm run test` runs Vitest, `npm run test:e2e` runs Playwright.

---

## TDD Workflow

For each iteration:

1. **Agent writes tests** (failing red tests)
2. **Developer implements code** to make tests pass (green)
3. **Developer refactors** if needed (refactor)
4. **Repeat** for next feature

---

## Testing Setup (Iteration 0)

### Install Dependencies

```bash
cd c:\__Code\my-pisnicka2.0

# Vitest + Vue testing utilities
npm i -D vitest @vitest/ui @vitest/coverage-v8 jsdom
npm i -D @vue/test-utils @testing-library/vue @testing-library/user-event

# Playwright E2E
npm i -D @playwright/test

# Firebase testing
# (will use Firebase SDK mocks for unit tests, emulator for E2E)
```

### Configure Vitest (vite.config.ts)

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      /* existing config */
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**', // Exclude Playwright E2E tests
      '**/.{idea,git,cache,output,temp}/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.config.*', '**/test-utils/**', '**/__mocks__/**'],
    },
  },
})
```

### Create vitest.setup.ts

```ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase for unit tests
vi.mock('./src/lib/firebase', () => ({
  auth: {},
  db: {},
  app: {},
}))
```

### Configure Playwright (playwright.config.ts)

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Add Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### Create Test Directories

```
src/
  composables/
    __tests__/
  lib/
    __tests__/
  pages/
    __tests__/
tests/
  e2e/
  setup.ts
```

**Success Criteria for Iteration 0:**

- `npm run test` runs without errors
- `npm run test:e2e` launches Playwright
- Test directories exist
- Firebase mocks configured

---

## Iteration 1: Auth Service Wrapper + useAuth Composable + Logout

**Goal:** Core authentication foundation with state management and logout functionality.

### Agent Creates Tests

#### 1.1 Unit Tests: Auth Service (src/lib/**tests**/authService.test.ts)

Tests to write:

- `loginWithEmailPassword()` calls Firebase `signInWithEmailAndPassword` with correct params
- `loginWithEmailPassword()` returns user on success
- `loginWithEmailPassword()` throws error on invalid credentials
- `sendPasswordlessLink()` calls Firebase `sendSignInLinkToEmail` with correct params
- `sendPasswordlessLink()` saves email to localStorage for verification
- `confirmPasswordlessSignIn()` calls Firebase `signInWithEmailLink` with email + link
- `confirmPasswordlessSignIn()` clears localStorage email on success
- `signOut()` calls Firebase `signOut`

#### 1.2 Unit Tests: useAuth Composable (src/composables/**tests**/useAuth.test.ts)

Tests to write:

- `user` is reactive and initially `null`
- `isAuthenticated` computed returns `false` when user is `null`
- `isAuthenticated` computed returns `true` when user exists
- `isHost` computed returns `true` when user email is @host domain
- `isGuest` computed returns `true` when user is anonymous or magic link
- `logout()` calls authService.signOut and clears user
- `onAuthStateChanged` listener updates user state when Firebase auth changes

#### 1.3 Component Tests: Login Page (src/pages/**tests**/Login.test.ts)

Tests to write:

- Renders email and password input fields
- Renders "Login as Host" button
- Renders "Continue as Guest" button
- Shows validation error for invalid email format
- Shows validation error for empty password
- Calls `loginWithEmailPassword` when host login form submitted
- Shows error message when login fails
- Redirects to `/library` on successful host login

#### 1.4 E2E Tests: Auth Flow (tests/e2e/auth.spec.ts)

Tests to write:

- Host can log in with email/password and access library
- Invalid credentials show error message
- Logout button clears session and redirects to home
- Protected route `/library` redirects to `/login` when not authenticated

### Developer Implements

Files to create/modify:

- `src/lib/authService.ts` - Firebase Auth wrapper functions
- `src/composables/useAuth.ts` - Auth state composable
- `src/pages/Login.vue` - Login page UI
- `src/router/index.ts` - Add auth guards

**Success Criteria for Iteration 1:**

- All unit tests pass
- All component tests pass
- All E2E tests pass
- Host can log in with email/password
- Logout functionality works
- Router guards protect `/library` route

---

## Iteration 2: Session PIN Join Flow

**Goal:** Implement the 4-digit PIN join flow per draft spec, including `join?pin=` auto-detect, manual entry with auto-advance/paste, inline status, and robust backend error handling.

### Agent Creates Tests

#### 2.1 Unit Tests: PIN Utilities (src/utils/**tests**/pin.test.ts)

Tests to write:

- `validatePin()` returns true only for `^[0-9]{4}$` and preserves leading zeros
- `normalizePin()` trims whitespace and strips non-digits from pasted strings
- `pinToString()` ensures PIN is treated as string everywhere (no numeric coercion)

#### 2.2 Unit Tests: Session API (src/lib/**tests**/sessionApi.test.ts)

Tests to write:

- `joinSession()` sends `POST /api/join-session` with `{ pin, deviceId }`
- On success, returns `{ sessionId, sessionName, hostName }`
- Typed failures: `invalid`, `expired`, `rate_limited`, `closed` map to user-friendly messages
- Keeps last attempted PIN for retry; does not consume attempts on network error

#### 2.3 Composable Tests: useSessionJoin (src/composables/**tests**/useSessionJoin.test.ts)

Tests to write:

- Auto-detects `?pin=` from URL and attempts join when length is 4
- State machine: `idle → loading → success | error`; disables submit while `loading`
- On `error`, retains input and exposes `message` + `retry()`
- On `success`, stores session metadata and triggers navigation to session view

#### 2.4 Component Tests: Join Page (src/pages/**tests**/Join.test.ts)

Tests to write:

- Renders 4-digit inputs with auto-advance and paste support
- Prefills from `?pin=1234` and immediately attempts join
- Blocks non-digit input; shows validation error for short/long/non-digit
- Calls `joinSession()` on complete entry or submit; disables button while joining
- Shows inline status banner; displays metadata on success and navigates
- On failure (`invalid/expired/rate_limited/closed`), keeps inputs and shows friendly error

#### 2.5 E2E Tests: PIN Join (tests/e2e/join-pin.spec.ts)

Tests to write:

- Auto-join via `join?pin=VALID` routes to session view on success
- `join?pin=EXPIRED` shows error and keeps PIN prefilled for manual retry
- Manual entry supports paste of `"12 34"`/`"abcd1234"` → normalized to `1234`
- Leading zeros preserved (e.g., `0073`)
- Rate-limited attempt shows message and briefly disables retries

### Developer Implements

Files to create/modify:

- `src/utils/pin.ts` - PIN validation/normalization helpers
- `src/lib/sessionApi.ts` - Client wrapper for `POST /api/join-session`
- `src/composables/useSessionJoin.ts` - Composable handling URL param, state machine, and join orchestration
- `src/pages/Join.vue` - Join screen UI (4-digit inputs, status banners)
- `src/router/index.ts` - Add `/join` route; navigate to session view on success

**Success Criteria for Iteration 2:**

- All new unit/component/E2E tests pass
- `join?pin=` auto-detect works; manual PIN entry behaves as specified
- Errors are surfaced inline without clearing inputs; retry supported
- TTL/expired/closed/rate-limit cases handled per backend responses
- On success, session metadata appears and user continues to the session view

---

## Iteration 3: Host Share & PIN Lifecycle

**Goal:** Manage 4-digit session PINs and shareable URLs (`/join?pin=XXXX`) with TTL and cooldown rules, aligned with the Session Join spec.

### Agent Creates Tests

#### 3.1 Unit Tests: PIN Lifecycle Utils (src/utils/**tests**/pinLifecycle.test.ts)

Tests to write:

- `generatePin()` produces a 4-digit, zero-padded string
- Enforces uniqueness among active sessions; regenerates on collision
- `isPinExpired(createdAt, ttlMs)` returns true after TTL or when session closes
- `canReusePin(lastClosedAt, cooldownMs)` blocks reuse during cooldown, allows after
- `getJoinUrl(baseUrl, pin)` returns `.../join?pin=XXXX`

#### 3.2 Unit Tests: Session Admin API (src/lib/**tests**/sessionAdminApi.test.ts)

Tests to write:

- `startSession()` creates a session document with `pin`, `createdAt`, `ttl`
- `endSession()` marks session closed and revokes the PIN immediately
- `startSession()` respects cooldown reuse, avoiding recently closed PINs
- Collision handling: regenerates PIN until unique among active sessions

#### 3.3 Composable Tests: useSession (src/composables/**tests**/useSession.test.ts)

Tests to write:

- Host `createSession()` exposes `pin` and `joinUrl`
- `endSession()` updates state and invalidates `pin`
- After end, `join?pin=` attempts return `closed` error
- Stores and exposes session metadata for share UI

#### 3.4 Component Tests: Session Share (src/pages/**tests**/SessionShare.test.ts)

Tests to write:

- Displays PIN prominently and the join URL
- Copy-to-clipboard works
- Shows TTL countdown and “pin revoked” state after end
- Handles collision/regeneration transparently in UI state

#### 3.5 E2E Tests: Host Share + Guest Join (tests/e2e/host-share-pin.spec.ts)

Tests to write:

- Host creates session, sees PIN, and copies URL
- Guest opens `join?pin=XXXX` and joins successfully
- Ending session invalidates PIN; guest sees friendly error
- Expired PIN shows error; cooled-down PINs can be reused for new sessions
- Simultaneous guests can join with the same active PIN

### Developer Implements

Files to create/modify:

- `src/utils/pin.ts` - Add `generatePin()`, `isPinExpired()`, `canReusePin()`, `getJoinUrl()`
- `src/lib/sessionAdminApi.ts` - Host-side session lifecycle (start/end, collision avoidance)
- `src/composables/useSession.ts` - Host session lifecycle + share helpers
- `src/pages/SessionShare.vue` - Share UI: PIN display, URL, copy button, TTL/status
- Update `src/router/index.ts` - Route to share page for hosts

**Success Criteria for Iteration 3:**

- All tests pass
- PIN uniqueness enforced among active sessions
- TTL and cooldown enforcement validated; immediate revocation on end
- Join URLs consistently formatted and usable (`/join?pin=XXXX`)
- Host share page functional; guest auto-join continues to session view

---

## Iteration 4: Router Guards & Auth State Persistence

**Goal:** Protect routes and maintain auth state across page reloads.

### Agent Creates Tests

#### 4.1 Unit Tests: Router Guards (src/router/**tests**/guards.test.ts)

Tests to write:

- `requireAuth` guard redirects to `/login` when not authenticated
- `requireAuth` guard allows navigation when authenticated
- `requireHost` guard redirects to `/` when user is guest
- `requireHost` guard allows navigation when user is host
- `redirectIfAuthenticated` guard redirects hosts to `/library`
- `redirectIfAuthenticated` guard redirects guests to last session
- Guards preserve `redirect` query param for post-login navigation

#### 4.2 Component Tests: Protected Page Access (src/pages/**tests**/)

Tests to write:

- Library page shows loading state while checking auth
- Library page renders content when authenticated as host
- Session page requires authentication
- Settings page requires host authentication

#### 4.3 E2E Tests: Route Protection (tests/e2e/router-guards.spec.ts)

Tests to write:

- Unauthenticated user cannot access `/library`
- Guest cannot access `/library` (host-only)
- Host accessing `/login` redirects to `/library`
- Deep link with `?redirect=/library` works after login
- Page reload maintains auth state
- Auth state persists after browser close/reopen (session storage)

### Developer Implements

Files to create/modify:

- `src/router/guards.ts` - Route guard functions
- Update `src/router/index.ts` - Apply guards to routes
- Update `src/composables/useAuth.ts` - Auth state persistence
- Add loading states to protected pages

**Success Criteria for Iteration 4:**

- All guard tests pass
- Protected routes redirect correctly
- Auth state persists across reloads
- Deep link redirects work
- No auth flicker on page load

---

## Testing Best Practices

### Unit Tests

- Mock Firebase SDK calls using Vitest `vi.mock()`
- Test edge cases (network errors, invalid input)
- Keep tests isolated and fast
- Use descriptive test names (Given-When-Then style)

### Component Tests

- Use @testing-library/vue for user-centric testing
- Test user interactions, not implementation details
- Mock composables and services
- Verify rendered output and emitted events

### E2E Tests

- Use Firebase Emulator for realistic auth testing
- Test complete user journeys
- Keep E2E tests focused (one happy path per test)
- Use page object pattern for complex flows

---

## Mock Strategy

### Unit Tests: Full Mocks

```ts
// Mock Firebase Auth SDK
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))
```

### E2E Tests: Firebase Emulator

```bash
# Start emulator for E2E tests
firebase emulators:start --only auth

# Configure test to use emulator
connectAuthEmulator(auth, 'http://localhost:9099')
```

---

## Success Criteria (Complete Authentication Phase)

### Functionality

- ✅ Host can log in with email/password
- ✅ Guest can request and complete passwordless sign-in
- ✅ Session invite tokens generate and validate
- ✅ Logout clears auth state
- ✅ Router guards protect host-only routes
- ✅ Auth state persists across reloads

### Testing

- ✅ All unit tests pass (>90% coverage on auth code)
- ✅ All component tests pass
- ✅ All E2E tests pass on Chromium
- ✅ No Firebase quota warnings in emulator

### Code Quality

- ✅ ESLint/Prettier clean
- ✅ TypeScript strict mode with no errors
- ✅ No console warnings in test runs
- ✅ Composables follow Vue best practices

---

## Quick Run Commands

```bash
# Run all unit/component tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e:ui

# Run specific test file
npm run test -- src/composables/__tests__/useAuth.test.ts
```

---

## Next Up (after Authentication)

- Routing & Layout (main nav, pages structure)
- Theming (color picker, dark mode toggle)
- PWA configuration finalization
