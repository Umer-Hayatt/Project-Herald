# Retained Provider Combination & Multi-Source Architecture (Recovery R02)

**Date:** 2026-10-18  
**Authorizing Issue:** [#13 (R02: Deliver diverse Stories from the justified provider combination)](https://github.com/Umer-Hayatt/Project-Herald/issues/13)  
**Parent Specification:** [Recovery specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11)  
**Branch:** `codex/herald-recovery`  

---

## 1. Executive Summary

Pursuant to Recovery Ticket R02 (#13) and the comparative findings of R01 (#12), Project Herald has implemented a multi-source provider architecture capable of ingesting from complementary news services into a single normalized, quality-filtered reporting pool.

Based on the legal terms of service, technical quotas, content depth, and commercial permissions evaluated across five candidates:
1. **TheNewsAPI** is retained as the **production baseline provider**.
2. **GNews** and **NewsData.io** are retained as **evaluation-only complements** (active when optional evaluation keys are supplied, but segregated from commercial production outputs).
3. **Currents** and **Mediastack** remain **permanently rejected** due to prohibitive licensing terms and infeasible quotas.

---

## 2. Retained Combination & Comparative Justification

| Provider | Ingestion Role | Permitted Output Surfaces | Free Quota & Latency | Retention Justification |
|---|---|---|---|---|
| **TheNewsAPI** | **Primary Baseline** | Public Previews, Editions, Briefings, PDFs, Archives | 15 req/day (3-5 articles/req), Real-time | Fully compliant with attributed customer-facing briefings and private archives. Working live in production. |
| **GNews** | **Evaluation Complement** | Internal testing / evaluation only | 100 req/day (10 articles/req), 12h delay | Viable secondary supply for breaking events; free tier is restricted to non-commercial/evaluation use. |
| **NewsData.io** | **Evaluation Complement** | Internal testing / evaluation only | 200 cred/day (10 articles/cred), ~15 min | Viable regional complement; commercial terms conflict between documentation pages. |
| **Currents** | *Rejected* | None | 250 req/day | **Barred**: Terms explicitly forbid customer-facing AI summaries and archives in self-service tiers. |
| **Mediastack** | *Rejected* | None | 100 req/**month** (~3 req/day) | **Barred**: Quota is architecturally infeasible for daily multi-reader operations. |

---

## 3. Output-Use Permissions & Segregation Policy

To ensure compliance with third-party intellectual property constraints:
- **`commercial`**: Reporting permitted for public homepage previews, reader daily editions, grounded briefings, downloadable PDFs, and preserved archives.
- **`evaluation_only`**: Reporting restricted to internal development and offline evaluation. The content quality policy (`filterEligibleArticles`) rejects evaluation-only material with rejection reason `disallowed_output_use` unless `allowEvaluationOnly: true` is explicitly passed.
- **Cross-Provider Grouping Segregation**: When articles from multiple providers are grouped into a single Story, any supporting article flagged as `evaluation_only` is automatically stripped from production `supporting_sources` and briefings.

---

## 4. Multi-Source Architectural Guarantees

1. **Normalized Provider Provenance (`src/lib/edition/providers/types.ts`)**:
   Every ingested candidate carries explicit provenance in its `raw_data`:
   - `provider`: source provider identifier (`"thenewsapi"`, `"gnews"`, `"newsdata"`, etc.).
   - `output_use`: license category (`"commercial" | "evaluation_only" | "internal_testing"`).
   - `retrieved_at`: ISO timestamp of ingestion.
   - `canonical_url`: normalized URL stripped of tracking parameters and hash fragments.
   - `publisher_locale`: registration country of the publishing outlet.
   - `event_geography`: array of regional entities detected within the article text.

2. **Event Geography vs. Publisher Country (`src/lib/edition/geography.ts`)**:
   - Provider `locale` denotes the publisher's country, NOT where the event occurred.
   - Herald extracts named geographic entities from headlines and descriptions.
   - Stories reporting on a foreign event published by a local outlet receive an event location tag corresponding to the reported event.
   - When geographic evidence is absent, the story remains eligible under global fallback without falsely claiming regional relevance.

3. **Conservative Event Grouping & Deduplication (`src/lib/edition/grouping.ts`)**:
   - Canonical URLs are normalized and deduplicated across providers.
   - Multi-source same-event grouping requires strong title token overlap (>=50% union) AND shared named-entity/body-text evidence within a 36-hour window.
   - Distinct events within the same category remain distinct.
   - Representative article selection prioritizes commercial over evaluation material, followed by text depth.

4. **Graceful One-Provider Failure (`src/lib/edition/providers/coordinator.ts`)**:
   - Multiple providers are queried concurrently via `Promise.allSettled`.
   - If one provider returns an HTTP error (e.g., 429 rate limit), times out, or throws a network error, the coordinator captures the failure and continues with surviving provider candidates.
   - A single provider failure does not fail the reader's Edition generation or preview display.

5. **Shared Cache & Request Budgeting (`src/lib/edition/news-supply.ts`)**:
   - Articles are cached in Supabase with a 60-minute revalidation window.
   - Database RPC `claim_reporting_refresh` atomically locks the refresh claim and enforces daily request limits.
   - Concurrent reader requests coalesce on the active refresh or read from the fresh cache.

---

## 5. Daily Live Coverage Sample Checkpoint (Day 1: 2026-10-18)

- **Audit File:** [`docs/evidence/daily-coverage/2026-10-18.json`](daily-coverage/2026-10-18.json)
- **Gate Requirement:** On three successive daily live samples, each advertised interest must have at least 3 eligible distinct relevant Stories drawn from at least 2 publishers.

### Advertised Interests Coverage (2026-10-18)

| Interest | Raw Count | Eligible Count | Grouped Stories | Distinct Publishers | Gate Status |
|---|---|---|---|---|---|
| **Technology** | 3 | 3 | 3 | 2 | **Sufficient** |
| **Business** | 3 | 3 | 3 | 3 | **Sufficient** |
| **Health** | 3 | 3 | 3 | 2 | **Sufficient** |
| **Sports** | 3 | 3 | 3 | 3 | **Sufficient** |
| **Politics** | 3 | 3 | 3 | 3 | **Sufficient** |
| **Food** | 3 | 3 | 3 | 3 | **Sufficient** |
| **General** | 3 | 2 | 2 | 1 | Shortage (need >=3 stories, >=2 pub) |
| **Science** | 3 | 2 | 2 | 2 | Shortage (need >=3 stories) |
| **Entertainment** | 3 | 2 | 2 | 2 | Shortage (need >=3 stories) |
| **Travel** | 3 | 2 | 2 | 1 | Shortage (need >=3 stories, >=2 pub) |

### Regional Coverage (2026-10-18)

| Region | Event-Confirmed Stories | Publisher Country Mentions | Status |
|---|---|---|---|
| **Global** | 26 | N/A | **Available** (Baseline coverage) |
| **Pakistan (`pk`)** | 1 | 0 | Available (1 confirmed event) |
| **United States (`us`)** | 2 | 0 | Available (2 confirmed events) |
| **India (`in`)** | 2 | 0 | Available (2 confirmed events) |
| **Australia (`au`)** | 1 | 0 | Available (1 confirmed event) |
| **United Kingdom (`gb`)** | 0 | 0 | Global fallback |
| **Canada (`ca`)** | 0 | 0 | Global fallback |

### Successive Daily Samples Checkpoint
- **Sample 1 (2026-10-18):** Recorded above. 6/10 interests meet the gate; 4 show wire shortages.
- **Sample 2:** Pending next calendar day.
- **Sample 3:** Pending subsequent calendar day.

Per specification #11, missing or unsupported coverage remains explicit. The gate is not closed on synthetic dates or fabricated numbers; intermediate evidence is recorded and preserved.
