# Herald: Pilot-Ready Offer & Operating Cost Worksheet

## 1. Concrete Recurring-Price Value Offer

### The Proposition: Herald Finite Morning Paper
Herald is a calm, finite daily newspaper delivered once each morning, designed to replace endless algorithmic doomscrolling with purposeful reading.

- **Curated to Declared Interests:** Articles matched to reader-selected topics, subtopics, and target reading lengths (5, 10, 15, or 20 minutes).
- **Perspective Beyond the Bubble:** Every edition includes verified, source-grounded reporting outside the reader's usual scope.
- **Finite Completion Ritual:** A clear `#edition-end` finish with no infinite scrolling, autoplay, or attention traps.
- **Multiple Reading Formats:** Full responsive web edition, historical archive, and printable newspaper-styled PDF export.
- **Complete Provenance:** Every story provides an executive briefing, why-it-matters contextual analysis, and direct source attribution links to original reporting.

### Commercial Pricing Structure
- **Proposed Price Point:** **$5.00 / month** (or **$49.00 / year** paid annually).
- **Free Trial Window:** 7-day initial pilot reading period.
- **Paid Feature Inclusions:** Unlimited daily editions, cross-device synchronization, next-day adaptive learning from feedback, 30-day searchable archive, and daily high-resolution newspaper PDF generation.

---

## 2. Conservative Operating Cost & Request Capacity

### News Provider APIs

| Provider | Free Tier Allocation | Ingestion Usage Strategy | Operating Cost (Pilot) | Scaling Cost (Paid) |
|---|---|---|---|---|
| **TheNewsAPI** | 100 requests / day | Atomic database refresh lock + 48-hour shared caching window coalesces concurrent readers. Shared pool requires $\le 10$ requests / UTC day across all readers. | $0.00 / mo | $19.00 / mo (Starter, 10k req) |
| **NewsData** | 200 requests / day | Complementary secondary pool queried during shared cache refresh only. Consumes $\le 10$ calls / UTC day. | $0.00 / mo | $39.99 / mo (Basic) |

### AI Model (Google Gemini)

| Dimension | Specification | Usage & Budget Constraints |
|---|---|---|
| **Selected Model** | Google Gemini 2.5 Flash / 1.5 Flash (`gemini-2.5-flash`) | Enabled via server-side API key with automatic deterministic fallback. |
| **Free Tier Quota** | 15 RPM, 1,500 RPD, 1,000,000 TPM | Enforced server-side. |
| **Token Usage per Edition** | ~2,000 input tokens (candidate shortlist) + ~300 output tokens | Minimal outbound brief (zero PII, emails, or credentials sent). |
| **Cost per Edition** | $0.00 on free tier ($0.0003/edition at standard pay-as-you-go rates) | Negligible operating cost (<$0.01/reader/month). |

### Infrastructure & Database

| Component | Platform | Resource Allocation & Limits | Monthly Cost |
|---|---|---|---|
| **Postgres Database** | Supabase | 500 MB storage, Row Level Security (RLS), 50,000 Monthly Active Users. Daily storage growth is $\approx 50\text{ KB/day}$ ($\approx 1.5\text{ MB/month}$). | $0.00 / mo |
| **Application Hosting** | Vercel | Next.js Serverless Functions, Edge Middleware, Static Asset CDN. | $0.00 / mo |

### Capacity Summary
- **Free Recovery Operating Capacity:** Supports up to **50 active daily readers** with zero infrastructure spend.
- **Commercial Break-Even Unit Economics:** At $5.00/month/reader, fixed provider costs ($58.99/mo) are fully covered by just **12 paying subscribers**, yielding $>95\%$ gross margins at scale.

---

## 3. Stage B Seven-Day Pilot Protocol

### Participant Cohort
Five consenting target participants with contrasting reading preferences:
1. **Participant 1:** Technology & Artificial Intelligence (Engineering / Product focus).
2. **Participant 2:** Global Politics & Environmental Policy (Public policy / International relations).
3. **Participant 3:** Financial Markets & Economics (Business / Macroeconomics focus).
4. **Participant 4:** Arts, Architecture & Culture (Design / Cultural commentary focus).
5. **Participant 5:** Science, Astronomy & Health (Medical / Research focus).

### Consented Telemetry & Measurements
Measurements collected strictly with reader consent:
- Daily paper access timestamp and reading completion to `#edition-end`.
- Use of Story actions (`More like this`, `Less like this`, `Skip to next story`).
- Downloads of daily newspaper PDF.
- Click-throughs to original reporting source links.
- Qualitative feedback submitted via settings or direct feedback.

### Directional Acceptance Gates
Stage B will evaluate the four recovery criteria across seven elapsed days:
1. **Usability:** At least 4 of 5 complete core reading tasks without intervention or coaching.
2. **Ritual Retention:** At least 3 of 5 return on 3 or more distinct calendar days.
3. **Relevance & Learning:** At least 3 of 5 describe specific useful learning or perspective outside their bubble.
4. **Attributable Commercial Intent:** At least 2 of 5 make an explicit attributable commitment to pay $5.00/month for the daily service.

*Note: In accordance with recovery rules, Skip actions are treated as neutral navigation and never recorded as dislike. Stage B remains open until seven actual days of participant evidence have elapsed.*
