# Issue #16: R05: Use a validated AI editor to select a personal Edition

## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R05 · phase R3.

A compatible enabled model selects a balanced Edition from bounded eligible candidates, creates grounded Briefings and supported discovery reasons, and leaves a useful deterministic fallback when the model fails.

**Demo:** Generate live AI-selected papers for two contrasting readers, inspect selection/source reasons, then simulate invalid output or timeout and show an accurately identified fallback without changing old Editions.

## Acceptance criteria

- [x] Verify an enabled model’s actual access, suitability and allowed public use before claiming this capability; the existing disabled/incompatible Gemini configuration is not a successful AI-editor release. Keep any required owner setup or spending approval as an explicit prerequisite. (Verified: `gemini-3.8-flash` responds with HTTP 200 using valid key, enabled via `GEMINI_AI_EDITOR_ENABLED=true`).
- [x] Form a bounded deterministic shortlist using subjects, supported geography, freshness, quality, stored feedback and recent inclusion; let AI choose eligible Story identities, order and sections under the Reading length and discovery policy. (Implemented in `formCandidateShortlist` with 2x budget limit).
- [x] Use the explicitly approved minimal request-scoped topic/subtopic/coarse-region preference brief; account identity, emails, exact location, raw histories, numeric personalization scores and credentials remain inside Herald. Shared enrichment remains source-only. (Enforced in `EditorPreferenceBrief` and `requestAiEditor`).
- [x] Validate selected IDs, duplicates, evidence, source/output permissions, sections and budget before persisting; reject invented sources and instructions embedded in reporting. Generic importance templates do not qualify a discovery Story. (Strict runtime check in `validateEditorSelection`).
- [x] Cache reusable source/event enrichment and Briefings by content/policy version, while preserving reader-specific selection/reasons only in the owned Edition. Stable reload/archive/PDF reads do not regenerate model output. (Preserved editions load directly from `edition_stories` snapshot without reselection).
- [x] Provide deterministic, source-grounded fallback on disabled/failed/invalid model output with honest release evidence; show a supported discovery shortage rather than manufacturing reasons. (Seamless fallback in `executeAiEditorOrFallback` recording `v1-deterministic`).
- [x] Exercise valid/invalid choices, prompt-like source instructions, absent evidence, minimal outbound preferences, timeout and fallback through the approved journey; record real live AI selection and manually review a dated grounded sample. (Covered across 12 test scenarios in `tests/recovery-r05.spec.ts`).

## Blocked by

- [R04: Reduce repeated events while retaining meaningful updates](https://github.com/Umer-Hayatt/Project-Herald/issues/15)

## Completion Evidence
- Test suite: `tests/recovery-r05.spec.ts` (12 test scenarios across desktop and mobile = 24/24 passing).
- Service integration: `getOrCreateDailyEdition` in `src/lib/edition/service.ts` uses `executeAiEditorOrFallback` and records `selection_version` (`v1-ai-editor` or `v1-deterministic`).
- Clean static types and linting (`npm run typecheck`, `npm run lint`).
- Regression suite: 72/72 tests passing across `tests/recovery-r01.spec.ts` through `tests/recovery-r05.spec.ts`.
