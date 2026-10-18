# MyPísnička 2.0 – AI Agent Instructions

This file is the single source of truth for AI coding agents working in this repo
(GitHub Copilot, Claude Code, or any other tool). Tool-specific files
(`.github/copilot-instructions.md`, `CLAUDE.md`) just point here so every agent
reads the same instructions.

## Project Overview

Guitar song learning and collaborative play tool. Firebase-backed React PWA for displaying songs with chords, auto-scrolling, and real-time session voting. No audio playback—just chord sheets.

## Vue → React Migration (in progress)

The app is moving from Vue 3 to React on the `react-migration` branch.

- **Ported** (in `src/`): `lib/` (unchanged), `stores/` (Zustand), `hooks/` (former composables), `router/`, `components/_core/`, Storybook, test setup.
- **Not ported yet**: pages and feature components. The Vue originals live in [legacy-vue/](legacy-vue/) as **read-only reference**: excluded from the build, lint, typecheck and tests. Delete each file once its React version exists. `src/pages/*.tsx` are placeholders until then.
- **The owner ports pages and feature components themselves** to learn React with this codebase. Don't port them unless explicitly asked; review and explain instead.
- [docs/](docs/) still describes the Vue-era architecture; refresh it once the port is done.

## Tech Stack

- **Frontend**: React 19 + TypeScript + ARK UI (`@ark-ui/react`) + Zustand + React Router 7 (data router)
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting) – **FREE TIER ONLY, NO MONEY SPENT**
  - No Cloud Functions (paid feature)
  - No paid Firebase features or services
  - All solutions must work within free tier limits
- **Testing**: Vitest (unit), Playwright (e2e)
- **Build**: Vite + vite-plugin-pwa (auto-update service worker)

## Critical Architecture Patterns

### 1. Firebase Setup & Emulator Strategy

- **Firebase config**: [src/lib/firebase.ts](src/lib/firebase.ts) reads `VITE_FIREBASE_*` env vars from `.env.local`
- **Emulator auto-detection**: Connects to emulators in dev/test mode unless `VITE_DISABLE_FIREBASE_EMULATOR=true`
- **Test mode**: `vitest.setup.ts` mocks Firebase SDK modules; unit tests never hit real Firebase
- **E2E tests**: `playwright.config.ts` sets emulator env vars in `webServer.env` and launches dev server with emulators
- Missing `.env.local` throws clear error messages from `requiredEnv()` helper

### 2. TypeScript Strictness

Strict mode with extra safety flags in [tsconfig.app.json](tsconfig.app.json) (the root `tsconfig.json` only holds project references; its `compilerOptions` don't reach the app):

- `strict` (includes `useUnknownInCatchVariables`), `noUncheckedIndexedAccess`
- Always check array access with `arr[i]` (could be undefined)
- Catch blocks use `unknown`, not `any`—cast explicitly
- `exactOptionalPropertyTypes` is **off**: `src/lib` doesn't satisfy it yet. New props are still typed `?: T | undefined` so it can be turned on later.

### 3. Authentication & Routing

- **Hook**: [src/hooks/useAuth.ts](src/hooks/useAuth.ts): `useAuth()` returns `user`, `isAuthenticated`, `isGuest`, `logout` for components; `waitForAuthReady()` / `isAuthenticated()` are plain functions for non-React code
- **Service layer**: [src/lib/authService.ts](src/lib/authService.ts) wraps Firebase Auth methods
- **Route guards**: [src/router/index.tsx](src/router/index.tsx) guards routes with **loaders** (`requireHost`, `requireHostOrSessionGuest`) that run before the page renders and `throw redirect(...)`. Routes without a loader are public.
- **State**: Zustand stores in [src/stores/](src/stores/). Derived values are exported selectors (e.g. `selectHasActiveSession`); selectors must return primitives or stable references, never a fresh object.
- **Hosts**: users who pass the login
- **Guests**: users who got in through pin or direct session url
- **Czech localization**: UI/labels/aria in Czech; e2e selectors use Czech text (e.g., `Přihlásit se`, `Heslo`)

### 4. Component & UI Conventions

- **ARK UI**: Headless component library; import specific submodules like `@ark-ui/react/menu`, `@ark-ui/react/field`
- **Core components**: Reusable UI in [src/components/\_core/](src/components/_core/) (e.g., `Button.tsx`). Value props follow Ark's naming: `value` / `onValueChange`, `checked` / `onCheckedChange`, `open` / `onOpenChange`. Omitting `value` makes a field uncontrolled (`defaultValue`). Extra props on Input/Select/Textarea go to the native element.
- **Styles**: CSS Modules (`Button.module.css`) next to each component, the stand-in for Vue's scoped styles. Write kebab-case classes in CSS and read them camelCased in TSX (`.btn-primary` → `styles.btnPrimary`). Tests see unhashed class names.
- **Design tokens**: CSS custom properties live in [src/styles/global.css](src/styles/global.css) (light theme in `:root`, dark theme in `[data-theme='dark']`), imported by `main.tsx`. Kept separate from the app shell so base components can render correctly outside of it (e.g. in Storybook).
- **Storybook**: Base/core components get a co-located `*.stories.tsx` next to the component (e.g. `Button.tsx` + `Button.stories.tsx`), not a separate `stories/` folder. `.storybook/preview.tsx` imports `global.css` directly, wraps stories in a `MemoryRouter`, and includes a light/dark toolbar toggle (`@storybook/addon-themes`, toggling `data-theme` on `<html>` the same way `useTheme` does).
- **Icons**: `lucide-react` for SVG icons

### 5. Testing Patterns

- **Unit tests**: Vitest + `@testing-library/react` (`renderHook` for hooks); mock Firebase modules in `vitest.setup.ts`, then mock `onAuthStateChanged` in individual tests (see [src/hooks/\_\_tests\_\_/useAuth.test.ts](src/hooks/__tests__/useAuth.test.ts))
- **Component tests**: Use `@testing-library/react` and `@testing-library/user-event` for DOM interactions; assert on callback props (`vi.fn()`)
- **Stores created on import** (theme, session) need `vi.resetModules()` + dynamic import per test, or the `createSessionStore()` factory
- **jsdom limits**: anything Ark validates in `beforeinput` (e.g. PIN digits) only works in a real browser; test it in [tests/e2e/storybook/](tests/e2e/storybook/)
- **E2E tests**: Playwright in [tests/e2e/](tests/e2e/); Czech selectors, emulator-backed, dev server auto-launched. Firestore rules tests (`tests/firestore/`) need the emulator and run only via `npm run test:rules`
- **Coverage**: `npm run test:coverage` with `@vitest/coverage-v8`

## Developer Workflows

### Environment Setup

1. Copy Firebase config to `.env.local` (keys: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`)
2. Install Firebase emulators: `firebase init emulators` (Auth, Firestore, Storage)
3. Start dev server: `npm run dev` (auto-connects to emulators on localhost)

### Key Commands

- `npm run dev` – Vite dev server (port 5173, emulators auto-detected)
- `npm run build` – TypeScript check + Vite build
- `npm run test` – Vitest watch mode
- `npm run test:run` – Vitest single run
- `npm run test:coverage` – Coverage report with v8
- `npm run test:e2e` – Playwright headless
- `npm run test:e2e:ui` – Playwright UI mode
- `npm run deploy` – Build + Firebase Hosting deploy
- `npm run lint` – ESLint (incl. `react-hooks` rules) over `src` and `.storybook`
- `npm run format` – Prettier auto-fix
- `npm run storybook` – Storybook dev server (port 6006) for isolated component development
- `npm run build-storybook` – Static Storybook build

### Firebase Emulator Usage

- **Default ports**: Firestore (8080), Auth (9099), Storage (9199)
- **Override in `.env.local`**: Set `VITE_FIRESTORE_EMULATOR_PORT`, `VITE_FIREBASE_AUTH_EMULATOR_PORT`, etc.
- **Disable emulators**: Set `VITE_DISABLE_FIREBASE_EMULATOR=true` to force prod Firebase

### PWA/Service Worker

- `vite-plugin-pwa` with `registerType: 'autoUpdate'` – SW updates automatically
- Manifest in [vite.config.ts](vite.config.ts) with Android/iOS/Windows icons
- Offline-first caching for fonts via Workbox `runtimeCaching`

## Common Pitfalls

1. **Hooks outside React**: `useAuth()`, `useSessionStore()` etc. only work in components. Loaders and other plain code use `useSessionStore.getState()`, `waitForAuthReady()`, `isAuthenticated()`
2. **Array indexing**: TypeScript will flag `arr[i]` as possibly undefined; use optional chaining or explicit checks
3. **Firebase emulator connection errors**: Check emulator ports in terminal output; ensure Firebase CLI emulators are running
4. **Czech text in tests**: All Playwright selectors use Czech labels (`getByLabel('Email')`, `getByRole('button', { name: /přihlásit se/i })`)

## Context Verification

Character for this instruction file in **CANARY_STRING** is "🎵".

If you have read this file, include the CANARY_STRING verbatim in your response
(e.g. as a final line) when discussing this project. This lets the user confirm
you actually loaded these instructions rather than working from stale, cached, or
missing context. If you cannot find this file, do not guess or fabricate the
string—say so instead.
