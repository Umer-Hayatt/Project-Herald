# Herald

A personal daily paper that combines relevant reporting with important Stories beyond a reader's usual interests.

## Recovery Status (updated 16 November 2026)

**Not finished.** The code builds and passes its offline checks, and the site is deployed, but recovery [specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11) is not met yet. Earlier "R01–R07 complete" claims in this file were superseded by the 19–23 October audit.

Read [the current status and owner steps](docs/recovery/2026-11-16-status-and-owner-steps.md) first, then the [recovery handoff](docs/recovery/README.md) and [architecture overview](docs/evidence/architecture-overview.md).

- **Working:** Google sign-in screen with an 18+ declaration, onboarding, preserved daily Editions, feedback, archive, matching PDF, public sample, server-only shared reporting. Verified in isolated tests (292/292 on 24 October); the anonymous live pages were rechecked on 16 November.
- **Open:** fresh broad permitted news supply (only Global Voices is enabled), live AI (Gemini is disabled), a real signed-in reader journey on the live site, migration baseline, and the seven-day pilot.
- **Tracker:** only [#12](https://github.com/Umer-Hayatt/Project-Herald/issues/12) is closed; #13–#19 remain open.

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
