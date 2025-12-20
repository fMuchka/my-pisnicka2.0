# Project History Log

> **Purpose**: Searchable log of features, decisions, and milestones. Use feature IDs for easy lookup.
> **When to update**: When merging PRs or completing significant work.

## Template Entry (Copy Below)

```markdown
## YYYY-MM-DD | FEAT-XXX | Feature Name

- **Feature**: Brief description of what was built
- **Status**: 🔄 In Progress | ✅ Complete | ⚠️ Blocked | ❌ Cancelled
- **Branch**: `feature/branch-name` (if applicable)
- **PR**: #123 (if applicable)
- **Duration**: YYYY-MM-DD to YYYY-MM-DD (optional)
- **Decisions**:
  - Key decision 1 and rationale
  - Key decision 2 and rationale
- **Notes**: Outcomes, gotchas, or important context
```

## 2025-12-20 | FEAT-SETUP | Project Setup MVP Phase 1

- **Feature**: Established Vite + Vue 3 TS scaffold with strict TS, ESLint/Prettier, base folders, router + Pinia wiring, PWA plugin, and Firebase config/SDK bootstrap (Auth/Firestore/Hosting)
- **Status**: ✅ Complete
- **Branch**: main
- **PR**: n/a
- **Duration**: 2025-12-20 to 2025-12-20
- **Decisions**:
  - Enabled strict TS plus noUncheckedIndexedAccess/useUnknownInCatchVariables/exactOptionalPropertyTypes for safer typing
  - Selected vite-plugin-pwa with autoUpdate and installable manifest defaults for MVP
  - Configured Firebase Hosting for SPA rewrites and env-driven client SDK setup (Auth/Firestore ready)
- **Notes**: npm scripts cover dev/build/preview/lint/format; Firebase CLI initialized and first hosting deploy ran successfully
