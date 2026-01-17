# Current Task Template

> **Purpose**: Outlined work plan for a focused branch. Track what is planned and what is done.
> **Scope**: Keep tasks small. Aim for 2–3 days of work max.
> **Remove Comments**: When using this template, keep the structure, populate it for the task, and remove HTML comments (<!-- like these -->).

# TASK_NAME

## Overview

<!-- Brief description of the task and the desired outcome/business value. One to two sentences. -->

## Context

<!-- Why now? Related tickets/PRs/docs. Systems and areas impacted. Links welcome. -->

## Key Decisions

<!-- Enumerate important choices (UI/UX, state management, persistence, security, performance). Add rationale if helpful. -->

## Assumptions & Constraints

<!-- What are we assuming? What are the hard limits (time, scope, tech stack, compatibility)? -->

## Dependencies

<!-- External libraries, services, feature flags, environment variables, config, build steps. Note versions if relevant. -->

## Implementation Plan

<!-- High-level step-by-step. Keep it concrete, minimal, and sequential. Prefer 5–8 crisp steps. -->

## Test Plan

<!-- How will we verify correctness? Split by layers. Include deterministic checks and IDs we’ll reuse. -->

### Unit

<!-- Component/function-level tests. Mock where needed. Key cases and edge cases. -->

### Integration

<!-- Multiple modules together. Data flow, API boundaries, error paths. -->

### E2E

<!-- User flows and cross-browser behavior. Persistence across reload. Visual/interaction checks as needed. -->

### Test IDs / Descriptions

<!-- Canonical test titles or data-testid values to keep naming consistent across Unit/Integration/E2E. -->

## Accessibility

<!-- Labels, aria-*, keyboard operability, focus management, motion/animation preferences, contrast targets (WCAG AA). -->

## Acceptance Criteria

<!-- Checklist that must be true for sign-off. Keep each item binary and verifiable. -->

- [ ] Criteria 1

- [ ] Criteria 2

- [ ] Criteria 3

## Risks & Rollback

<!-- What might break? How do we detect it quickly? What is the safe rollback or feature-flag off path? -->

## Definition of Done

<!-- Single-glance completion. Keep it honest and tight. -->

- [ ] All acceptance criteria met

- [ ] Tests written and passing (Unit/Integration/E2E as applicable)

- [ ] Accessibility checks pass (manual + automated)

- [ ] Docs/notes updated (README/CHANGELOG/internal docs)

- [ ] Peer review completed

## Success Metrics (optional)

<!-- Simple indicators of success for this task (e.g., no regressions reported; E2E pass rate ≥ X%; bundle size ≤ Y KB). -->

## References

<!-- Links to designs, specs, code references, issues, PRs, or external docs. -->