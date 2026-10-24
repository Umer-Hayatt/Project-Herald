# Public reporting refresh correction — 24 October 2026

The production reporting Secret is configured and deployed, but genuine automatic
refresh has not yet been observed. Tracing that path exposed two defects:

- A configured token selected an unapproved provider for public refresh, even
  though its evaluation-only output was subsequently rejected. TheNewsAPI could
  consume five unnecessary requests alongside the licensed Global Voices feed.
- Each selected adapter reserved five calls. Global Voices performs one feed
  request, so the fixed 15-call daily allowance incorrectly blocked its fourth
  refresh. The allowance and server-only lock/RPC security remain unchanged.

Public refresh now selects only configured providers with current public approval,
uses their default request reservations (Global Voices 1, TheNewsAPI 5, GNews 4,
NewsData 4), and rechecks current approval before ingestion. Custom adapters retain
a conservative five-call fallback. Direct coordinator evaluation remains available
without enabling public publication. Saved Editions are never rewritten.

## Verification

The existing approved reporting-service seam uses real Auth/PostgREST and trusted
refresh RPCs in **Herald Recovery Test**, with controlled external provider feeds.
It restores prior cache metadata, environment flags and removes its Source article.
No production mutation test or real provider request is involved.

1. First regression failed correctly: five unapproved provider calls, expected zero.
   Approval filtering made it pass.
2. Extended regression failed correctly: three feed calls across four forced
   refreshes, expected four. Per-adapter reservation made both desktop and phone
   cases pass (2/2, 17.7 seconds).
3. Two intervening attempts failed before assertions because sandbox networking
   blocked isolated Auth; these are infrastructure failures, not additional red
   behavior evidence. The explicit isolated-network run reproduced the budget bug.
4. Independent Standards and Spec review: no actionable findings on either axis.
   Fresh build/TypeScript and targeted lint passed. Complete suite:290/290 passed,
   zero failures/skips,7.0 minutes. Main `92d7093` is deployed READY;32 read-only
   production desktop/phone checks passed. Exact deployment identity and runtime
   limitations are recorded in the handoff and deployment evidence.

## Remaining acceptance

Observe the next genuine new-Edition request through read-only production refresh
metadata. A completed saved Edition returns its preserved content even on Retry,
so reopening it does not verify refresh. Do not create production fixtures, rewrite
saved content or add a bypass to force the check.

Real Google OAuth, useful permitted live AI/free quota/region suitability,
complementary and successive-day coverage, canonical migration baseline and pilot
acceptance remain open. Gemini and unapproved provider publication stay disabled.
The audience remains 18+ by session self-declaration. The owner's backup waiver
remains in force; original checkout, preserved stashes and shared dependencies
remain untouched.
