# Herald

A personal daily paper that combines relevant reporting with important Stories beyond a reader's usual interests.

## Active Recovery Status

The recovery program is governed by [specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11). Slices R01 through R07 are complete and verified across both desktop and mobile viewports. Slice R08 Stage A (Deployed Reader Readiness) is verified.

See the [recovery index](docs/recovery/TICKET-REVIEW.md), [detailed recovery handoff](docs/recovery/README.md), and [architecture overview](docs/evidence/architecture-overview.md).

### Implemented Recovery Slices

- **R01 ([#12](https://github.com/Umer-Hayatt/Project-Herald/issues/12)):** Direct public shared-write denial, content quality gate (48-hour freshness, substantive text criteria, non-article index rejection), atomic ingestion claim RPC, and two-reader RLS ownership isolation.
- **R02 ([#13](https://github.com/Umer-Hayatt/Project-Herald/issues/13)):** Complementary multi-provider supply coordinator (TheNewsAPI + NewsData) with shared caching, event grouping, publisher vs event geography resolution, and provider fault-tolerance.
- **R03 ([#14](https://github.com/Umer-Hayatt/Project-Herald/issues/14)):** Canonical Story contract (`title`, `excerpt`, `briefing`, `why_it_matters`, `publisher`, `source_url`, `supporting_sources`), web and PDF parity, negative feedback non-promotion, subtopic affinity scoring, and immutable past editions.
- **R04 ([#15](https://github.com/Umer-Hayatt/Project-Herald/issues/15)):** Cross-provider event lineage and 7-day past inclusion deduplication. Down-ranks repeated unchanged events while preserving materially new updates with explicit update explanations.
- **R05 ([#16](https://github.com/Umer-Hayatt/Project-Herald/issues/16)):** Bounded AI Editor powered by Google Gemini (Flash) with automatic deterministic fallback. Sends minimal outbound brief (zero reader PII, credentials, or histories) and validates shortlisted candidates against declared preferences.
- **R06 ([#17](https://github.com/Umer-Hayatt/Project-Herald/issues/17)):** Bounded targeted search filling undercovered reader interests. Enforces max 2 provider calls, 1-hour cache coalescing across concurrent readers, prompt injection rejection, and one refinement cycle.
- **R07 ([#18](https://github.com/Umer-Hayatt/Project-Herald/issues/18)):** Calm finished reading experience and public samples before login. Prominent unauthenticated sample edition at `/sample` and matching PDF at `/api/editions/sample/pdf`. Signed-in paper displays actual reading duration vs budget (`~X min read (Y min plan)`), removed duplicate teasers and hype labels, and offers clear `#edition-end` finish.
- **R08 ([#19](https://github.com/Umer-Hayatt/Project-Herald/issues/19)):** Stage A Deployed Reader Readiness verified. Ready for owner-led Stage B 7-day pilot.

## Run Locally

Use Node.js 20+ and npm. From the project root:

```powershell
npm ci
Copy-Item .env.example .env.local
# Ensure Supabase URL and publishable key are configured in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verification & Testing

```powershell
npm run typecheck
npm run lint
npx playwright test tests/recovery-r01.spec.ts
npx playwright test tests/recovery-r02.spec.ts
npx playwright test tests/recovery-r03.spec.ts
npx playwright test tests/recovery-r04.spec.ts
npx playwright test tests/recovery-r05.spec.ts
npx playwright test tests/recovery-r06.spec.ts
npx playwright test tests/recovery-r07.spec.ts
npx playwright test tests/recovery-r08-readiness.spec.ts
npm run build
```

## Project Resources

- [Selected public repository](https://github.com/Umer-Hayatt/Project-Herald)
- [Herald deployment](https://project-herald-pink.vercel.app)
- [Dedicated Supabase project](https://supabase.com/dashboard/project/hnzwraiojsftuncridsp)
- [Recovery Specification: Issue #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)
- [Architecture Overview](docs/evidence/architecture-overview.md)
- [Product Context](PRODUCT.md), [Domain Vocabulary](GLOSSARY.md), [Interface Foundation](DESIGN.md)
