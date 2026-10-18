## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R08 · phase R3.

When initial reporting misses a reader’s interest, the AI editor can request a limited relevant search and improve that Edition, or explain the remaining shortage when permission, coverage or budgets prevent it.

**Demo:** Start with an undercovered subject, show a server-executed permitted search adding relevant reporting to the final paper, then exhaust the budget or return no useful results and show a truthful bounded fallback.

## Acceptance criteria

- [ ] Accept only structured requests for approved provider operations and permitted subject/entity, country/language and date filters; the backend validates and executes them without exposing API keys, arbitrary URL fetching, elevated data access or quota controls to the model.
- [ ] Enforce at most two additional provider calls per Edition attempt and one refinement after results arrive, within shared/provider budgets; failed calls/retries count and exhaustion stops further requests.
- [ ] Reuse equivalent permitted searches and coalesce concurrent readers without sharing private preferences/results across ownership boundaries; pass new results through the same quality, grouping and output-use rules.
- [ ] Validate the refined selection before saving one complete daily Edition; duplicates, rejected material, disallowed evaluation content and unsupported Briefings cannot bypass the established gates.
- [ ] Keep existing/archived Editions unchanged and preserve useful fallback/shortage behavior for invalid requests, empty results, provider timeout or quota exhaustion.
- [ ] Verify actual paper improvement plus request bounds, denied operations, shared reuse/content privacy, one-refinement behavior and failure continuity at the existing Edition seam; record controlled and live evidence separately.

## Blocked by

- R07: Use a validated AI editor to select a personal Edition (draft identifier; replace with published issue link).
