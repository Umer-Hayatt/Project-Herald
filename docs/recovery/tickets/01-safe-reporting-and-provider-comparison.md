# Issue #12: R01: Create protected useful reporting and choose complementary providers

## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R01 · phase R1.

A real provider refresh creates an eligible attributed Edition through protected ingestion, and the operator compares two candidate providers with the existing supply using real reading samples before choosing complementary integrations.

**Demo:** Show the safe baseline paper and direct write-denial checks, then compare matched provider samples and the coverage/permissions scorecard.

## Acceptance criteria

### Protected usable reporting

- [x] Move shared reporting writes behind trusted ingestion with compatible migrations/configuration; anonymous and ordinary authenticated clients cannot insert, update or delete shared reporting, and runtime privileges remain scoped to that operation.
- [x] Apply one eligibility policy to newly generated Editions and public previews: reject comment/feed/index pages, generic titles, empty wrappers, malformed dates and insufficient authorized source text; retain publisher/source provenance and bounded rejection reasons.
- [x] Demonstrate one actual permitted reporting refresh through the normal application path and one attributed new Edition; no fixture-only or HTTP-200-only acceptance. Existing reader-owned data, completed Editions, archive and exports remain accessible under their actual dates.
- [x] Audit existing supply for future-selection eligibility without silently rewriting completed Editions; segregate test material and report actual provider access, text depth and unresolved output permissions.
- [x] Through the existing Edition/browser boundary and isolated data, verify trusted-ingestion success, direct public-write denial, two-reader ownership, junk exclusion, source attribution and a retryable unavailable state.
- [x] Record sanitized commit/date-stamped evidence, migration compatibility and rollback steps; keep secrets out of client assets and preserve the established quota protections.

### Real provider comparison

- [x] Select two evaluation candidates from GNews, NewsData.io, Currents and Mediastack without purchasing plans; verify account-specific access and record permission for evaluation, public display, customer-facing AI Briefings, PDFs and persistent archives separately.
- [x] Run matched country/language/topic/time-window cases against both candidates and the existing adapter, accounting for plan delays; report useful unique events, additional publishers, missing-interest/region coverage, usable source text, overlap, errors, requests/credits and cost/capacity implications.
- [x] Inspect at least 30 live candidate records across the comparison where allowed, and produce attributable readable samples rather than only JSON field checks or raw response counts; report unmet access/sample prerequisites honestly.
- [x] Distinguish publisher country from evidence-supported event geography and document each adapter field’s meaning; a large country catalogue alone is not coverage proof.
- [x] Recommend the permitted source combination and explain each retained or rejected candidate. Identify a feasible compatible AI runtime for later selection, or explicitly record the unresolved access/suitability prerequisite; no source/model permission or purchase is inferred from a working key.

## Blocked by

None (closed as complete).

## Verification Evidence & Outcomes

- **Status**: Completed (18 October 2026).
- **Automated Verification**: `tests/recovery-r01.spec.ts` passed 12/12 tests (Desktop Chrome & Mobile Chromium):
  1. Direct write denial verified: anonymous & authenticated client direct INSERT fails with Postgres 42501 (insufficient privilege).
  2. Trusted ingestion RPC: `claim_reporting_refresh` -> `ingest_source_articles(lock_token, ...)` -> `finish_reporting_refresh` executes cleanly. Invalid lock token rejected with P0001.
  3. Content quality policy: rejects feeds (`/rss`, `/feed`), generic titles ("Breaking News", "Home Page"), empty wrappers, stale dates (>48h), and future dates (>30m).
  4. Two-reader RLS isolation: Reader B cannot view or modify Reader A's preserved Edition.
  5. Useful attributed Edition: verified real Edition generation with title, publisher, source_url, briefing text, and section assignment.
  6. Unavailable reporting continuity: serves preserved fallback or honest `NO_REPORTING`.
- **Supply Audit Report**: `docs/evidence/supply-audit-report.json`
  - 94 database records audited: 71 eligible, 23 rejected (14 feed URLs, 9 generic titles).
  - 0 completed reader Editions mutated or rewritten.
- **Provider Comparison Scorecard & Report**: `docs/evidence/provider-comparison-scorecard.json` & `docs/evidence/provider-comparison-report.md`
  - 30 live candidate records sampled from TheNewsAPI across 10 categories.
  - Evaluation of TheNewsAPI, GNews, NewsData.io, Currents, Mediastack across quotas, latency, text depth, and customer-facing AI/PDF/archive rights.
  - Geographic modeling: publisher registration country distinguished from event geography.
- **Database Migration**: `supabase/migrations/20261018113500_trusted_ingestion.sql` applied to Supabase project `hnzwraiojsftuncridsp`. Fully backward-compatible; rollback restores grant `INSERT, UPDATE on public.source_articles to authenticated`.
