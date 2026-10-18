# Herald recovery: start here

## Current state

Planning checkpoint: 18 October 2026, Asia/Karachi. Active authority: [recovery specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11). Main baseline: `3e8e437735d3258e5e342c7d1f738a30e8d99f9c`. No recovery implementation or production migration has been performed. The eight [ticket drafts](TICKET-REVIEW.md) await owner approval; they are not published issues and cannot be claimed yet.

This recovery replaces the expired 17 October 21:00 hackathon schedule for new recovery work. The original issues #1–#10 are historical scope/evidence, even though still open; their state does not establish what is implemented. Use current code and dated checks, not old completion claims. Parent #11 stays open and unchanged during ticket publication.

## Resume in order

1. Read this handoff, the [short plan](plan.md), [ticket review/index](TICKET-REVIEW.md), and the authoritative issue plus its comments. The [spec snapshot](spec.md) is a convenience copy; GitHub is authoritative for subsequent changes.
2. Check the working tree and current commit. Preserve existing work. Read the current Product, Glossary, relevant ADRs, and issue-tracker instructions before implementation or status changes.
3. Confirm whether the owner approved the ticket breakdown. While approval is pending, revise drafts or context only; publication and implementation remain pending. After approval, publish one ready-for-agent child per ticket in dependency order, preserve text links, add native relationships when possible, and record the real IDs here and in the index.
4. Work the frontier: claim an open child only when its actual blockers have acceptance evidence and are complete. The initial frontier after revised approval/publication is R01. Check external prerequisites independently; ready-for-agent does not grant credentials, suitable provider terms or a paid budget.
5. Before closing a child, record the exact commit, environment, date, criteria outcomes and remaining limitations. Pass/fail/blocked/not-run are distinct. Update the ticket and this small checkpoint; synchronize the spec snapshot only when its authority changes. Keep this handoff current for the next agent.

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
