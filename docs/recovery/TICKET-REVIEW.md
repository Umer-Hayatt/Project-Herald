# Recovery ticket breakdown — awaiting approval

Parent: [specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11). All 11 bodies are drafted locally; no recovery child issue has been published or claimed. The spec's testing boundary was approved earlier; ticket granularity and dependencies have not yet been approved.

| Draft ID | Ticket | Blocked by | Phase |
|---|---|---|---|
| R01 | [Create a useful Edition through protected reporting ingestion](tickets/01-safe-useful-reporting.md) | None | R1 |
| R02 | [Compare two candidate providers using real reading samples](tickets/02-compare-provider-coverage.md) | None | R1 |
| R03 | [Deliver diverse Stories from the justified provider combination](tickets/03-complementary-shared-pool.md) | R01, R02 | R1 |
| R04 | [Read and download one complete, consistent Edition](tickets/04-complete-edition-and-pdf.md) | R03 | R2 |
| R05 | [Make subject preferences and feedback improve the next Edition](tickets/05-preferences-and-next-day-learning.md) | R04 | R3 |
| R06 | [Reduce repeated events while retaining meaningful updates](tickets/06-fresh-events-and-updates.md) | R04 | R3 |
| R07 | [Use a validated AI editor to select a personal Edition](tickets/07-bounded-ai-editor.md) | R05, R06 | R3 |
| R08 | [Fill an undercovered interest with bounded AI-requested searches](tickets/08-bounded-targeted-search.md) | R07 | R3 |
| R09 | [Offer a calm finished reading experience and samples before login](tickets/09-finished-reading-and-samples.md) | R08 | R4 |
| R10 | [Verify and document the deployed reader-ready release](tickets/10-verify-reader-ready-release.md) | R09 | R4 |
| R11 | [Run the seven-day reader pilot and assess the paid-value offer](tickets/11-measure-paid-value-pilot.md) | R10 | R5 |

R01 and R02 are initially unblocked. R05 and R06 become independently available after R04. Other dependencies follow the recovery phase gates. Draft identifiers are not GitHub issue numbers. Publication will replace them with real issue links, add ready-for-agent, and establish native parent/blocking links where the connection supports them; otherwise explicit body links and the limitation will be recorded.

Each ticket delivers a verifiable complete behavior. R02 is a bounded retrieval-to-readable-sample evaluation; R11 is a real product pilot. Neither is a horizontal implementation-layer ticket. Small prefactoring belongs at the start of R01/R04 where it supports their working paths; no broad mechanical rewrite was found necessary.

## Approval requested

- Is each slice sized appropriately for a fresh agent context?
- Do the blockers represent real prerequisites?
- Should any slices be merged, split or resequenced?

The invoked to-tickets skill says: “Iterate until the user approves the breakdown.” Publication follows that approval. Existing parent #11 and historical issues #1–#10 remain unchanged during ticket publication.
