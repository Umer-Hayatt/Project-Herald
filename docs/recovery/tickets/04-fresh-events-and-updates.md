# Issue #15: R04: Reduce repeated events while retaining meaningful updates

## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R04 · phase R3.

Returning readers receive fresh understanding: unchanged events included in recent Editions lose priority, while supported developments in an ongoing event remain eligible and are explained as updates.

**Demo:** Create a sequence of controlled daily Editions containing alternate-provider copies and a genuine new development; show that unchanged coverage is deprioritized while the update can appear.

## Acceptance criteria

- [x] Use the last seven completed Editions as the spec’s bounded recent-inclusion default and preserve stable event/source lineage across providers; inclusion is not recorded as proof of reading.
- [x] Down-rank unchanged previously included events without treating Skip as negative feedback or hiding distinct events that happen to share a topic.
- [x] Keep materially new, source-supported developments eligible and save an honest update explanation where shown; new provider IDs or retrieval times alone do not establish a new event.
- [x] Keep history reader-owned and existing Edition/Story/PDF content unchanged; use compatible additive data changes and bounded queries.
- [x] Verify unchanged repeats, a real update, similar topics/different events, alternate provider identities and two-reader isolation through sequential controlled Edition creation; document uncertain matches and fallback behavior.

## Status

**Completed & Verified:** 19 October 2026.
**Test suite:** `tests/recovery-r04.spec.ts` (12/12 passing on Desktop and Phone) plus full regression `tests/recovery-r01.spec.ts`, `tests/recovery-r02.spec.ts`, `tests/recovery-r03.spec.ts`, `tests/recovery-r04.spec.ts` (48/48 passing).
**Modules:** `src/lib/edition/events.ts`, `src/lib/edition/ranking.ts`, `src/lib/edition/service.ts`, `src/components/edition-story-card.tsx`.

## Blocked by

- [R03: Read consistent Editions that improve with saved preferences and feedback](https://github.com/Umer-Hayatt/Project-Herald/issues/14) (Completed)
