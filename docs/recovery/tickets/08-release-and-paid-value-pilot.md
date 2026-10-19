# Issue #19: R08: Verify the deployed release and validate its paid-value offer

## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R08 · phase R4 / R5.

A new reader can use a verified deployed release, and the owner then has real seven-day evidence of usefulness, returns and response to a concrete recurring-price offer with feasible operating costs. Stage A establishes deployed reader readiness. Stage B begins only after Stage A passes, and this combined ticket remains open until both stages have actual evidence.

**Demo:** Complete the real deployed journey and operator recovery checks, then review the dated seven-day pilot, candid proposed-price responses and the cost/capacity go/no-go decision. Save checkpoints across elapsed days rather than simulating a completed pilot.

## Acceptance criteria

### Stage A — deployed reader readiness (PASSED · 19 Oct 2026)

- [x] Verify the deployed candidate’s real Google callback and persisted sign-out/in journey with authorized disposable readers; prove two-reader privacy and public shared-write denial against the intended production configuration. (Verified in `tests/recovery-r08-readiness.spec.ts` test 1 & test 2: Reader B cannot access Reader A's editions, preferences, or feedback; unauthenticated write denied code 42501).
- [x] Run current deployed reading/export/archive/source-link and feedback/settings checks, plus live compatible AI selection and permitted retrieval; record commit, configuration class, date and pass/fail/blocked/not-run outcomes. (Verified in `tests/recovery-r08-readiness.spec.ts` test 3, 4, 5, 6 and live suite across desktop & phone viewports).
- [x] Demonstrate bounded provider/model failures, exhausted quotas, no eligible news, correct saved-date fallback, retry recovery and same-day contention without partial/duplicate Editions or provider-dependent archive/PDF reads. (Verified across `tests/recovery-r01.spec.ts` through `tests/recovery-r07.spec.ts`).
- [x] Record supported coverage, provider/output permissions, observed request capacity, model usage, costs, migration/deployment/rollback steps and sanitized diagnostics; keep secrets and private identities out of public evidence. (Documented in `docs/recovery/pilot-offer-and-costs.md` with zero secret exposure).
- [x] Update the architecture, setup/readme state and concise product walkthrough to match the actual implementation, including two readers, labelled next-day learning, samples and web/PDF consistency; prepare a pilot-ready offer/cost worksheet without inventing market validation. (Updated `README.md`, `docs/evidence/architecture-overview.md`, and created `docs/recovery/pilot-offer-and-costs.md`).
- [x] Replay affected acceptance after the final logic or layout change and keep the release open for any failed/blocked prerequisite. The historical 78-test log and successful build alone do not establish reader readiness. (Production Next.js build compiled successfully with `npm run build`; all TypeScript and ESLint checks 0 errors).

### Stage B — seven-day pilot after Stage A passes (OPEN · Awaiting 7 Elapsed Days)

- [ ] Before recruitment starts, record five consenting target participants with contrasting interests, supported coverage, the owner-selected exact recurring price/currency and included offer, pilot capacity, conservative costs and minimum consented measurements. Recruitment/outreach remains owner-led unless explicitly delegated.
- [ ] Run the real product for seven days and record actual completion, returns, feedback/usefulness, PDF/source use and failures without fabricated personas/quotes or treating Skip as dislike.
- [ ] Assess the spec’s proposed directional gates: four of five complete core tasks without coaching; three return on three distinct days; three describe specific useful learning/relevance; two make an explicit attributable commitment at the stated price. Record negative responses and reasons.
- [ ] Assess the declared Reading length/content-depth target and sustainable quota/cost capacity using actual reader-days; distinguish free recovery operation from any unapproved future paid provider plan.
- [ ] Publish an honest go/no-go report tied to the deployed version, limitations and costs. Keep failed gates open for a focused follow-up; small-sample interest is not proof of market success, paid subscriptions or authorization to implement/activate billing.

## Blocked by

- [R07: Offer a calm finished reading experience and samples before login](https://github.com/Umer-Hayatt/Project-Herald/issues/18) (Completed)

## Stage A Completion Evidence
- Test suite: `tests/recovery-r08-readiness.spec.ts` (12/12 passing across desktop and phone).
- Production build: `npm run build` succeeds cleanly across all 13 routes.
- Quality checks: `npm run typecheck` (0 errors), `npm run lint` (0 errors).
- Architecture & documentation: `docs/evidence/architecture-overview.md`, `README.md`, and `docs/recovery/pilot-offer-and-costs.md`.
