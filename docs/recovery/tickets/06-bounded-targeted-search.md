# Issue #17: R06: Fill an undercovered interest with bounded AI-requested searches

## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R06 · phase R3.

When initial reporting misses a reader’s interest, the AI editor can request a limited relevant search and improve that Edition, or explain the remaining shortage when permission, coverage or budgets prevent it.

**Demo:** Start with an undercovered subject, show a server-executed permitted search adding relevant reporting to the final paper, then exhaust the budget or return no useful results and show a truthful bounded fallback.

## Acceptance criteria

- [x] Accept only structured requests for approved provider operations and permitted subject/entity, country/language and date filters; the backend validates and executes them without exposing API keys, arbitrary URL fetching, elevated data access or quota controls to the model. (Strict runtime check in `validateTargetedSearchRequest`).
- [x] Enforce at most two additional provider calls per Edition attempt and one refinement after results arrive, within shared/provider budgets; failed calls/retries count and exhaustion stops further requests. (Enforced in `executeBoundedTargetedSearch` and `refineEditionWithTargetedSearch`).
- [x] Reuse equivalent permitted searches and coalesce concurrent readers without sharing private preferences/results across ownership boundaries; pass new results through the same quality, grouping and output-use rules. (Normalized cache lookup in `searchCache` with 1-hour window and `filterEligibleArticles`).
- [x] Validate the refined selection before saving one complete daily Edition; duplicates, rejected material, disallowed evaluation content and unsupported Briefings cannot bypass the established gates. (Guaranteed by `processGroupedStories` and `executeAiEditorOrFallback` validation seam).
- [x] Keep existing/archived Editions unchanged and preserve useful fallback/shortage behavior for invalid requests, empty results, provider timeout or quota exhaustion. (Immutable database snapshots served without re-search on reload; fallback explains honest shortage).
- [x] Verify actual paper improvement plus request bounds, denied operations, shared reuse/content privacy, one-refinement behavior and failure continuity at the existing Edition seam; record controlled and live evidence separately. (Verified across 9 test scenarios in `tests/recovery-r06.spec.ts` on desktop and mobile = 18/18 passing).

## Blocked by

- [R05: Use a validated AI editor to select a personal Edition](https://github.com/Umer-Hayatt/Project-Herald/issues/16)

## Completion Evidence
- Module: `src/lib/edition/targeted-search.ts` provides structured validation, bounded search execution, reader coalescing, undercovered interest detection, and one-refinement flow.
- Service integration: `getOrCreateDailyEdition` in `src/lib/edition/service.ts` calls `refineEditionWithTargetedSearch`.
- Test suite: `tests/recovery-r06.spec.ts` (18/18 passing).
- Static checks: Clean TypeScript (`npm run typecheck`) and ESLint (`npm run lint`).
