# Recovery ticket breakdown — published and authorized

Parent: [specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11). The eight revised tickets were approved and published under specification #11 in dependency order with `ready-for-agent` labels. Native GitHub parent/sub-issue relationships and native `blockedBy` edges were successfully established via the GitHub GraphQL API. The approved testing seam and all 64 acceptance criteria are preserved.

| Slice | Issue | Title | Blocked by | Phase | Status |
|---|---|---|---|---|---|
| R01 | [#12](https://github.com/Umer-Hayatt/Project-Herald/issues/12) | [Create protected useful reporting and choose complementary providers](tickets/01-safe-reporting-and-provider-comparison.md) | None | R1 | Completed (18 Oct 2026) |
| R02 | [#13](https://github.com/Umer-Hayatt/Project-Herald/issues/13) | [Deliver diverse Stories from the justified provider combination](tickets/02-complementary-shared-pool.md) | [#12](https://github.com/Umer-Hayatt/Project-Herald/issues/12) | R1 | Completed (18 Oct 2026) |
| R03 | [#14](https://github.com/Umer-Hayatt/Project-Herald/issues/14) | [Read consistent Editions that improve with saved preferences and feedback](tickets/03-complete-edition-and-learning.md) | [#13](https://github.com/Umer-Hayatt/Project-Herald/issues/13) | R2 / R3 | Completed (19 Oct 2026) |
| R04 | [#15](https://github.com/Umer-Hayatt/Project-Herald/issues/15) | [Reduce repeated events while retaining meaningful updates](tickets/04-fresh-events-and-updates.md) | [#14](https://github.com/Umer-Hayatt/Project-Herald/issues/14) | R3 | Completed (19 Oct 2026) |
| R05 | [#16](https://github.com/Umer-Hayatt/Project-Herald/issues/16) | [Use a validated AI editor to select a personal Edition](tickets/05-bounded-ai-editor.md) | [#15](https://github.com/Umer-Hayatt/Project-Herald/issues/15) | R3 | Ready (Active Frontier) |
| R06 | [#17](https://github.com/Umer-Hayatt/Project-Herald/issues/17) | [Fill an undercovered interest with bounded AI-requested searches](tickets/06-bounded-targeted-search.md) | [#16](https://github.com/Umer-Hayatt/Project-Herald/issues/16) | R3 | Blocked by #16 |
| R07 | [#18](https://github.com/Umer-Hayatt/Project-Herald/issues/18) | [Offer a calm finished reading experience and samples before login](tickets/07-finished-reading-and-samples.md) | [#17](https://github.com/Umer-Hayatt/Project-Herald/issues/17) | R4 | Blocked by #17 |
| R08 | [#19](https://github.com/Umer-Hayatt/Project-Herald/issues/19) | [Verify the deployed release and validate its paid-value offer](tickets/08-release-and-paid-value-pilot.md) | [#18](https://github.com/Umer-Herald/Project-Herald/issues/18) | R4 / R5 | Blocked by #18 |

The linear dependency chain is #12 (R01) → #13 (R02) → #14 (R03) → #15 (R04) → #16 (R05) → #17 (R06) → #18 (R07) → #19 (R08). R01 (#12), R02 (#13), R03 (#14), and R04 (#15) are complete. R05 (#16) is the unblocked active frontier.

R03 establishes the complete Story/web/PDF contract before its preference/learning checks. R08 has an internal deployed reader-ready gate followed by the seven-day pilot and stays open until both stages have evidence. Record Stage A readiness without claiming Stage B or the whole ticket complete. R02 still needs the spec’s three successive daily live coverage samples. Save checkpoints across actual elapsed days.

All original acceptance coverage remains. Parent #11 remains open as the governing specification. Historical issues #1–#10 remain open as historical record.
