# Herald

A personal daily paper that combines relevant reporting with important Stories beyond a reader's usual interests.

## Current build

Slice 01 (GitHub issue #2) implements Google OAuth through Supabase, private persisted onboarding, draft saves, server-side validation, IANA time-zone handling and an honest paper entry state. Real Editions arrive in slice 02. Final human-made artwork and animation remain the last build slice.

The account code is implemented; production Google OAuth and live news/Gemini access require the setup and evidence in [slice 01 setup](docs/setup/slice-01.md). Missing credentials and provider terms are recorded as blockers, never as successful checks. Issue #2 stays open until live acceptance passes.

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
- [Current slice: issue #2](https://github.com/Umer-Hayatt/Project-Herald/issues/2)
- [Ticket index and blockers](docs/planning/ticket-index.md)
- [Product context](PRODUCT.md), [domain vocabulary](GLOSSARY.md), [interface foundation](DESIGN.md)

The agreed stack is Next.js, TypeScript, Tailwind CSS, Supabase and Vercel. TheNewsAPI and Gemini remain selected candidates, subject to verified access and suitability. Gemini's published audience/geography restrictions conflict with the current broad-audience/free-service plan; resolve this before AI rollout without silently changing provider or product scope.

Read [AGENTS.md](AGENTS.md) before agent work. GitHub Issues are authoritative for live status and dependencies. Planning documents preserve approved decisions and original schedule context.
