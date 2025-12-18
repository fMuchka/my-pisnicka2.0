# Project Setup Plan — MyPisnicka 2.0 (MVP Phase 1: Project Setup)

Type: Setup
Status: Planned
Owner: You
Target Window: 1–2 days

Scope: Implements the "Project Setup" subsection from the MVP checklist (Vite + Vue 3 TS, linting/formatting, base structure, core deps, PWA plugin, Firebase project + SDK, firebase.json + .firebaserc).

---

## Prerequisites

- Node.js 20 LTS and npm 10+ (Windows)
- Git CLI
- Firebase CLI: `npm i -g firebase-tools`
- Firebase account with a Spark-plan project ready (can create during init)

Validation checkpoint: `node -v`, `npm -v`, and `firebase --version` all return versions; `firebase login` succeeds.

---

## 1) Initialize Vite + Vue 3 (TypeScript)

Location: this folder (my-pisnicka2.0). If the directory is not empty (it contains docs), scaffolding in-place is OK.

Commands (PowerShell or cmd):

```bash
cd c:\__Code\my-pisnicka2.0
npm create vite@latest . -- --template vue-ts
npm install
git init
git add . && git commit -m "chore: scaffold vite vue-ts"
```

Success criteria:

- Vite files created (package.json, vite.config.ts, tsconfig.json, src/*).
- `npm run dev` serves the starter app on localhost.

---

## 2) ESLint, Prettier, and TS strict mode

Install deps:

```bash
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-vue prettier eslint-config-prettier eslint-plugin-prettier
```

Create .eslintrc.cjs:

```js
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {}
}
```

Create .prettierrc:

```json
{
  "singleQuote": true,
  "semi": false,
  "trailingComma": "es5",
  "printWidth": 100
}
```

Add scripts to package.json:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint --ext .ts,.vue src",
    "format": "prettier --write ."
  }
}
```

Harden TypeScript (tsconfig.json → compilerOptions):

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "useUnknownInCatchVariables": true,
  "exactOptionalPropertyTypes": true
}
```

Validation:

- `npm run lint` shows no errors on scaffold.
- TypeScript compiles with strict mode.

---

## 3) Base project structure

Create folders:

- src/pages
- src/components
- src/composables
- src/utils
- src/router
- src/stores

Minimal router setup (src/router/index.ts):

```ts
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('../pages/Home.vue') },
    { path: '/login', component: () => import('../pages/Login.vue') }
  ]
})
```

Wire router + Pinia in src/main.ts (later, after deps installed).

---

## 4) Core dependencies (router, state)

Install:

```bash
npm i vue-router pinia @vueuse/core
```

Integrate (src/main.ts):

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './router'
import App from './App.vue'

createApp(App).use(createPinia()).use(router).mount('#app')
```

Validation: App boots with router and store without errors.

---

## 5) PWA (vite-plugin-pwa)

Install:

```bash
npm i -D vite-plugin-pwa workbox-window
```

Configure (vite.config.ts):

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'MyPisnicka',
        short_name: 'MyPisnicka',
        theme_color: '#0ea5e9',
        background_color: '#0b1020',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

Validation:

- `npm run build && npm run preview` → PWAs shows installability in devtools.

---

## 6) Firebase project + SDK (Auth, Firestore, Hosting)

CLI setup (first time):

```bash
firebase login
firebase init
```

During `firebase init`:

- Select: Hosting and Firestore (rules + indexes optional now)
- Use existing project or create new
- Public directory: `dist`
- Single-page app rewrite: Yes
- Configure as GitHub Action: No (for now)

This creates firebase.json and .firebaserc at the repo root.

Install SDK and create client bootstrap:

```bash
npm i firebase
```

Create src/lib/firebase.ts:

```ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

Create .env.local (not committed):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Validation:

- `firebase projects:list` shows the selected project.
- `firebase emulators:start` (optional) runs without config errors.
- App imports from `src/lib/firebase.ts` with no runtime errors.

---

## 7) Scripts, NPM hygiene, and CI-ready bits

Ensure package.json scripts exist:

- dev/build/preview (Vite)
- lint/format (ESLint/Prettier)

Optional: add `vite --strictPort` for deterministic dev port and pin Node in `.nvmrc`.

---

## Success Criteria (exit for Project Setup)

- Vite + Vue 3 TS app boots locally (`npm run dev`).
- ESLint/Prettier run clean on scaffold (`npm run lint`, `npm run format`).
- Typescript strict mode enabled with additional safety flags.
- Base folders exist (pages, components, composables, utils, router, stores).
- `vue-router`, `pinia`, and `@vueuse/core` installed and wired.
- PWA plugin configured; app is installable in preview build.
- Firebase CLI initialized; firebase.json and .firebaserc present.
- Firebase SDK installed; `src/lib/firebase.ts` reads env vars.

---

## Quick Run Commands

```bash
# Dev server
npm run dev

# Lint + format
npm run lint
npm run format

# PWA preview
npm run build
npm run preview

# First deploy (after build)
firebase deploy --only hosting
```

---

## Next Up (after setup)

- Authentication basics (email/password for hosts, passwordless link for guests)
- Router guards and initial public/secure pages
- Theme system and toggle (persisted)
