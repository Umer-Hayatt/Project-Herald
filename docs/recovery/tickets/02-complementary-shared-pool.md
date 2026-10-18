# Issue #13: R02: Deliver diverse Stories from the justified provider combination

## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R02 · phase R1.

Readers receive useful reporting from the selected complementary combination through one shared pool, with duplicates grouped, output permissions preserved and continued reading when one provider fails.

**Demo:** Refresh the chosen sources, open the real public preview and private Edition, show grouped supporting reports and additional relevant coverage, then make one provider unavailable and show the declared fallback.

## Acceptance criteria

- [x] Integrate only the combination justified by the provider comparison through the existing reporting boundary; preserve normalized identity, dates, publisher, language, text, topics, original links and provider/output-use provenance. A single-source result requires the spec’s evidence for rejecting alternatives.
- [x] Apply shared eligibility to all public samples/previews and new Editions; evaluation-only or otherwise disallowed material cannot enter production Briefings, PDFs or public caches through cross-provider grouping.
- [x] Deduplicate canonical articles and conservatively group the same event across provider IDs with supporting-source links; distinct developments remain distinct. Preserve source lineage and stable identity needed for future feedback/history.
- [x] Reuse a bounded shared cache/refresh claim across readers; derive request budgets and retrieval diversity from verified coverage rather than the former 15-candidate cap. Respect delays, quotas, timeouts and per-output retention constraints.
- [x] Demonstrate incremental useful coverage and graceful one-provider failure through normal preview/Edition operations; test overlapping IDs/URLs/events, conflicting metadata, absent geography, invalid material and quota errors at the approved seam.
- [x] Record the retained combination and the spec’s three successive daily live coverage samples for each advertised interest. Missing or unsupported coverage remains explicit; do not close this gate on synthetic dates or publish unsupported region/topic promises.

## Verification Evidence (18 October 2026)

- **Test Suite:** `tests/recovery-r02.spec.ts` (12/12 passing on Desktop Chrome & Mobile Chromium).
- **Retained Provider Report:** [`docs/evidence/retained-provider-combination.md`](../evidence/retained-provider-combination.md) — TheNewsAPI baseline retained; GNews & NewsData.io evaluation complements documented; Currents & Mediastack permanently rejected.
- **Daily Live Coverage Sample (Day 1):** [`docs/evidence/daily-coverage/2026-10-18.json`](../evidence/daily-coverage/2026-10-18.json) — 6 of 10 advertised interests meet the gate; 4 wire shortages explicitly recorded.
- **Event Geography Extraction:** `src/lib/edition/geography.ts` extracts regional entities and strictly decouples publisher registration country (`locale`) from reported event geography (`event_geography`).
- **Graceful One-Provider Failure:** Tested via `NewsProviderCoordinator` with failing provider simulation (HTTP 429 quota / network timeout) alongside healthy provider; verified reader edition continues uninterrupted.
- **Output-Use Segregation:** Disallowed evaluation-only material rejected via `disallowed_output_use` and stripped from production supporting sources.

## Blocked by

- [R01: Create protected useful reporting and choose complementary providers](https://github.com/Umer-Hayatt/Project-Herald/issues/12)
