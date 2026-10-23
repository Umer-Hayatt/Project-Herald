# Remaining readiness — 24 October 2026, Asia/Karachi

Continued from recovery evidence commit `26fdef6`; clean checkout, same branch.
Main production app remains `6f59a8f`. This continuation changes operational
coverage tooling and evidence only, not the deployed application or database.
The owner's backup waiver remains in force; no backup question was repeated.

## Automatic reporting refresh: one owner-held credential

The existing server-only reporting client already accepts a Supabase modern secret
key. The production environment lacks `SUPABASE_REPORTING_SERVICE_KEY`; the runtime
therefore stays cache-only. Connected Supabase tools expose publishable keys, not
secret-key creation/retrieval. No root signing key was extracted and no isolated
credential was reused.

Supabase's [API-key guide](https://supabase.com/docs/guides/getting-started/api-keys)
documents creating a secret in Settings > API Keys. The [Management API operation](https://supabase.com/docs/reference/api/v1-create-project-api-key)
exists, but the connected toolset does not expose it and no authorized local
Management API credential is configured. Do not print keys or ask for them in chat.

A private one-run PowerShell helper and double-click launcher are in this chat's
`outputs/` folder. It opens the pinned production API-key page, prompts for a new
modern secret with hidden input, checks only a zero-row read against the fixed
production origin with redirects disabled, and streams it into the authenticated
Vercel CLI as a production Secret through stdin. It writes no local secret file,
does not overwrite an existing entry, rotate keys, call mutation RPCs or deploy.
The key is named `herald-reporting` in Supabase, and stored under the existing
environment variable above in Vercel. The helper uses the prepared private client.

PowerShell parse and CheckOnly passed. Independent Standards and Spec review found
no actionable findings. Interactive key validation/storage has **not run**. After
the owner completes it, inspect environment metadata, redeploy the verified app
with current production settings, and verify actual trusted refresh from normal
reader use. A stored credential alone is not proof of a successful refresh.

## Daily supplementary coverage

Added `scripts/record-globalvoices-coverage.mjs`, Node 24, using the existing
normalization, eligibility and grouping code. It makes exactly one explicitly
enabled Global Voices request; an explicit adapter list excludes other inherited
provider keys. It records metadata only: actual timestamp, Karachi date, topic
counts, public eligibility, unique Stories, source URLs, licence/creator credits
and bounded word counts. It copies no article titles or body text into evidence,
writes no database rows, invokes no model, and never claims three-day acceptance.
Valid empty supply and provider outage are distinct results.

Run from a private working directory with `GLOBALVOICES_ENABLED=true` and
`GLOBALVOICES_PUBLIC_REPORTING_ENABLED=true` only while the existing approval
remains valid. The output lands in `tmp/daily-coverage/` under a unique filename.
No schedule or monitor was created; the owner requested continuing work, not a
recurring automation.

The first command regression failed because the new command was absent. Native
strip-only loading then rejected an existing TypeScript parameter property; the
command-local import loader now uses Node's transform mode and deregisters its
hooks after imports. Node marks that API experimental; this command was verified
on bundled Node 24.22.1. The empty-feed regression first failed with exit 1 instead
of 0, then passed after distinguishing provider errors from no eligible supply.
Final focused verification: six desktop/phone command checks passed, zero failed
or skipped, eight seconds, exit 0; both old and new coverage commands. Intercepted
feeds only. Targeted lint and TypeScript passed. No application source changed,
so no new full-suite/build/deployment claim is made; the deployed app's prior
280/280 isolated and 30 read-only live checks remain the previous checkpoint.

The [24 October observation](../evidence/daily-coverage/2026-10-24-globalvoices.json)
at `2026-10-23T19:28:19.522Z` found three eligible candidates/three unique Stories,
two general and one technology, no feed failure. These are the **same three**
articles previously observed. This crosses local midnight but remains the same
UTC date and a short observation interval; it does not establish a full
successive-day coverage series or representative broad coverage. No ingestion or
production change occurred in this observation.

## Live AI and complementary reporting

Gemini's [current additional terms](https://ai.google.dev/gemini-api/terms), effective
23 March 2026, exclude API clients directed toward or likely accessed by under-18s.
`PRODUCT.md` explicitly includes younger readers. This is an identified audience
conflict, not simply a missing model key. Preserve the broad-audience decision and
keep both Gemini flags false. No model request was sent, provider switched,
audience restricted, billing enabled or paid service activated. A compatible model
and usable free runtime remain prerequisites; structural AI tests do not prove
live suitability.

Wikinews is unsuitable for new current supply: the [Wikimedia closure notice](https://en.wikinews.org/wiki/MediaWiki:Sitenotice)
confirms read-only status since 4 May 2026. NASA remains a possible science/space
supplement: its [reuse guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)
permit qualifying reuse but distinguish third-party rights and endorsement/logo
restrictions. No NASA adapter, item-level rights check or coverage acceptance is
claimed. Neither option establishes broad international/topic coverage.

Actual Google OAuth and authenticated production reader acceptance, canonical
CLI migration-baseline reconciliation, representative coverage, compatible live
AI and the seven-day pilot remain open. Both stashes, original checkout and shared
dependencies remain untouched. No production mutation tests or provider contacts.
