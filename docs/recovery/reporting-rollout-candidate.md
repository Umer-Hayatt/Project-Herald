# Guarded reporting correction candidate

Prepared 23 October 2026. **Not executed in production.** The owner confirmed
there is no verified production backup yet. This packet narrows the corrective
rollout; it does not complete canonical CLI baseline/history reconciliation.

## Exact scope

Apply only the reviewed `20261019134923_server_only_reporting.sql` body, Git blob
`a91f22c8ace2b1ba4b5094a027f38a10c767abe1`, through an atomic migration runner.
Keep all four existing production ledger rows, including their stored SQL.
The runner must append exactly one new migration entry in the same transaction.
Do not replay the seven historical checkout files, rename remote history or mark
them all applied. Do not run `db push` from the currently divergent checkout.

The [generator](../../scripts/reporting-rollout.mjs) has no database connection
or execution command. It emits a SQL body that locks the seven public tables and
migration ledger, checks the reviewed catalog/history fingerprints, then applies
the pinned correction. Lock timeout is five seconds; statement timeout is thirty
seconds. Execute the entire body inside one migration transaction, never as
individually committed statements. The caller must independently select the exact
project; the SQL fingerprint is not a database identity or authorization proof.

The public-catalog digest covers the existing inspection fields plus role
memberships/options, reader-role flags, default ACLs, column ACLs and ownership.
The ledger check covers versions, names and stored-SQL digests. These checks
detect changes to those observations, not every managed-platform object or
concurrent administrative operation. Use one reviewed operator window with other
DDL/role changes paused. Existing locks can delay readers briefly; a timeout must
abort, not be retried blindly. MD5 here detects drift; it is not authentication.

## Prepared private packet

The SELECT-only production observation at `2026-10-23 18:16:26.729147+00` found
seven public tables, 29 policies and the same four historical entries.
Catalog digest: `6de0faf078ea6114bc316f40ac4aba98`.

The generated `work/server-only-reporting-guarded.sql` in the 23 October recovery
chat workspace is 16,116 bytes, SHA-256:
`9b06abf03158ac31fad0a0c44b49de4dc583565dec8a81d6a508de4278608c9e`.
It is a private, observation-bound candidate, not a reusable migration runner.
Any later catalog/history change requires another inspection and reviewed packet.

Reproduce generation without database access:

```powershell
node scripts/reporting-rollout.mjs --preflight-sql
# Execute that SELECT only against the explicitly chosen production project.
# Save its single row privately, adding the observed project_ref metadata.
node scripts/reporting-rollout.mjs --prepare <private-preflight.json> <new-private-output.sql>
```

The output must not already exist. `project_ref` in the saved JSON records the
tool target used for the observation; it is not inferred from `current_database()`.

## Verification and remaining gates

The [embedded rehearsal](../../scripts/test-reporting-rollout.mjs) takes private
catalog/ledger inputs through `HERALD_ROLLOUT_INVENTORY` and
`HERALD_ROLLOUT_LEDGER`. It recreates observed policy/table/effective-function
grants, refuses catalog/history drift, rolls back DDL after a simulated ledger
insert failure, preserves all four original ledger rows while adding one local
entry, refuses replay, preserves saved source/Edition/Story snapshots, hides
legacy cache, denies reader writes/RPCs and permits nonempty server ingestion
with creator/licence metadata. This is controlled embedded PostgreSQL, not a
production clone. Production membership/default-ACL/column-ACL/owner variants
are fingerprinted read-only but are not reproduced by this rehearsal.

The actual `apply_migration` transport was also probed **only** on Herald Recovery
Test (`ebvwcsazotyzczrtjfol`): a unique canary table/row followed by a deliberate
exception returned the expected error. Subsequent SELECTs found no canary table
and zero corresponding migration entries. This proves rollback for that hosted
body-error case; a hosted ledger-insert failure and production concurrency were
not tested. The existing embedded reporting-security suite also passed.

Before proposing production execution:

1. Obtain a fresh private restorable backup, checksums and restore evidence.
   Preserve Auth/account relationships, schema, roles and migration history;
   a public-table JSON export alone is insufficient. Follow the official
   [Supabase backup/restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore),
   including separate migration-history preservation and any managed-schema
   customizations. Keep credentials and dumps outside Git. The documented CLI
   workflow needs Docker and owner-held database connection access, which are
   not established here. No password reset, infrastructure installation, new
   project or restore over the existing test database is authorized by this packet.
2. Resolve the canonical schema/history baseline procedure and its restore
   implications. This narrow candidate is not evidence that a complete CLI
   migration chain can recreate production.
3. Review the exact packet, app compatibility, backup/restore evidence and operator
   window. Recheck catalog/ledger immediately before execution; stop on drift.
4. After accepted execution, inspect only: exact new migration entry plus unchanged
   four historical SQL digests, expected catalog/grants, and unchanged private
   saved-snapshot checksums. Keep mutation/denial tests isolated. Do not regrant
   reader reporting writes or trust legacy cache as rollback.
5. Treat the [58-row quarantine](production-quarantine.md), server writer setup,
   source enablement and deployment as subsequent reviewed steps. No quarantine,
   writer configuration, provider/model approval or app deployment is bundled here.
