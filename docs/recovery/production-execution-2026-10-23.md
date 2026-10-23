# Authorized production follow-through — 23 October 2026

The owner explicitly instructed “then go all in and leave backup”. This supersedes
the backup prerequisite for this execution. No verified export or restore exists;
this is a recorded waiver, not a passed backup gate. Earlier preparation-only
statements remain historical evidence.

## Executed database operations

- Production target: `hnzwraiojsftuncridsp`. Fresh SELECT-only preflight matched
  the reviewed catalog/history before execution. Applied only the pinned guarded
  server-only correction through the atomic hosted migration runner.
- New migration: `20261023183959`, `server_only_reporting_guarded`. Ledger now
  contains five entries. All four existing versions, names and stored SQL hashes
  were preserved. Packet SHA-256:
  `9b06abf03158ac31fad0a0c44b49de4dc583565dec8a81d6a508de4278608c9e`.
- Read-only checks confirmed all six reporting/cache helpers permit service-role
  execution and deny anonymous/authenticated execution. Legacy cache entries are
  hidden by the trusted-server boundary. No production denial/mutation test ran.
- Rechecked the exact 58-row quarantine manifest: every original fingerprint
  matched. Executed metadata-only quarantine in one guarded transaction under
  locks. Set `output_use=internal_testing` plus the dated recovery marker. No
  source was deleted, no saved reference changed. Manifest preserves original
  fingerprints; its preparation status describes the original observation.
- `scripts/quarantine-reporting.mjs` generates SQL but never connects or executes.
  Its embedded PGlite rehearsal proves mismatch rollback, exact 58-row update,
  preservation of metadata and saved references, non-target preservation and
  replay refusal. This helper and rehearsal were authored together; no red-first
  claim is made. Independent Standards and Spec reviews found no findings.
- One actual Global Voices feed request accepted three current eligible text
  articles at `2026-10-23T18:47:10.505Z`. Ingested through the reviewed
  service-role claim/ingest/finish procedures with a one-call reservation in one
  transaction. This was genuine reporting ingestion, not a production test.
  Explicit creator, original URL and CC BY 3.0 credits remain in source metadata.
- Final read-only totals: 147 sources, including 58 quarantined and three Global
  Voices rows. All 23 Editions, 129 Stories, preferences and feedback have exactly
  the same aggregate row hashes as before the correction and quarantine.

## Runtime configuration and verification

Production Global Voices fetch/public-approval flags are true. Unconfirmed
TheNewsAPI/GNews/NewsData public approvals and both Gemini flags remain false.
The production reporting service credential is absent. The application therefore
uses its safe cache-only path; this one-time ingestion does not establish
unattended refresh. Never substitute the isolated project's writer credential.

The first full isolated desktop/phone run passed 278/280. Both failures reproduced
the daily-coverage command's native Node TypeScript transitive-import resolution
error after adding source attribution. A command-local resolution hook supplies
the missing `.ts` extension without changing application imports or dependencies.
The existing failing command-level regression is the red signal. Final rerun and
deployment evidence will be appended to the handoff after completion.

## Remaining requirements

Canonical CLI migration baseline reconciliation is still incomplete: do not run
`db push` from the divergent historical checkout or mark all files applied.
Automatic trusted reporting refresh, broader complementary permitted coverage,
three successive daily observations, a useful enabled/validated AI model, a real
Google reader journey, final deployed reader acceptance and the seven-day pilot
remain open. The owner waived backup for this rollout; backup/restore readiness
is still unverified. No paid service, vendor contact, shared dependency change,
stash deletion or original-checkout modification occurred.

Final full verification: 280/280 controlled checks passed on desktop and phone in
5.0 minutes, exit 0; zero failures/skips. Embedded quarantine rehearsal and
 targeted lint passed. Independent Standards/Spec reviews: no actionable findings.

## Final publication

Main app commit `6f59a8ff3171d7855d6615bf8e821ec4e4462c2d` is deployed READY as
`dpl_7cqB8VSVbZaPYMfupr6vkWtgYFeV` at https://project-herald-pink.vercel.app.
After the final display fix, the fresh controlled suite passed 280/280 and thirty
read-only production desktop/phone checks passed. Live phone and desktop captures
were inspected. Google OAuth/authenticated production reading remains unverified.
See the latest handoff for failed/stopped attempts and exact limitations. No
production mutation tests ran. Final deployment evidence is committed separately
on the existing recovery branch; production main remains this verified app SHA.
