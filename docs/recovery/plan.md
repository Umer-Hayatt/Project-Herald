# Herald recovery plan — revision 2

Updated 18 October 2026 with the agreed multi-source reporting and AI-editor approach.

[Authoritative specification: GitHub issue #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

**Goal:** a reliable personal daily paper whose content, relevance and convenience give readers a reason to return and consider paying. Repair the existing application through five phases; do not rebuild it or connect every candidate API by default.

## How the recovered product works

1. **Gather complementary reporting:** evaluate two candidate providers against the existing TheNewsAPI supply. Compare useful unique events, publishers, topics, regions, text depth, delay, reliability, permissions and cost. Retain integrations that demonstrate a useful benefit.
2. **Build one shared pool:** normalize provider results and provenance, reject junk/empty pages, and keep only reporting permitted for the intended public output. Fetch and cache for the application rather than repeating full retrieval for each reader.
3. **Group events and recognize updates:** combine reports of the same event with supporting-source links. Down-rank unchanged events already included in the reader's last seven completed Editions; retain materially new developments with an explanation. Inclusion is not proof of reading, and Skip stays neutral.
4. **Understand the reader:** retain broad interests and offer optional specific subjects/entities. Distinguish publisher country from the places discussed in reporting. Use saved explicit feedback and supported regional evidence to shortlist candidates.
5. **Apply a bounded AI editor:** AI refines the selection, balances relevance and discovery, explains choices, and creates Briefings grounded in available reporting. If an interest is undercovered, it may request at most two additional provider calls per Edition attempt and one refinement afterward, within shared budgets. The backend executes validated searches; AI receives no credentials or account identity.
6. **Preserve one Edition:** validate selected identities, evidence, permissions, uniqueness and reading budget; save the result for matching web reading, archive and newspaper PDF. Keep a deterministic fallback for model failure, but verify actual AI selection before claiming that capability works.

## Ticket execution

The owner merged former drafts R01+R02, R04+R05 and R10+R11 into eight tickets. See the [revised ticket index](TICKET-REVIEW.md). The five product phases remain; merged tickets contain ordered internal gates where they cross phase boundaries. The final ticket passes deployed verification before its seven-day pilot and closes only after both.

## The five delivery phases

| Phase | Deliverable | Evidence required to finish |
|---|---|---|
| **R1: Trustworthy, complementary reporting** | Secure shared-data writes; evaluate two providers; implement the justified source combination and common quality/event-grouping pipeline. | Ordinary clients cannot write shared reporting; trusted ingestion works; live provider scorecard shows actual coverage; one provider failing does not corrupt the pool; unsuitable or disallowed material cannot reach public outputs. |
| **R2: A complete paper everywhere** | Restore full lead-Story content/actions, fix broken navigation, and deliver the same saved reading content as a finished newspaper PDF. | Web/archive/PDF agree on order, text, importance explanations and source links; all Story controls work; representative short and multipage PDF visual checks pass. |
| **R3: Useful AI personalization and learning** | Use optional subtopics, supported geography, recent inclusion and explicit feedback; implement bounded AI selection and targeted search. | Contrasting readers get meaningfully different papers; persisted feedback changes the next day's selection; unchanged events are deprioritized and genuine updates remain eligible; real AI, search limits and fallback work; previous Editions remain unchanged. |
| **R4: A finished reader experience** | Simplify reading, expose a sample Edition/PDF before login, remove unsupported claims, and verify accessibility/reliability. | Final deployed Google sign-in, onboarding, reading, feedback, settings, sources, PDF, archive and recovery work on mobile/desktop; keyboard/reduced-motion checks pass; current operating and rollback notes exist. |
| **R5: Evidence of paid value** | Run a seven-day pilot with five target readers, a stated proposed recurring price and an operating-cost estimate. | Assess observed task completion, repeat use, useful learning, price commitments, content-depth targets and feasible costs. Record negative results. A small pilot is directional evidence, not guaranteed sales. |

**R1–R4 establish product readiness. R5 adds evidence for the commercial offer.** Live billing is a later explicit scope after price, demand and merchant access are established. There is no invented deadline; estimate remaining work after R1 establishes source feasibility.

## Provider selection remains evidence-based

GNews, NewsData.io, Currents and Mediastack are evaluation candidates. Their quotas, content depth and output permissions differ. Customer-facing AI summaries, PDFs and persistent archives need particular attention; a free key is not proof those uses are included. Do not buy plans, enable billing or integrate all four merely to increase request counts. The detailed spec preserves the verified documentation findings and the unresolved NewsData.io guidance conflict.

## Verification

Keep the already approved primary boundary: the reader's complete browser/Edition journey against an isolated test database, with controlled news/model responses and clock. Add overlapping provider results, provider failure, geographic ambiguity, event repetition/updates, invalid AI choices and bounded search cases at that same boundary. Compare canonical web/archive/PDF content and verify both shared-data security and private reader ownership. Use live samples and actual pilot readers to assess usefulness; automatic tests cannot establish it alone.

Plan revision only: no application implementation, provider purchase, deployment, production migration or reader outreach has been performed by publishing it.

[Full recovery specification](spec.md)
