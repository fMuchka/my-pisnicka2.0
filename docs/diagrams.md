# Project Diagrams (Mermaid)

Visual documentation for My Písnička 2.0 architecture and flows.

## Available Diagrams

- **[Architecture](architecture.md)** – System architecture with Vue, Firebase, ARK UI, PWA, and Firestore schemas
- **[Data Flow](data-flow.md)** – Session creation, PIN validation, Home page data fetching, voting flows
- **[User Flows](user-flows.md)** – Host and guest journeys, Home page overview, route access control
- **[Folder Map](folder-map.md)** – Project structure and file organization

## Diagram Descriptions

### Architecture

See [architecture.md](architecture.md) for:

- Complete tech stack overview
- Frontend (Vue 3, ARK UI, Pinia, Vue Router)
- Backend (Firebase Auth, Firestore, Storage)
- Testing infrastructure (Vitest, Playwright)
- PWA and service worker configuration
- **Firestore Schemas**: Sessions and Songs collections with TypeScript types
- **Security Rules**: Guest pin queries, host write protection

### Data Flow

See [data-flow.md](data-flow.md) for detailed flows:

1. **Home Page Data Fetching** – Merge hosted + joined sessions, deterministic song sorting with client-side grouping
2. **Session Join** – PIN validation, Firestore query with `isActive` check, error messaging
3. **Session Creation** – Dialog input, PIN generation, document write with schema
4. **Authentication** – Email/password flow with Firebase Auth
5. **Real-time Voting** – Firestore listener updates vote counts

### User Flows

See [user-flows.md](user-flows.md) for complete user journeys:

1. **Host Flow** – Login → Home → Sessions/Songs overview → Create/View sessions → Auto-scroll → Vote → Logout
2. **Guest Flow** – Join page → PIN entry → Session view → Play + Vote
3. **Home Page Flow** – Top navigation, sessions card (latest 3), songs card (grouped 6), action buttons
4. **Song Display** – Title + artist, chords display, auto-scroll toggle, voting
5. **Route Access** – Public (Join, Session), Protected (Home, SessionsList, Songs)

### Folder Map

See [folder-map.md](folder-map.md) for codebase organization:

- Source structure (`src/` with pages, components, composables, lib)
- Library modules (Firebase config, auth service, session/song queries)
- Configuration files (Vite, TypeScript, ESLint, Prettier, Firebase, Firestore)
- Test setup (E2E tests with Playwright)
- Public assets (PWA icons)

## Diagram Viewing & Editing

### Render Online

All diagrams render automatically in:

- GitHub-flavored markdown (web view)
- VS Code with [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)
- Any documentation site supporting Mermaid syntax

### Edit Locally

1. Open the relevant `.md` file in [docs/](.)
2. Edit the Mermaid code block directly
3. Preview in VS Code or commit to GitHub for immediate rendering

## Feature Tracking

For completed features and milestones, see [../project_history.md](../project_history.md):

- Feature IDs (FEAT-XXX)
- Completion status and PRs
- Key decisions and notes
- Duration and dependencies
