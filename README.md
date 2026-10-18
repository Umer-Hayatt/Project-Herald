# Herald

A personal daily paper that combines relevant reporting with important Stories beyond a reader's usual interests.

## Active recovery

The current recovery authority is [specification #11, revision 2](https://github.com/Umer-Hayatt/Project-Herald/issues/11). Start with [the recovery handoff](docs/recovery/README.md), [short plan](docs/recovery/plan.md) and [ticket approval/index](docs/recovery/TICKET-REVIEW.md). The recovery breakdown is drafted and awaiting owner approval; implementation has not started. The sections below retain the original build/setup record and require current verification.

## Original build record

Slices 01–06 cover account/onboarding, preserved Editions, grounded Stories and discovery, feedback/settings, archive, and matching PDF exports. Slice 07 hardens provider failures and free-tier limits. Final human-made artwork and animation remain the last build slice.

Production Google OAuth and live news/Gemini access require the setup and evidence in [slice 01 setup](docs/setup/slice-01.md). Missing credentials and provider terms are recorded as blockers, never as successful checks. See the [architecture outline](docs/evidence/architecture-overview.md), [slice 07 operations](docs/setup/slice-07.md), and [smoke-demo outline](docs/evidence/slice-07-smoke-outline.md).

## Run locally

Use Node.js 24 and npm. From the project root:

```powershell
npm ci
Copy-Item .env.example .env.local
# Fill the Supabase URL/publishable key and set APP_URL=http://localhost:3000.
npm run dev
```

Open http://localhost:3000. Configure Google in the dedicated Supabase allocation before signing in. Existing .env.local files should be preserved instead of overwritten.

```powershell
npm run typecheck
npm run lint
npm run test:account
npm test
npm run build
npm start
```

The browser suite runs desktop and phone-sized Chromium against real Supabase. Disposable test reader credentials belong only in ignored .env.test.local; see setup instructions. Install the browser with `npx playwright install chromium`. The full persisted journey explicitly skips without those readers; the Google production smoke test is a separate human-assisted acceptance step.

`npm run check:providers` performs bounded live probes with server-only keys and records a sanitized report. Do not deploy test/admin credentials or commit environment files. The app runtime uses only the public Supabase key and row-level ownership policies.

## Project resources

- [Selected public repository](https://github.com/Umer-Hayatt/Project-Herald)
- [Herald deployment](https://project-herald-pink.vercel.app)
- [Dedicated Supabase project](https://supabase.com/dashboard/project/hnzwraiojsftuncridsp)
- [Release specification: issue #1](https://github.com/Umer-Hayatt/Project-Herald/issues/1)
- [Resilience slice: issue #8](https://github.com/Umer-Hayatt/Project-Herald/issues/8)
- [Ticket index and blockers](docs/planning/ticket-index.md)
- [Product context](PRODUCT.md), [domain vocabulary](GLOSSARY.md), [interface foundation](DESIGN.md)

The agreed stack is Next.js, TypeScript, Tailwind CSS, Supabase and Vercel. TheNewsAPI and Gemini remain selected candidates, subject to verified access and suitability. Gemini's published audience/geography restrictions conflict with the current broad-audience/free-service plan; resolve this before AI rollout without silently changing provider or product scope.

Read [AGENTS.md](AGENTS.md) before agent work. GitHub Issues are authoritative for live status and dependencies. Planning documents preserve approved decisions and original schedule context.
