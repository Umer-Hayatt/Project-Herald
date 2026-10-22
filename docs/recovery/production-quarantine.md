# Exact production reporting quarantine preparation

Prepared 23 October 2026, Asia/Karachi. **No quarantine, deletion, migration or
deployment has been executed.** This is a reviewed candidate list and a
read-only verification query, not execution approval.

## Observed evidence

The production project is `hnzwraiojsftuncridsp`. The snapshot at
`2026-10-22 19:23:10.785765+00` contains 58 reserved-domain candidates among 144
shared source rows. The [exact manifest](production-quarantine-candidates-2026-10-23.json)
contains UUIDs, external IDs, source URLs, source metadata fingerprints and
reference counts. It exports no reader IDs or saved Edition text.

- 41 have exact fixture definitions in commit `36ca723`: 32 trusted-ingestion
  probes, three R01 supply records, two R02 provider records and four service/PDF
  supply records. Each manifest entry records its source evidence.
- 17 have unconfirmed origins: three browser-prefixed records, 12
  `herald-feat-*` placeholders and two fake/probe records. Their reserved source
  URLs establish that they are unusable attributed reporting; their names alone
  do not establish how they were created.
- There are 50 direct saved-Story foreign-key references to these rows.
  Supporting-source reference counts overlap where several source rows share a
  URL and must not be summed as unique Stories.
- The source foreign key has no delete cascade. Neither `source_articles` nor
  `edition_stories` has a user trigger in the observed catalogue. Preserve every
  source UUID, direct foreign key and supporting-source snapshot.

Fixture matches establish the code/data match, not an execution audit tying each
row to a particular test invocation. Quarantine here means exclusion from new
Herald reporting and public pages; source rows remain in the raw table and may
remain readable through its existing SELECT policy. This is not data erasure.

The [SELECT-only verifier](../../scripts/verify-quarantine-candidates.sql)
checks each exact UUID, external ID, URL and fingerprint in UTC. It returned
**58 unchanged candidates, no missing or changed rows**, with 50 direct saved
references. A later mismatch requires fresh review; do not expand the predicate
to a title, publisher or ID-prefix search.

## Quarantine behavior to prepare

The corrected app already rejects reserved example domains for new reporting.
A later durable quarantine should preserve the source row and merge into its
existing `raw_data` an explicit `output_use: "internal_testing"` exclusion plus
a recovery reason and manifest identifier. A marker alone is insufficient:
the existing quality policy rejects `internal_testing` on all new public
reporting paths. Never rewrite saved Edition content or supporting-source JSON.

Home and Trending currently limit database rows before quality filtering.
Excluded rows can occupy those result slots and hide eligible reporting. Repair
that retrieval behavior before release; a metadata quarantine alone does not
solve the ordering problem.

There is deliberately no executable UPDATE in this checkpoint. Before a real
cleanup transaction, export the exact original rows and `raw_data` privately,
record the backup checksum, rerun the exact fingerprint verifier and compare
saved Edition checksums. Keep the backup outside Git. The transaction must
refuse a changed/missing row and update only reviewed exact IDs with matching
external IDs, URLs and fingerprints. Preserve all unrelated metadata.

## Release dependencies and verification

1. Reconcile the actual production schema before choosing migrations. Its
   ledger records only the first four migrations, although later reporting
   functions exist. Do not infer the schema from the test project's combined
   migration or blindly replay every missing ledger entry.
2. Prepare the compatible app and server-only writer configuration. Apply the
   reviewed reporting-helper revokes before a trusted cleanup operation.
   Current catalogue observations still grant readers EXECUTE on reporting
   helpers; the two-argument claim also grants anonymous EXECUTE. These are
   privilege observations, not successful exploit tests.
3. Publish only after the remaining source/model rights and product release
   gates pass. The owner has no confirmed public reporting permission yet.
4. Back up and verify the manifest immediately before any accepted quarantine.
   Afterward, inspect source eligibility and saved-snapshot checksums using
   read-only queries. No production INSERT/UPDATE/DELETE probes or mutation
   tests are authorized; denial regressions remain on the isolated project.

Rollback must preserve reader write revocations and legacy-cache distrust.
Original metadata is retained for recovery, but never automatically restore
public eligibility to an unverified source. Undoing an exclusion requires a new
source/permission review. Restoring an old app must not regrant shared writes.
