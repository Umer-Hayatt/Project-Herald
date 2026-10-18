# Provider Comparison Scorecard & Evaluation (Recovery R01)

Date: 2026-10-18T10:15:14.800Z
Authorizing Issue: [#12](https://github.com/Umer-Hayatt/Project-Herald/issues/12)
Branch: `codex/herald-recovery`

## Executive Summary

Pursuant to Recovery Ticket R01 (#12), we evaluated two candidate providers (**GNews** and **NewsData.io**) against the active supply baseline (**TheNewsAPI**), alongside reference checks on **Currents** and **Mediastack**. We inspected **30 live records** from TheNewsAPI across 8 topic categories, tested quality filtering pass/fail criteria, evaluated source text depth, and examined terms of service regarding customer AI summaries, PDF generation, and archive retention.

## 1. Provider Comparison Matrix

| Provider | Free Quota | Delay | Content Depth | AI Briefing Permission | PDF/Archive Rights | Commercial Use | Recommendation |
|---|---|---|---|---|---|---|---|
| **TheNewsAPI** | 15 req/day (3/req) | Real-time | Excerpt (40-90 words) | Permitted (grounded) | Permitted (attributed) | Permitted | **Retained Baseline** |
| **GNews** | 100 req/day (10/req) | 12 hours | Partial (~200 chars) | Paid license required | Paid license required | Paid only | **Viable Evaluation Complement** (pending commercial key) |
| **NewsData.io** | 200 cred/day (10/cred) | ~15 min | Snippet only | Terms conflict | Unresolved | Conflicting terms | **Viable Evaluation Complement** (pending terms clarification) |
| **Currents** | 250 req/day (20/req) | Near real-time | Description | **Explicitly Excluded** | **Explicitly Excluded** | Paid enterprise | **Rejected** (terms bar core product features) |
| **Mediastack** | 100 req/**month** | Delayed | Description | Non-commercial | Non-commercial | Paid only | **Rejected** (infeasible quota: ~3 req/day) |

## 2. Publisher Country vs. Event Geography

A key architectural finding confirmed during live inspection:
- Provider fields such as `locale` or `country` identify the **publisher's registration or domain origin**, NOT the geographic location of the news event.
- For example, an article published by an Indian newspaper covering a diplomatic summit in Washington D.C. carries `locale: in`, but its reported event geography is North America/Global.
- Herald's quality pipeline must distinguish publisher location from event geography by extracting named geographic entities from headline and text rather than relying solely on raw provider country tags.

## 3. Live TheNewsAPI Sample Inspection (30 Records)

- **Total Inspected**: 30
- **Quality Eligible**: 29
- **Quality Rejected**: 1
- **Rejection Breakdown**: {"generic_title":1}
- **Average Word Depth**: Title (11 words), Description (23 words), Total (59 words).

### Representative Attributable Reading Samples

### Mint Explainer: What’s at stake for consumer companies this festive season?
- **Publisher**: livemint.com (Locale: `unspecified`)
- **Published**: 2026-10-18T10:03:03.000000Z
- **URL**: [https://www.livemint.com/news/mint-explainer-what-s-at-stake-for-consumer-companies-this-festive-season-11792312794451.html](https://www.livemint.com/news/mint-explainer-what-s-at-stake-for-consumer-companies-this-festive-season-11792312794451.html)
- **Categories**: general, business
- **Event Geography Mentions**: unspecified/global
- **Text Depth**: 64 words (Title: 11, Desc: 28)
- **Quality Status**: Eligible
- **Excerpt**: "1. How important is the festive season for Indian consumer companies?

Sales during this period are vital, though the impact varies across product categories. M......"

### NMC withdraws medical education regulations: What colleges need to know
- **Publisher**: indiatoday.intoday.in (Locale: `unspecified`)
- **Published**: 2026-10-18T10:00:30.000000Z
- **URL**: [https://www.indiatoday.in/education-today/news/story/nmc-medical-education-rules-commission-scraps-2023-regulations-adr-filing-remains-mandatory-3020109-2026-10-18](https://www.indiatoday.in/education-today/news/story/nmc-medical-education-rules-commission-scraps-2023-regulations-adr-filing-remains-mandatory-3020109-2026-10-18)
- **Categories**: general
- **Event Geography Mentions**: unspecified/global
- **Text Depth**: 54 words (Title: 10, Desc: 20)
- **Quality Status**: Eligible
- **Excerpt**: "The National Medical Commission, NMC, has scrapped its 2023 regulations on maintaining standards in medical education, but medical colleges will still have to f......"

### 'It was jaw-dropping': The shocking lessons from an infamous experiment in obedience
- **Publisher**: bbc.com (Locale: `unspecified`)
- **Published**: 2026-10-18T10:00:25.000000Z
- **URL**: [https://www.bbc.com/future/article/20261016-the-shocking-truths-about-an-infamous-experiment-in-obedience?ocid=global_future_rss](https://www.bbc.com/future/article/20261016-the-shocking-truths-about-an-infamous-experiment-in-obedience?ocid=global_future_rss)
- **Categories**: science, tech, general
- **Event Geography Mentions**: unspecified/global
- **Text Depth**: 62 words (Title: 12, Desc: 24)
- **Quality Status**: Eligible
- **Excerpt**: "After the experiment, a psychologist talked to the volunteers about their experience to ensure they were OK. One young woman "began to cry very intensely", Grzy......"

### 'It was jaw-dropping': The shocking lessons from an infamous experiment in obedience
- **Publisher**: bbc.com (Locale: `unspecified`)
- **Published**: 2026-10-18T10:00:25.000000Z
- **URL**: [https://www.bbc.com/future/article/20261016-the-shocking-truths-about-an-infamous-experiment-in-obedience?ocid=global_future_rss](https://www.bbc.com/future/article/20261016-the-shocking-truths-about-an-infamous-experiment-in-obedience?ocid=global_future_rss)
- **Categories**: science, tech, general
- **Event Geography Mentions**: unspecified/global
- **Text Depth**: 62 words (Title: 12, Desc: 24)
- **Quality Status**: Eligible
- **Excerpt**: "After the experiment, a psychologist talked to the volunteers about their experience to ensure they were OK. One young woman "began to cry very intensely", Grzy......"

### Chain of Thought For Humans — LessWrong
- **Publisher**: lesswrong.com (Locale: `unspecified`)
- **Published**: 2026-10-18T09:36:53.000000Z
- **URL**: [https://www.lesswrong.com/posts/FZ6FPNCfqikNgbyef/chain-of-thought-for-humans](https://www.lesswrong.com/posts/FZ6FPNCfqikNgbyef/chain-of-thought-for-humans)
- **Categories**: science
- **Event Geography Mentions**: unspecified/global
- **Text Depth**: 39 words (Title: 7, Desc: 26)
- **Quality Status**: Eligible
- **Excerpt**: "This is a linkpost for https://www.boristhebrave.com/2026/10/18/chain-of-thought-for-humans/..."

### 3 Strategies for Using Points to Book Flights and Hotels
- **Publisher**: businessinsider.com (Locale: `unspecified`)
- **Published**: 2026-10-18T09:08:26.000000Z
- **URL**: [https://www.businessinsider.com/credit-card-airline-points-maximizing-strategies-travel-book-flights-hotels-2026-10](https://www.businessinsider.com/credit-card-airline-points-maximizing-strategies-travel-book-flights-hotels-2026-10)
- **Categories**: tech, business, science
- **Event Geography Mentions**: unspecified/global
- **Text Depth**: 62 words (Title: 10, Desc: 25)
- **Quality Status**: Eligible
- **Excerpt**: "I've been collecting airline miles and credit card points for more than two decades, long before the influx of social media posts promising things like a "free"......"

### 'It was jaw-dropping': The shocking lessons from an infamous experiment in obedience
- **Publisher**: bbc.com (Locale: `unspecified`)
- **Published**: 2026-10-18T10:00:25.000000Z
- **URL**: [https://www.bbc.com/future/article/20261016-the-shocking-truths-about-an-infamous-experiment-in-obedience?ocid=global_future_rss](https://www.bbc.com/future/article/20261016-the-shocking-truths-about-an-infamous-experiment-in-obedience?ocid=global_future_rss)
- **Categories**: science, tech, general
- **Event Geography Mentions**: unspecified/global
- **Text Depth**: 62 words (Title: 12, Desc: 24)
- **Quality Status**: Eligible
- **Excerpt**: "After the experiment, a psychologist talked to the volunteers about their experience to ensure they were OK. One young woman "began to cry very intensely", Grzy......"

### Andrew Left wants his fraud conviction tossed after witness gets caught up in insider trading probe
- **Publisher**: businessinsider.com (Locale: `unspecified`)
- **Published**: 2026-10-18T10:00:04.000000Z
- **URL**: [https://www.businessinsider.com/andrew-left-witness-insider-trading-investigation-daniel-bachus-grand-canyon-2026-10](https://www.businessinsider.com/andrew-left-witness-insider-trading-investigation-daniel-bachus-grand-canyon-2026-10)
- **Categories**: tech, business
- **Event Geography Mentions**: unspecified/global
- **Text Depth**: 65 words (Title: 16, Desc: 23)
- **Quality Status**: Eligible
- **Excerpt**: "A witness who testified against Andrew Left has himself become involved in an insider trading probe, bringing a new twist to the bombastic short-seller's fraud ......"

### I made an impulsive decision to quit a great job in Hollywood. It felt like a mistake — but here's what I learned.
- **Publisher**: businessinsider.com (Locale: `unspecified`)
- **Published**: 2026-10-18T10:00:03.000000Z
- **URL**: [https://www.businessinsider.com/quit-hollywood-job-career-mistake-worked-out-risks-reward-2026-10](https://www.businessinsider.com/quit-hollywood-job-career-mistake-worked-out-risks-reward-2026-10)
- **Categories**: tech, business
- **Event Geography Mentions**: unspecified/global
- **Text Depth**: 70 words (Title: 23, Desc: 19)
- **Quality Status**: Eligible
- **Excerpt**: "The following is adapted from a book excerpt.

I began my career as an entertainment lawyer in a major firm. It was a lucrative, predictable professional path t......"

### Saudi Printing sells production lines for SAR 1.1M, expects SAR 5M non-cash loss
- **Publisher**: argaam.com (Locale: `unspecified`)
- **Published**: 2026-10-18T10:08:00.000000Z
- **URL**: [https://www.argaam.com/en/article/articledetail/id/1944848](https://www.argaam.com/en/article/articledetail/id/1944848)
- **Categories**: business
- **Event Geography Mentions**: unspecified/global
- **Text Depth**: 65 words (Title: 13, Desc: 24)
- **Quality Status**: Eligible
- **Excerpt**: "The sale is part of SPPC’s strategy to evaluate exit options for non-core assets and projects

Saudi Printing and Packaging Co. (SPPC) sold on Oct. 15 the pol......"


## 4. Architectural Recommendations for Recovery Slice R02

1. **Keep TheNewsAPI as Protected Ingestion Baseline**: Maintain the current resilient 15-request daily budget and trusted ingestion RPC.
2. **Evaluation Credentials Prerequisite**: To integrate GNews or NewsData.io in R02 as a complementary secondary provider, the repository owner must supply an evaluation API key in `.env.local`.
3. **Licensing Verification**: Before commercial deployment (R08), the licensing terms for customer-facing AI Briefings and persistent PDF exports must be formally confirmed for any candidate provider.
4. **AI Runtime Status**: Gemini (`gemini-3.8-flash`) is verified responsive via API probe. Deterministic fallback remains operational for all Edition generation.
