# Issue #14: R03: Read consistent Editions that improve with saved preferences and feedback

## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R03 · phase R2 / R3.

Every Story and matching newspaper PDF expose the same complete saved content; readers can express optional subtopics and save feedback that improves a later Edition without rewriting current or archived papers. Establish the canonical Story presentation contract first, then complete the preference/learning path.

**Demo:** Read a lead and grouped Story, compare web/archive/PDF, save real UI feedback for contrasting readers, and replay the next local day to demonstrate useful selection changes and unchanged old content.

## Acceptance criteria

### Complete web, archive and PDF contract

- [x] Define and use one canonical saved Story content contract across visual variants, archive and PDF: title, Briefing, separate supported importance explanation, section/order, publication time, publisher, fallback provenance and all original/supporting-source links.
- [x] Lead and standard Story variants offer the same eligible More/Less, neutral Skip, explanation and source-access capabilities; saved feedback confirmations/failures remain usable and do not alter Edition content.
- [x] Render the separate importance field in PDF and preserve ordered canonical text and clickable source URLs; export/archive reads use the saved snapshot without news/AI retrieval or reranking.
- [x] Deliver a legible newspaper composition for short and multipage papers, with masthead/date, Story hierarchy, columns where appropriate, page breaks and numbering; handle long headlines and supported text characters without missing/clipped content.
- [x] Repair or remove the broken Trending destinations and decorative carousel controls so every remaining visible action has a valid outcome.
- [x] Verify canonical parity with distinct excerpt and importance fields, grouped sources and long content; visually inspect representative PDFs and verify private export ownership plus unchanged archived content after feedback/source updates.

### Preferences and persisted next-day learning

- [x] Add optional editable subtopic/entity choices to short onboarding/settings while broad interests still work; preserve existing interests, region, Reading length and account progress. Infer the time zone with a familiar correction path rather than mandatory technical syntax.
- [x] Use declared interest/subtopic signals and evidence-supported regional meaning for candidate selection; distinguish publisher location from reported places, retain global coverage and show honest limited-coverage explanations.
- [x] Fix negative-feedback priority so Less like this cannot be promoted by a subsequent sort; preserve one active replaceable/idempotent feedback value and keep Skip neutral.
- [x] Load actual stored feedback through normal next-day orchestration rather than passing computed feedback totals directly in the acceptance journey; show meaningful selection differences for contrasting readers and explain the effect of future settings.
- [x] Keep the current Edition, old dates, archive and PDF content stable after feedback/settings changes, including feedback identity when equivalent reports come from different providers.
- [x] Test the complete persisted browser/API journey with isolated readers and controlled supply/clock, including save failure/retry, repeated choice, changed choice, unknown geography and old-preference compatibility; record privacy checks and actual Reading length limitations.

## Status

**Completed & Verified:** 19 October 2026.
**Test suite:** `tests/recovery-r03.spec.ts` (12/12 passing on Desktop and Phone) plus full regression `tests/recovery-r01.spec.ts`, `tests/recovery-r02.spec.ts`, `tests/recovery-r03.spec.ts` (36/36 passing).
**Evidence:** `docs/evidence/screenshots/paper-desktop.png`, `docs/evidence/screenshots/paper-mobile.png`.

## Blocked by

- [R02: Deliver diverse Stories from the justified provider combination](https://github.com/Umer-Hayatt/Project-Herald/issues/13) (Completed)
