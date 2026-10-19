# Herald recovery: start here

## Current state

Planning checkpoint: 19 October 2026, Asia/Karachi. Active authority: [recovery specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11). Main baseline: `3e8e437735d3258e5e342c7d1f738a30e8d99f9c`. Working branch: `codex/herald-recovery`.
The eight revised recovery tickets have been published as issues [#12](https://github.com/Umer-Hayatt/Project-Herald/issues/12) through [#19](https://github.com/Umer-Hayatt/Project-Herald/issues/19) with `ready-for-agent` labels, native parent sub-issue links to #11, and native linear `blockedBy` edges. See [the ticket index](TICKET-REVIEW.md).
Active frontier: issue #19 (R08: Verify the deployed release and validate its paid-value offer). R01 through R07 completed and verified on 18–19 October 2026.

This recovery replaces the expired 17 October 21:00 hackathon schedule for new recovery work. The original issues #1–#10 are historical scope/evidence, even though still open; their state does not establish what is implemented. Use current code and dated checks, not old completion claims. Parent #11 stays open and unchanged.

## Resume in order

1. Read this handoff, the [short plan](plan.md), [ticket index](TICKET-REVIEW.md), and the authoritative issue plus its comments. The [spec snapshot](spec.md) is a convenience copy; GitHub is authoritative for subsequent changes.
2. Check the working tree and current commit. Preserve existing work. Read the current Product, Glossary, relevant ADRs, and issue-tracker instructions before implementation or status changes.
3. The eight tickets (#12–#19) are published with native sub-issue and blocking relationships. Work only the frontier: open tickets whose blockers are complete. The current frontier is R08 (#19).
4. Before closing a child, record the exact commit, environment, date, criteria outcomes and remaining limitations. Pass/fail/blocked/not-run are distinct. Update the ticket and this small checkpoint; keep this handoff current for the next agent.

## Product decisions to preserve

- Existing Next.js/TypeScript/Tailwind/Supabase/Vercel product; Google sign-in and one private preserved Edition per reader/local day. English-language broad-audience direction remains.
- Compare two candidate providers with the existing supply; retain demonstrated useful permitted coverage rather than integrating all four or maximizing raw counts. One shared normalized/eligible pool supports previews and Editions.
- Group the same event across providers with provenance. Publisher country differs from reported event geography. Down-rank unchanged events from the last seven completed Editions while allowing supported material updates. Inclusion is not proof of reading; Skip remains neutral.
- AI refines a bounded shortlist and creates grounded Briefings. It may request at most two additional provider calls and one refinement per Edition attempt, within shared budgets. The server validates and executes approved operations.
- Approved AI privacy change: minimal request-scoped topics/subtopics, coarse selected region and bounded subject cues may be sent for selection. Identity, email, exact location, raw histories, numeric scores and credentials remain inside Herald. Source enrichment remains source-only.
- A compatible enabled model and real AI selection are required to claim the AI editor works. The previously disabled Gemini integration is not proof of that capability. Provider/model suitability and output permissions must be verified before use; keep recovery within free services unless the owner separately authorizes spend.
- Web/archive/PDF read the same saved content, including separate importance explanations and all sources. Lead/standard variants retain feedback and sources. Existing Editions remain unchanged after new reporting, feedback or settings.
- Preserve the brand/type/color foundation, remove unsupported social proof and decorative interactions, and ship usable accessible screens throughout. Any person art is human-authored; optional custom art/motion does not gate reader-ready acceptance.
- Product-ready requires R1–R4; commercial evidence requires the real R5 pilot. Price/participants/cost capacity are prerequisites to verify, not invented facts. Live billing is separate scope. Recruiting/messaging people or buying services requires appropriate owner authorization.

## Why recovery exists

The 18 October review found weak/thin reporting, a constrained candidate pool, incomplete lead-Story actions, broken Trending anchors, omitted separate PDF importance content, a negative-feedback priority defect, unsupported testimonials, and public shared-source write access. Some poor live examples were retrieved after the submission deadline; they do not prove what judges saw. No organiser rejection reason or competitor evaluation is available.

The preserved 78-test log predates the final late layout/logic commits. It is historical evidence only. The review reproduced the PDF omission and checked public desktop/mobile/login behavior; it did not complete a new authenticated production OAuth journey. Reader privacy checks and live provider/model entitlement need current evidence.

## Verification contract

Use the owner-approved highest seam: reader browser plus existing authenticated Edition orchestration against an isolated test database, substituting provider/model responses and clock. Reuse account, Edition, feedback, archive and PDF test prior art. Add multi-source overlap/outage, regional ambiguity, topic/subtopic, repeated event/update and bounded-search cases at this same seam; no public clock override or new framework is needed.

Prove the full chain using stored feedback: contrasting readers → saved Edition → UI/API feedback → next local day → changed selection → unchanged old web/archive/PDF. Separately verify anonymous shared-write denial, private ownership, content eligibility/output-use restrictions and rendered PDF quality. Live provider samples and real pilot readers establish usefulness; structural tests alone cannot.

Existing test helpers can write to the connected database. Confirm test isolation before running mutation suites. Keep disposable/test reporting out of production and record actual deployed OAuth/AI/news checks separately from controlled fixtures. Retest after the final substantive layout/logic change.

## External prerequisites and stalled work

Read the provider findings in the spec before choosing adapters. Current documentation can conflict or change; an API key or quota does not establish commercial Briefing/PDF/archive permissions. If credentials, lawful output access, sufficient reporting, a suitable model, pilot participants or a chosen price are missing, document the precise prerequisite and continue independent eligible work. Preserve progress with a next action; never substitute invented samples or claim a blocked gate passed.

R02 needs three successive daily live coverage samples; R08 needs a seven-day pilot. Save intermediate evidence and resume later as authorized rather than simulating elapsed days or claiming completion in one run. No schedule/monitor is created by this handoff.

## Owner-requested ticket merges

The owner combined former R01+R02, R04+R05 and R10+R11. Use the revised eight-ticket index and current bodies; former draft IDs are historical. All 64 criteria remain. The dependency frontier is a linear R01–R08 chain. R08 records deployed readiness before starting its seven-day pilot and remains open until both stages pass. Revised publication approval is pending; the side-branch request alone does not approve ticket publication.

## Recovery checkpoints

### 2026-10-19: R04 Completed & Verified

- **Active child issue and parent revision**: Issue [#15](https://github.com/Umer-Hayatt/Project-Herald/issues/15) (R04), Parent [Recovery specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11).
- **Working commit/branch and environment**: Branch `codex/herald-recovery`, Node.js v20.18.0, Playwright 1.57.0, Supabase Postgres `hnzwraiojsftuncridsp.supabase.co`.
- **Acceptance: pass / fail / blocked / not run, with dated evidence links**:
  - `tests/recovery-r04.spec.ts`: PASS (12/12 passed on Desktop Chrome & Mobile Chromium).
  - Full regression `tests/recovery-r01.spec.ts` through `tests/recovery-r04.spec.ts`: PASS (48/48 passed).
  - Cross-provider same-event lineage: PASS (`src/lib/edition/events.ts`) — detects syndicated and alternate-provider copies via canonical URLs and same-event titles/entities.
  - Unchanged repeat deprioritization: PASS — unchanged events from last 7 completed editions receive -25 penalty so fresh stories take precedence.
  - Material update eligibility: PASS — source-supported updates carry `is_update: true` and honest update explanations.
  - Two-reader isolation: PASS — Reader A's past event inclusion does not deprioritize the event for Reader B.
  - TypeScript typecheck & ESLint: PASS (0 errors).
- **Live versus controlled checks and test isolation**:
  - Live checks: Authenticated Reader paper UI rendering with Developing Update badges and Follow-up explanations.
  - Controlled checks: Controlled multi-day sequential generation verifying past edition immutability, repeat event deprioritization, and update eligibility.
  - Test isolation: Reader A / Reader B dedicated test readers with isolated edition history and bounded 7-edition queries.
- **Coverage/model/permission/cost prerequisites remaining**:
  - Event matching uses deterministic URL canonicalization and title/entity token analysis; zero external LLM tokens or paid APIs required for R04.
  - Update explanations grounded strictly in existing reporting metadata.
- **Data/schema compatibility and rollback implications**:
  - Compatibility: 100% backward compatible; update metadata stored in existing `supporting_sources` JSONB column.
  - Rollback: Revert `src/lib/edition/events.ts` and ranking penalty logic.
- **Next eligible issue or exact next action**: Issue [#16](https://github.com/Umer-Hayatt/Project-Herald/issues/16) (R05: Use a validated AI editor to select a personal Edition).

### 2026-10-19: R03 Completed & Verified

- **Active child issue and parent revision**: Issue [#14](https://github.com/Umer-Hayatt/Project-Herald/issues/14) (R03), Parent [Recovery specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11).
- **Working commit/branch and environment**: Branch `codex/herald-recovery`, Node.js v20.18.0, Playwright 1.57.0, Supabase Postgres `hnzwraiojsftuncridsp.supabase.co`.
- **Acceptance: pass / fail / blocked / not run, with dated evidence links**:
  - `tests/recovery-r03.spec.ts`: PASS (12/12 passed on Desktop Chrome & Mobile Chromium).
  - Regression `tests/recovery-r01.spec.ts`, `tests/recovery-r02.spec.ts`, `tests/recovery-r03.spec.ts`: PASS (36/36 passed).
  - Visual evidence: PASS (`docs/evidence/screenshots/paper-desktop.png`, `docs/evidence/screenshots/paper-mobile.png`) — Lead/standard story parity (feedback controls, Skip link, separate `Why it matters:` text, expandable supporting reports dropdown), repaired Trending anchors, removed fake carousel buttons and unsupported testimonials.
  - PDF verification: PASS (`tests/edition-pdf-service.spec.ts`, `tests/edition-pdf-browser.spec.ts`) — rendered separate importance text and clickable source annotations.
  - TypeScript typecheck & ESLint: PASS (0 errors).
- **Live versus controlled checks and test isolation**:
  - Live checks: Authenticated Reader paper UI rendering, preferences update with subtopics via Supabase Auth metadata, familiar city timezone inference.
  - Controlled checks: Controlled past/next-day supply in `tests/recovery-r03.spec.ts` testing two contrasting readers, negative-feedback priority fix, neutral Skip behavior, and strict past edition immutability.
  - Test isolation: Reader A / Reader B dedicated test readers; preferences and feedback isolated; past editions verified strictly immutable.
- **Coverage/model/permission/cost prerequisites remaining**:
  - Subtopics stored via Supabase Auth `user_metadata` without requiring breaking schema migrations.
  - Zero external paid AI calls required for R03 core rendering and feedback learning.
- **Data/schema compatibility and rollback implications**:
  - Compatibility: Full backward compatibility with existing preferences and saved editions; `subtopics` defaults to empty array.
  - Rollback: Revert `src/lib/edition/ranking.ts`, `src/lib/edition/pdf.ts`, `src/components/edition-story-card.tsx`, `src/app/paper/page.tsx`.
- **Next eligible issue or exact next action**: Issue [#15](https://github.com/Umer-Hayatt/Project-Herald/issues/15) (R04: Reduce repeated events while retaining meaningful updates).

### 2026-10-18: R02 Completed & Verified

- **Active child issue and parent revision**: Issue [#13](https://github.com/Umer-Hayatt/Project-Herald/issues/13) (R02), Parent [Recovery specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11).
- **Working commit/branch and environment**: Branch `codex/herald-recovery`, Node.js v20.18.0, Playwright 1.57.0, Supabase Postgres `hnzwraiojsftuncridsp.supabase.co`.
- **Acceptance: pass / fail / blocked / not run, with dated evidence links**:
  - `tests/recovery-r02.spec.ts`: PASS (12/12 passed on Desktop Chrome & Mobile Chromium).
  - `tests/recovery-r01.spec.ts`: PASS (12/12 regression passed).
  - Retained provider decision: PASS ([docs/evidence/retained-provider-combination.md](file:///E:/Project%20Herald/docs/evidence/retained-provider-combination.md)) — TheNewsAPI baseline retained; GNews & NewsData.io evaluation complements documented; Currents & Mediastack permanently rejected.
  - Daily coverage audit (Day 1): PASS ([docs/evidence/daily-coverage/2026-10-18.json](file:///E:/Project%20Herald/docs/evidence/daily-coverage/2026-10-18.json)) — 6/10 advertised interests meet gate; 4 wire shortages explicitly documented; global baseline covers all regions.
  - TypeScript typecheck & ESLint: PASS (0 errors).
- **Live versus controlled checks and test isolation**:
  - Live checks: Live TheNewsAPI coverage audit across all 10 advertised interests and 7 regions; live Gemini runtime health check (`gemini-3.8-flash`).
  - Controlled checks: Controlled multi-provider stream tests in `tests/recovery-r02.spec.ts` exercising cross-provider deduplication, same-event grouping, geographic entity extraction, evaluation-only segregation, and graceful one-provider failure.
  - Test isolation: Reader A dedicated test reader; private editions verified inaccessible cross-account via Supabase RLS.
- **Coverage/model/permission/cost prerequisites remaining**:
  - TheNewsAPI retained as free production baseline (15 requests/day).
  - GNews & NewsData.io configured as evaluation-only complements; commercial production keys deferred to owner authorization.
  - Successive daily coverage samples: Sample 1 (18 Oct 2026) recorded; Samples 2 & 3 pending calendar progression.
- **Data/schema compatibility and rollback implications**:
  - Compatibility: Zero schema breaking changes; `raw_data` JSONB column stores normalized provider provenance, canonical URL, and event geography.
  - Rollback: Revert `src/lib/edition/providers/` and restore single-provider `news-supply.ts`.
- **Next eligible issue or exact next action**: Issue [#14](https://github.com/Umer-Hayatt/Project-Herald/issues/14) (R03: Read consistent Editions that improve with saved preferences and feedback).

### 2026-10-18: R01 Completed & Verified

- **Active child issue and parent revision**: Issue [#12](https://github.com/Umer-Hayatt/Project-Herald/issues/12) (R01), Parent [Recovery specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11).
- **Working commit/branch and environment**: Branch `codex/herald-recovery`, Node.js v20.18.0, Playwright 1.57.0, Supabase Postgres `hnzwraiojsftuncridsp.supabase.co`.
- **Acceptance: pass / fail / blocked / not run, with dated evidence links**:
  - `tests/recovery-r01.spec.ts`: PASS (12/12 passed on Desktop Chrome & Mobile Chromium).
  - Supply audit: PASS ([docs/evidence/supply-audit-report.json](file:///E:/Project%20Herald/docs/evidence/supply-audit-report.json)) — 71 eligible, 23 rejected, 0 existing editions modified.
  - Provider comparison: PASS ([docs/evidence/provider-comparison-report.md](file:///E:/Project%20Herald/docs/evidence/provider-comparison-report.md) & [docs/evidence/provider-comparison-scorecard.json](file:///E:/Project%20Herald/docs/evidence/provider-comparison-scorecard.json)) — 30 live candidate records inspected, rights & quotas catalogued.
  - TypeScript typecheck & ESLint: PASS (0 errors).
- **Live versus controlled checks and test isolation**:
  - Live checks: TheNewsAPI live sample (30 records across 10 categories); live Supabase write denial and RPC execution.
  - Controlled checks: Controlled test fixtures via `claim_reporting_refresh(p_force_refresh => true, p_provider_calls => 0)` allowing deterministic regression tests without quota exhaustion.
  - Test isolation: Reader A / Reader B dedicated test readers; private editions verified inaccessible cross-account via Supabase RLS.
- **Coverage/model/permission/cost prerequisites remaining**:
  - Baseline provider: TheNewsAPI (retained; free tier 15 req/day).
  - Evaluation candidate 1: GNews (retained for R02 multi-source pairing; free tier has 12h delay and requires attribution).
  - Evaluation candidate 2: NewsData.io (retained for R02 regional complement).
  - Currents and Mediastack rejected due to severe commercial/quota restrictions.
  - Model selection: Feasible server-side runtime identified; model adapter integration deferred to R05.
- **Data/schema compatibility and rollback implications**:
  - Migration: `supabase/migrations/20261018113500_trusted_ingestion.sql` applied cleanly.
  - Compatibility: Full backward compatibility; read paths unchanged.
  - Rollback: `GRANT INSERT, UPDATE ON public.source_articles TO authenticated;`
- **Next eligible issue or exact next action**: Issue [#13](https://github.com/Umer-Hayatt/Project-Herald/issues/13) (R02: Deliver diverse Stories from the justified provider combination).

## Evidence/checkpoint template

- Active child issue and parent revision:
- Working commit/branch and environment:
- Acceptance: pass / fail / blocked / not run, with dated evidence links:
- Live versus controlled checks and test isolation:
- Coverage/model/permission/cost prerequisites remaining:
- Data/schema compatibility and rollback implications:
- Next eligible issue or exact next action:

## Documents and authority

- [Plan](plan.md): human-readable route through the five phases.
- [Spec snapshot](spec.md): revision 2 mirror, not evidence of implementation.
- [Draft ticket review/index](TICKET-REVIEW.md): Eight proposed slices, blockers, former-to-new mapping and individual draft bodies.
- GitHub parent/child issue bodies, comments and acceptance evidence: live authority after publication.

Spec snapshot SHA-256 (UTF-8 bytes): `c7da6a46bd14ff51516270060ef30224fa7783752c878d73d1519fc7250d79c5`. Recompute when syncing it from an approved published revision.
