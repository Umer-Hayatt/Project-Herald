# Project Herald recovery continuation

Updated 20 October 2026; latest continuation checkpoint is at the end. User request: document the work first, then continue implementing audit fixes. Implementation is authorized; do not restart planning or ask for implementation approval again.

## Urgent repository change

**Resolved:** all 33 stashed changed/new files were restored using `git stash apply 1fd3222a46380471f57e1efd7f774a7ac9bcb6c7` into `C:/Users/HP/Documents/Codex/2026-10-18/rev/herald-recovery`, branch `codex/herald-audit-fixes`, based on `36ca723`. The original main checkout and stash were preserved. Continue only in this isolated checkout. This document is now linked from its recovery README.

The active repository `E:/Project Herald` changed externally during work from `codex/herald-recovery` at `36ca723d11dc0277c965362365a016e29fc75f89` to `main` at `4a541ce`. Current stash `stash@{0}` is named `On codex/herald-recovery: recovery-wip-20261019`. Our previously uncommitted files disappeared from the working tree at that switch. Preserve main and all stashes. Inspect that stash, restore into a separate checkout based on the recovery branch, and keep this document with that checkout. Do not pop/delete the stash or reset main.

## Authority and original evidence

- Recovery specification #11 revision 2, child issues #12–#19; root AGENTS.md, PRODUCT.md and GLOSSARY.md govern implementation.
- User invoked local implement skill: TDD at approved seams, typecheck, review, commit on the recovery branch. Approved seams: reader journey and authenticated Edition orchestration against isolated infrastructure with controlled providers/model/clock, plus security/content checks.
- Prior audit: `C:/Users/HP/Documents/Codex/2026-10-18/rev/outputs/herald-recheck-2026-10-19/REVIEW.md`; nearby screenshots, PDF and sanitized evidence.
- Audit found 56 fixture articles among 144 shared records, including 32 repeated trusted-ingestion reports; reader-callable shared-write RPCs; fake sample sources; unsupported AI importance; timestamp-only update detection; missing targeted-search permissions/quotas; overstated feedback tests and completion claims.
- No production migration, cleanup, deployment, push or tracker mutation has occurred in this implementation session. Saved Editions remain unchanged. Do not say the live site is fixed.
- Earlier local R01–R07 completion claims are superseded. R08 is blocked on reliable product evidence; provider comparisons, successive live coverage, real Google callback and the seven-day paid-value pilot remain unproven.

## Changes implemented before the external branch switch

1. Test isolation: `tests/isolation.ts` rejects hosted database URLs and all TEST_BASE_URL overrides; normal Playwright starts its own app and never reuses a server. `login()` repeats the guard. Offline config runs tests/offline without app environment/server.
2. Controlled supply no longer invokes shared ingestion; it stays in memory. Controlled Edition snapshots use null source foreign keys.
3. Server-only reporting writer (`src/lib/supabase/reporting.ts`) uses SUPABASE_REPORTING_SERVICE_KEY; exposes RPC only; passed from paper page through service to supply/search. Reader clients only read supply. Missing writer gives cache-only behavior.
4. CLI-generated migration `20261019134923_server_only_reporting.sql`: drops old one-argument claim overload; revokes reader/PUBLIC claim/ingest/finish execution; requires service role; rejects zero/negative/null reservation counts; validates and locks unexpired tokens. Broad refresh reserves five calls per configured adapter conservatively.
5. Output policy requires provider and explicit allowed-use metadata; rejects controlled providers, missing permission and reserved example hosts. Trending selects raw_data. GNews/NewsData approval checks exact string true. GNews IDs hash full URLs.
6. AI editor resolves identity aliases before duplicate checks; cannot rewrite validated importance; enforces contiguous unique positions with a main lead and outside-interest discovery with importance. Source-enrichment grounding still needs deeper review.
7. Targeted search requires approved rights and server quota reservation; preserves provenance; sends country filter without assigning invented event geography; no invented publisher/date/category. Shared SQL cache functions read_reporting_search/save_reporting_search reuse query results across instances for one hour. Transient denied reservations no longer become cached empty results. Latest SQL cache changes need more PostgreSQL assertions.
8. Generic fallback importance removed. PDF renders briefing || excerpt, like web.
9. Public sample replaced with two attributed historical NASA reports (DART/Webb), stable 2022 date, measured word counts and honest historical-format label. `docs/recovery/sample-sources.md` records source URLs. This is not a representative current multi-topic sample; R07 remains partial.
10. Timestamp/update words alone cannot establish material developments. Current conservative events.ts requires raw_data.material_update verified evidence and an exact source excerpt tied to prior URL. No production producer currently creates this evidence; genuine-update support remains incomplete and must not be called fixed.

## Verification completed

- Individual offline checks reproduced failures then passed: isolation (2), controlled-supply network denial (1), editor validation (4), output permissions (2), historical sample (1), unchanged-event rejection (1), targeted-search rights/reservation/shared-result reuse (1). Latest complete-set run remains due.
- Repeated TypeScript checks passed through major patches; inspect pending outputs after restoration.
- `npm run test:reporting-security` uses dev dependency @electric-sql/pglite and script scripts/test-reporting-security.mjs. Passed isolated PostgreSQL migration execution, anonymous/reader RPC and direct table denial, server reserve/ingest/finish, zero-call refusal and consumed-token denial. This does not verify Supabase Auth/PostgREST or production.
- Full normal browser/database suite has not run. Never run it against production. Docker executable exists but its engine remained unavailable. Hidden Docker Desktop launch did not produce a running engine.
- Build, browser/PDF rendering and final lint remain to finish. An ESLint run was pending when the external branch switch was detected; do not assume a pass.
- Temporary SQL harness also exists at `C:/Users/HP/Documents/Codex/2026-10-18/rev/work/sql-check/check.cjs` and has its own installed PGlite. It can help reconstruct/check restored migration.
- npm cache used `C:/Users/HP/Documents/Codex/npm-cache` because default E: cache was outside allowed writes. Supabase CLI 2.54.11 generated the migration; latest CLI hit a home telemetry write restriction.

## Review findings and next concrete actions

Two code-review agents ran Standards and Spec reviews. Standards found local-server bypass (fixed) and stale fixtures (still pending). Spec found disabled genuine updates (explicitly partial), cached reservation denial (fixed) and process-local reuse (shared SQL cache added since review; needs re-review).

1. Restore the stashed changes safely into a separate recovery checkout. Copy this checkpoint into docs/recovery and link it prominently from README, superseding old completion claims. Record actual stash SHA and checkout path.
2. Close an additionally discovered shared-write hole: story_processing_cache grants INSERT to authenticated readers in 20261017162000_grounded_grouped_stories.sql. processGroupedStories currently upserts with reader client. Add server-only cache persistence, revoke reader writes, preserve reads, test role denial, and account for legacy untrusted cached entries.
3. Add PostgreSQL assertions for shared search cache: reader denial, active token requirement, read/reuse, expiry, invalid/null payload. Check failure counters and concurrent reuse. Limit process cache to controlled providers or recheck permissions before live cache use.
4. Update old positive fixtures for stricter provenance/domain policy, especially R01/R02/R06 and controlled Edition fixtures; preserve deliberate rejection tests. Do not weaken production policy. Old AI/update expectations also need revision. Current normal suite would fail some assertions once isolated infrastructure is available.
5. Implement a real evidence producer for genuine updates or keep R04 incomplete. Group targeted results with existing candidates by canonical event, not merely ID. AI should reject duplicate canonical events, not just identity aliases.
6. Prove persisted feedback -> changed next-day selection -> unchanged old web/archive/PDF using isolated Supabase. Existing R03 test overstates that evidence.
7. Typecheck, lint, build, offline and SQL suites; safe public sample browser/PDF checks; review final diff and commit. Record pass/fail/blocked/not-run separately.
8. Prepare reviewable production migration/configuration and fixture-quarantine work preserving snapshots, then deploy with required access/authorization and verify exact deployed version. Keep paid pilot, real provider rights/usefulness, successive daily samples and Google callback open pending actual evidence.

Production Supabase project: hnzwraiojsftuncridsp. Credentials never belong in logs, documents or commits. Do not provision paid services or contact pilot readers without the required user authorization.

## Continuation checkpoint — 20 October 2026 (current)

This section supersedes the earlier interruption and next-actions list above. Continue in the isolated `herald-recovery` checkout on `codex/herald-audit-fixes`; the original main checkout and stash `1fd3222a46380471f57e1efd7f774a7ac9bcb6c7` remain preserved. No production migration, cleanup, deployment, push or tracker mutation was performed.

### Implemented and reviewed locally

- Corrected the embedded PostgreSQL identity harness to use a non-null authenticated user. Before the fix, that reader successfully inserted into `story_processing_cache`, reproducing the actual vulnerability. The test now seeds an untrusted legacy row before the migration and proves reader INSERT/UPDATE/DELETE and writer-RPC denial afterwards.
- Extended the unshipped server-only reporting migration: authenticated cache SELECT remains available only for `trusted_server` rows, legacy rows default false, and service-only `save_processed_stories` validates and persists generated entries. A legitimate server entry may replace an untrusted legacy key, but cannot overwrite an already trusted entry. Saved Editions are untouched.
- Passed the restricted reporting writer through `processGroupedStories`, Edition service and targeted search. The consumer independently rejects untrusted entries and retains grounding validation. A regression proves rejection, generation, server persistence and trusted reuse without reader writes.
- Expanded isolated SQL assertions for shared-search read/write privilege denial, active/expired/consumed reservations, cache expiry, malformed/null payloads and competing reservations. Live reuse checks current output permission. Process-local reuse is confined to controlled providers. Pending searches wait within a bounded window; a post-reservation read closes the miss/claim race identified in review. Reservations remain conservatively charged even when that final recheck avoids a provider call.
- Combined initial and newly discovered sources before canonical-event grouping, and rejected duplicate canonical events in AI selections. Tests cover alternate IDs and tracked URL aliases. Failed provider calls count as attempts.
- Corrected positive test fixtures with explicit allowed provenance and non-example hosts; retained rejection cases. The old R03 title now states only the preservation/next-day behavior it actually checks. R04 controlled evidence tests do not establish a production update-evidence producer.
- PDF now preserves saved Briefing, separate importance, source links and `discovery_note`, including the historical sample disclosure. Multi-page text extraction excludes running headers/footers when testing paragraph continuity.
- Removed stock-image fallback from Story cards: missing/failed reporting images yield text-only standard cards. The lead badge says “Lead Story”. This follows the recovery requirement not to imply illustrative stock imagery depicts the event.
- Standards and Spec reviews found and closed the grounding-test query-chain regression, duplicate-event gap and both concurrent-search reuse gaps. No remaining actionable findings in their final rechecks; the final small image change received local build/browser checks.

### Verification evidence and limits

- Complete offline suite: **39 passed** (including original grounding and R05/R06 tests). Isolated PostgreSQL security harness: **passed**. Final output collected after the last search-race fix.
- Earlier focused pure R04 event checks: 4 passed. PDF content/link checks: 2 passed, including an eight-Story, five-page fixture. Sample and long PDF pages were rendered; inspected sample and long page 2 for margins, readable body and links. This is not an all-pages visual audit.
- TypeScript passed. Lint passed with four existing `no-img-element` warnings and no errors; final rerun after the image correction also passed.
- Direct build in recovery checkout failed because `node_modules` is a junction outside the Turbopack root. A separate verification copy with copied dependencies builds with default Turbopack (including the final search/image changes); no shared dependencies or build configuration were changed. Verification copy: `C:/Users/HP/Documents/Codex/2026-10-19/continue-implementing-project-herald-s-recovery/work/build-check`.
- Public sample browser verification uses that local production build, Chromium at desktop 1440x1000 and mobile 390x844, reduced motion, and blocks external requests. It checks historical disclosure, NASA source links, keyboard access to the PDF download, successful PDF download, no horizontal overflow or page errors. The final confirmation after the image correction passed on both sizes; screenshots were visually inspected and the empty stock-image frames are gone. Local evidence is under that chat's `work/`, not production acceptance.
- Docker engine remains unavailable. Full Supabase Auth/PostgREST, authenticated browser, ownership and persisted-feedback mutation suites are **blocked/not run**, never redirected to production. Embedded PostgreSQL and intercepted HTTP tests do not substitute for them.

### Next work and release gates

1. Start isolated Supabase infrastructure and rerun the full normal suite. Finish fixture correction where real execution reveals it (the old R02 cache test assumes seeded supply). Prove two readers, stored feedback -> changed next-day selection -> unchanged old web/archive/PDF. Existing R03 checks are insufficient.
2. Implement and verify a production source of genuine-update evidence. The conservative validator currently rejects unsupported changes, but no provider populates verified material-update evidence. R04 remains incomplete.
3. Verify provider/model permissions, useful successive-day multi-topic/regional reporting and enabled AI behavior. The two-story NASA sample is an honest historical format demonstration, not representative current supply. R07 remains partial; R08/pilot and real Google callback remain open.
4. Before rollout, validate the migration on an isolated Supabase instance, review the exact deployment commit and configure `SUPABASE_REPORTING_SERVICE_KEY` server-side. Deploy migration before the compatible app; old clients may lose enrichment persistence during this interval. Missing writer intentionally means cache-only behavior. Never expose the service key in a public variable or browser bundle.
5. Prepare a reviewed quarantine list for proven fixture/test reporting using provenance and exact IDs; preserve saved Edition snapshots and foreign-key references. Do not bulk-delete by vague title/publisher matches. No production cleanup script has been executed or accepted yet.
6. After authorized rollout, verify anonymous/reader write denial through real PostgREST, permitted reads, server generation/reuse and the authenticated reader/PDF/archive journey against the exact deployed version. Rollback must preserve revoked reader writes and must not promote legacy cache rows to trusted. Record actual outcomes before closing tickets or claiming R01–R07 completion.

Design tooling reported its existing `.impeccable/design.json` sidecar is stale relative to DESIGN.md; refresh via the design documentation workflow only when requested. The narrow image fix preserves the incumbent design; detector advisories concern existing palette/type drift.
