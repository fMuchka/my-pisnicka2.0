# Architecture Diagram (Mermaid)

```mermaid
flowchart LR
  U[User Browser] -->|Vite PWA| FE[Vue 3 + TS UI]
  FE -->|Auth| FA[Firebase Auth]
  FE -->|Sessions & Songs| FS[Firestore]
  FE -->|File Uploads| FST[Firebase Storage]
  FE -->|Emulators in Dev| EMU[Firebase Emulators<br/>Auth + Firestore + Storage]
  FE -->|Components| ARK[ARK UI Headless]
  FE -->|State| PINIA[Pinia Stores]
  FE -->|Routing| VR[Vue Router + Auth Guard]
  FE -->|Testing| TESTS[Vitest + Playwright]
  FE -->|PWA| SW[Service Worker<br/>Auto-update + Offline]
  FE -->|Styling| CSS[CSS Variables<br/>Light/Dark Theme]
```

## Tech Stack Overview

### Frontend

- **Framework**: Vue 3 Composition API + TypeScript
- **UI Library**: ARK UI (headless components)
- **Icons**: lucide-vue-next
- **State Management**: Pinia
- **Routing**: Vue Router with authentication guards
- **Build Tool**: Vite
- **PWA**: vite-plugin-pwa with auto-update

### Backend (Firebase Free Tier)

- **Authentication**: Firebase Auth (email/password for hosts, anonymous for guests)
- **Database**: Firestore (sessions, songs collections)
- **Storage**: Firebase Storage (future song files)
- **Hosting**: Firebase Hosting with SPA rewrites

### Testing

- **Unit/Component**: Vitest + @testing-library/vue
- **E2E**: Playwright
- **Coverage**: @vitest/coverage-v8

### Development

- **Emulators**: Firebase Auth (9099), Firestore (8080), Storage (9199)
- **Linting**: ESLint + Prettier
- **TypeScript**: Strict mode with enhanced safety flags
