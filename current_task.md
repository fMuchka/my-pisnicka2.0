# Implement Home Screen (Firestore)

## Overview

Replicate the home screen mock using real Firestore data: top navigation, sessions overview (latest 3 from hosted or joined by `createdAt`), songs overview (deterministic 6 grouped by up to 3 artists), and navigation to create/join and “View all” pages.

## Context

Free-tier Firebase only (no Cloud Functions). We will extend sessions and define songs schema, then render both on the home screen. Touches [src/lib/firebase.ts](src/lib/firebase.ts), [src/lib/session.ts](src/lib/session.ts), new [src/lib/song.ts](src/lib/song.ts), [src/pages/Home.vue](src/pages/Home.vue), routing in [src/router/Routes.ts](src/router/Routes.ts) and [src/router/index.ts](src/router/index.ts), plus placeholders [src/pages/SessionsList.vue](src/pages/SessionsList.vue) and [src/pages/Songs.vue](src/pages/Songs.vue). Join navigation points to [src/pages/Join.vue](src/pages/Join.vue).

## Key Decisions

- Songs schema: Flat `songs` collection with a single `artist` field per song; no separate `artists` collection.
- Sessions schema: Track host info and membership; add `createdAt` timestamp; keep simple creation flow with a single “Session name”.
- Membership tracking: `joinedBy: string[]` (user IDs) enables efficient queries (`array-contains`).
- Sessions sort basis: `createdAt` descending for “latest” across hosted and joined.
- Songs selection: Deterministic sort `artist ASC`, then `title ASC`; client-side grouping up to 2 per artist, up to 3 artists, max 6 songs.
- Firestore index: Composite index for `songs (artist ASC, title ASC)` to support the deterministic query efficiently.

## Assumptions & Constraints

- Free tier only; no paid Firebase features; no Cloud Functions.
- Strict TypeScript and Czech localization across UI.
- Sessions do not display participant counts; focus on name and recency.
- Emulator-first development; unit tests mock Firebase; e2e uses emulators.

## Dependencies

- Firebase Auth/Firestore setup in [src/lib/firebase.ts](src/lib/firebase.ts).
- ARK UI for dialog and buttons (e.g., `@ark-ui/vue`).
- Routes exist for Join; new routes for SessionsList and Songs.
- Firestore indexes maintained in [firestore.indexes.json](firestore.indexes.json) and validated via emulator.

## Schemas

- Session: `{ id, name, hostId, hostDisplayName, isActive, pin, joinedBy: string[], createdAt: Timestamp }`
- Song: `{ id, title, artist, text?: string, chords?: string[], createdAt?: Timestamp }`
  - `text`: WYSIWYG song text with chord notation (chords above lyrics or inline)
  - `chords`: Array of unique chords (auto-extracted from text, can be manually edited)

## Implementation Plan

1. Define TypeScript types `Session` and `Song`; extend helpers in [src/lib/session.ts](src/lib/session.ts) and create [src/lib/song.ts](src/lib/song.ts) for queries.
2. Implement Home screen in [src/pages/Home.vue](src/pages/Home.vue) per mock:
   - Top navigation with settings/profile placeholders.
   - Sessions section: fetch latest hosted and joined; merge, de-dup, sort by `createdAt`, take top 3.
   - Songs section: deterministic query ordered by artist/title; group client-side to ≤2 per artist, ≤3 artists, ≤6 songs.
   - Actions: ➕ opens create-session dialog; 🔗 navigates to [src/pages/Join.vue](src/pages/Join.vue).
3. Create-session dialog: single input for “Session name”; on submit writes session `{ name, hostId, hostDisplayName, isActive: true, joinedBy: [], createdAt }`; show success and refresh list.
4. Add routes and pages:
   - [src/pages/SessionsList.vue](src/pages/SessionsList.vue): “coming soon” page.
   - [src/pages/Songs.vue](src/pages/Songs.vue): “coming soon” page.
   - Wire “View all” links via [src/router/Routes.ts](src/router/Routes.ts) and [src/router/index.ts](src/router/index.ts).
5. Queries:
   - Sessions (hosted): `where('hostId','==',userId).orderBy('createdAt','desc').limit(3)`.
   - Sessions (joined): `where('joinedBy','array-contains',userId).orderBy('createdAt','desc').limit(3)`.
   - Merge results client-side, remove duplicates by `id`, sort by `createdAt`, select top 3.
   - Songs: `orderBy('artist','asc').orderBy('title','asc').limit(30)`; group to ≤2 per artist until 3 artists/6 songs.
6. Indexes: Ensure composite index for songs `(artist ASC, title ASC)` exists; capture in [firestore.indexes.json](firestore.indexes.json).
7. Security Rules: Allow reads of public session/song metadata; keep writes restricted to authenticated users.

## Test Plan

### Unit

- `selectHomeSongs()` groups deterministically: ≤3 artists, ≤2 songs/artist, ≤6 total, stable given input.
- `fetchLatestSessions()` merges hosted/joined, de-dups by `id`, sorts by `createdAt` desc, returns ≤3.

### Integration

- Home renders with emulator data; create-session dialog writes to Firestore and updates the sessions list without reload.
- Navigation: 🔗 to Join, “View all” links to placeholder pages.

### E2E

- Home shows latest sessions and deterministic songs; Czech selectors used.
- Create session via dialog; new session appears in top 3.
- Links navigate to the correct pages.

### Test IDs / Descriptions

- Home: `data-testid="home-view"`, `home-sessions-section`, `home-songs-section`.
- Dialog: `create-session-dialog`, `create-session-submit`.
- Songs grouping test title: “Home songs grouping deterministic by artist/title”.

## Accessibility

- Dialog uses proper focus trap, labeled input, `aria-modal`, keyboard close.
- Icon buttons have Czech `aria-label`s; visible focus states for all controls.
- Sections use headings (`h2`) and list semantics for sessions/songs.

## Acceptance Criteria

- [x] Sessions: Shows 3 latest across hosted and joined, sorted by `createdAt` desc.
- [x] Create-session dialog: Saves session with required fields and refreshes list.
- [ ] Songs: Shows up to 6 songs from up to 3 artists deterministically (stable with same dataset).
- [x] Navigation: ➕ opens dialog; 🔗 routes to Join; “View all” links route to placeholder pages.
- [ ] Firestore index for songs `(artist ASC, title ASC)` exists and app loads without index errors in emulator.
- [ ] Basic read Security Rules allow sessions/songs metadata reads; writes restricted to authenticated users.

## Risks & Rollback

- Missing indexes cause query failures: add the composite index or temporarily fall back to single `orderBy('title')` until index is ready.
- Security rules may block reads/writes: adjust rules minimally; verify with emulator before production.
- Insufficient songs to fill 6 slots: increase query `limit` or relax per-artist cap to maintain consistency.

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Tests written and passing (Unit/Integration/E2E as applicable)
- [ ] Accessibility checks pass (manual + automated)
- [ ] Docs/notes updated (README/internal docs)
- [ ] Peer review completed

## Success Metrics (optional)

- Stable, deterministic home songs selection across visits.
- E2E pass rate ≥ 90% locally with emulator.

## References

- Join page: [src/pages/Join.vue](src/pages/Join.vue)
- Firebase setup: [src/lib/firebase.ts](src/lib/firebase.ts)
- Router: [src/router/Routes.ts](src/router/Routes.ts), [src/router/index.ts](src/router/index.ts)
