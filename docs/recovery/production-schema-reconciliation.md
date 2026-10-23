# Production schema reconciliation preparation

**Later execution:** The guarded correction is now applied as migration
`20261023183959`, preserving all four historical entries. The owner waived backup.
Canonical CLI baseline reconciliation remains open. See [actual execution](production-execution-2026-10-23.md);
the preparation-only statements below describe the earlier checkpoint.

23 October follow-through: the [guarded correction candidate](reporting-rollout-candidate.md)
now provides a pinned SQL generator, catalog/history drift guards, a four-row
ledger-preservation/rollback rehearsal and an isolated hosted rollback probe.
The owner confirmed no verified production backup yet. No production migration
or complete CLI baseline reconciliation has been performed.

Prepared 23 October 2026 (Asia/Karachi), from recovery commit `143f870`.
This records read-only observations and a local rehearsal. No production
migration, ledger repair, quarantine, deployment or write probe was performed.

## Observed ledger and schema

Project: `hnzwraiojsftuncridsp`. Catalog snapshot:
`2026-10-22 20:18:06.256601+00`; ledger/effective-privilege follow-up:
`2026-10-22 20:21:48.565592+00` (both 23 October locally).

The ledger contains exactly these four entries. Its stored SQL was retrieved
read-only and compared with the corresponding local files:

| Recorded version/name | Corresponding local filename |
| --- | --- |
| `20261017081231 reader_preferences` | `20261017081109_reader_preferences.sql` |
| `20261017092259 editions_and_stories` | `20261017142000_editions_and_stories.sql` |
| `20261017134113 story_feedback` | `20261017200000_story_feedback.sql` |
| `20261017134158 resilient_provider_limits` | `20261017180000_resilient_provider_limits.sql` |

`reader_preferences` matches; `story_feedback` and `resilient_provider_limits`
match apart from trailing blank lines. `editions_and_stories` differs
substantively: its recorded SQL granted shared source/cache-meta writes only
to authenticated readers and used "Authenticated readers" policy names; it
omitted Edition/Story DELETE grants and policies. The current catalog contains
later anonymous policies and Edition/Story DELETE grants/policies not captured
by those four recorded entries. Thus timestamp renaming alone cannot reconcile
the history, even though current table structures match the later local files.
The retrieved ledger SQL is retained privately in
`work/production-ledger-2026-10-23.json` under the chat workspace.

All seven public tables, their column types/defaults/nullability, check/unique/
foreign-key constraints, indexes and table RLS flags match a local replay of
the seven historical files through `20261018113500_trusted_ingestion.sql`.
Both catalogs contain no public user triggers. The five public function
definitions also match after ignoring whitespace and line comments. Embedded
PostgreSQL catalogs NOT NULL constraints separately; those entries were
excluded from the constraint comparison because nullability was already checked
column by column. This is structural equivalence, not proof of execution history.

The live schema therefore already has the Briefing/source-snapshot fields,
`discovery_note`, saved Story `image_url`, processing cache, refresh lock token,
both claim overloads and old ingestion/finish functions. It does **not** have
`reporting_search_cache`, `story_processing_cache.trusted_server` or the three
new server-only cache RPCs. The corrective migration remains unapplied.

## Privilege and policy differences

Production has 29 policies versus 18 in the historical replay. The production
source/cache-meta policies use separate Anon/Authenticated names, while local
historical files use combined "All users" names. Some old permissive write
policies remain present even though table privileges have been revoked.

Read-only effective-privilege checks confirm:

| Role/table | SELECT | INSERT | UPDATE / DELETE / TRUNCATE |
| --- | --- | --- | --- |
| anon, authenticated / source_articles | yes | no | no |
| anon, authenticated / reporting_cache_meta | no | no | no |
| anon / story_processing_cache | no | no | no |
| authenticated / story_processing_cache | yes | yes | no |

Column INSERT/UPDATE privilege checks agree with this table. These are catalog
observations, not attempted writes. A policy alone is insufficient to grant
table access; the processing-cache INSERT grant and its authenticated policy
remain the exception requiring repair.

Both claim overloads, ingestion and finish still have authenticated EXECUTE;
the two-argument claim additionally has anonymous EXECUTE. Invocation behavior
is not established by those grants. The time-zone validation helper is also
publicly executable; it is a read-only validator, outside the reporting-writer
repair. No production RPC was invoked for this inspection.

## Local rehearsal and exact candidate

Candidate: `supabase/migrations/20261019134923_server_only_reporting.sql`.
Git blob: `a91f22c8ace2b1ba4b5094a027f38a10c767abe1`.
Observed file SHA-256:
`2fdf738704d98c661ccd1d521b9981cb4d37785df92242ff218e22398a702537`.
The Git blob is independent of checkout line endings; recheck the actual
deployment bytes and diff before execution.

The embedded PostgreSQL rehearsal replayed the historical files, asserted the
structural comparisons above, then substituted the observed production policy
definitions, table grants and effective function grants. It seeded synthetic
source/Edition/Story rows, including a foreign-key reference and supporting
source JSON, and an untrusted processing-cache entry. Applying **only the
corrective migration** in a transaction passed:

- Anonymous/authenticated calls to all six reporting/cache RPCs and attempted
  source/cache INSERTs were denied.
- The one-argument claim overload was removed; the legacy cache entry stayed
  untrusted and invisible to the authenticated reader.
- The server could reserve, perform an empty ingestion and finish the refresh.
- Synthetic source rows, saved Editions, saved Stories, foreign keys and
  supporting snapshots remained identical before/after the rehearsal.

This does not test a nonempty server ingestion in the rehearsal, managed Auth,
PostgREST, production concurrency, inherited role memberships, default privileges,
production data, ledger repair or deployment. The earlier isolated security and
reader-suite evidence remains separate. No new browser/build pass is claimed.

Local evidence is retained under the chat workspace `work/`:
`production-schema-inventory-2026-10-23.json`,
`rehearse-reporting-rollout.mjs`, and
`reporting-rollout-rehearsal-2026-10-23.json`.
These are local evidence artifacts, not a shipped migration runner. The checked-in
[catalog query](../../scripts/inspect-reporting-schema.sql) regenerates the
schema/privilege observations without reading reader content or calling RPCs.

## Reviewed execution sequence still to prepare

1. Preserve a fresh private schema/ledger export and data backup before any
   accepted change. The four recorded SQL comparisons above are complete;
   repeat on a changed ledger. Preserve the existing remote ledger entries.
2. Choose and review one explicit history reconciliation plan: map verified
   equivalent historical versions, or adopt a reviewed baseline of the actual
   schema. A baseline is the recommended direction because the recorded
   Editions migration is substantively different and later policy/grant
   changes are unrecorded; do not simply mark all seven local versions applied.
   Rehearse that exact ledger/baseline procedure in isolation. No
   `db push`, `migration repair`, reset or blanket replay is ready to run.
3. Immediately before an accepted security rollout, rerun the catalog query.
   Stop on changed structure, grants, policies, pre-existing search cache or
   trust column, or new reporting overloads. This migration is not idempotent;
   do not blindly retry it after uncertain completion. Check transaction and
   ledger state first. Do not replay old grants after the correction.
4. Apply the reviewed corrective migration transaction before the compatible
   app. Preserve direct-write revocations and legacy-cache distrust. Residual
   permissive source/cache-meta policy names are not removed by this migration;
   confirm the effective grants remain denied. Any later policy cleanup is a
   separately reviewed change. Configure the reporting key server-side only;
   missing writer configuration intentionally leaves cache-only behavior.
5. Recheck the exact deployed version, catalog privileges, expected server
   operations and unchanged saved snapshots. All mutation/denial regressions
   stay on the isolated project; production verification remains read-only.
   Follow the [quarantine procedure](production-quarantine.md) only after its
   backup, exact fingerprints, accepted execution and preservation gates pass.

The rehearsal narrows schema uncertainty; it does not close the release gate.
Provider permission remains unconfirmed and public approval must stay disabled.
Useful successive-day coverage, enabled model validation, a representative
sample, deployed OAuth/reader verification and the pilot remain open. Rollback
must never regrant reader reporting writes or trust legacy cache rows.
