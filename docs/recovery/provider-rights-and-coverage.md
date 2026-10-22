# Provider rights and live coverage checkpoint

Checked 22 October 2026. This is a release gate, not a claim that any provider
has granted Herald customer-facing Briefing, PDF or archive rights.
The owner confirmed on this date that no such permission is confirmed yet.
An [unsent permission-request draft](provider-permission-request.md) lists the
exact product surfaces to clarify with the provider.

| Provider | Current public evidence | Herald status |
| --- | --- | --- |
| TheNewsAPI | [Public terms](https://www.thenewsapi.com/tos) give a generic personal, non-commercial site-content license and require approval for commercial site use. [Pricing](https://www.thenewsapi.com/pricing) lists plan-specific request and article limits. These pages do not establish this account's rights to Herald's outputs. | Evaluation-only by default. Set server-only `THENEWSAPI_COMMERCIAL_APPROVED=true` only after account-specific permission for public Briefings, PDFs and archives is verified. |
| GNews | Its [FAQ](https://gnews.io/faq) says the free plan is for personal, academic and evaluation use; an active paid plan is required for commercial projects. | Evaluation-only on the free plan. |
| NewsData.io | Its own [commercial-use comparison](https://newsdata.io/blog/free-news-api-for-commercial-use/) says the free plan disallows commercial use, while [another vendor article](https://newsdata.io/blog/top-free-news-apis/) says it allows it. | Evaluation-only pending plan-specific clarification. |
| Gemini | [Model availability](https://ai.google.dev/gemini-api/docs/models) and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) vary by project and model; [terms](https://ai.google.dev/gemini-api/terms) govern source-text input and unpaid service data use. | A suitable enabled model, actual quota and compatibility with licensed source excerpts are not verified. |

The recovery checkout has no live provider or model keys in its own environment
files. A news token exists in the original checkout, but its plan and sampling
budget have not been verified. No live call was made in this checkpoint. The prior
`docs/evidence/daily-coverage/2026-10-18.json` recorded only one historical day,
with six of ten interests meeting its old structural count. It predates the
current output policy and cannot be combined with a new successive-day series.

New public supply, homepage and Trending reads recheck the current server-side
approval for each known provider. An old shared `commercial` tag cannot override
missing approval; unknown providers fail closed on these paths. Saved Editions
remain unchanged. The exact production quarantine still needs to review fixture
provenance and source rights before rollout. Isolated browser tests clear live
keys and explicitly approve their controlled fixture providers.

`scripts/record-daily-coverage.mjs` now uses an environment token when supplied,
asks for at most three articles per category request, applies the current
quality policy with explicit evaluation-only provenance, records HTTP failures,
deduplicates articles across category queries and saves exact candidate links
for manual review. It writes timestamped private files under ignored
`tmp/daily-coverage/`; it never calls a structural candidate count a verified
coverage pass. Do not commit these private raw reports as release evidence.

To close the live coverage gate, first verify account-specific output rights and
a dedicated permitted sampling budget. Then collect three actual successive
daily samples, review relevant distinct Stories and publisher diversity across
all advertised interests and regions, and record failures and shortages. Do not
simulate elapsed days or promote an unreviewed private sample to public output.
