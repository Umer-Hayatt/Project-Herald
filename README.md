# Herald

A personal daily paper that combines relevant reporting with important Stories beyond a reader's usual interests.

## Project status

Planning is approved and published. Application implementation has not begun. The target is a usable first release by 21:00 on 17 October 2026, Asia/Karachi, using free services. Runtime API access, Google OAuth and deployment remain build work rather than verified capabilities.

## Start here

- [Release specification: issue #1](https://github.com/Umer-Hayatt/Project-Herald/issues/1)
- [Nine-ticket index and blocking graph](docs/planning/ticket-index.md)
- [First unblocked ticket: Google sign-in and onboarding](https://github.com/Umer-Hayatt/Project-Herald/issues/2)
- [Deadline checkpoints and known access risks](docs/planning/release-plan.md)
- [Confirmed product context](PRODUCT.md) and [domain vocabulary](GLOSSARY.md)

## Agreed approach

Next.js, TypeScript, Tailwind CSS, Supabase and Vercel; Google sign-in; TheNewsAPI as the first reporting candidate; Gemini free-tier API for grounded Briefings and topic labels, subject to live access verification. Preserve one reader-local daily Edition across web, archive and downloadable newspaper-inspired PDF. Feedback improves future Editions.

The final build slice, issue #9, covers human-authored comic artwork, user-supplied animation references and frontend finishing. Earlier screens must be usable with replaceable artwork/motion areas. The combined Briefings/grouping/discovery slice is issue #4. Issue #10 packages the architecture diagram and final product video after the build.

## Planning records

The [specification snapshot](docs/planning/release-spec.md), [confirmed decision record](docs/planning/product-decisions.md) and [design brief](docs/planning/design-brief.md) preserve the discovery work. References in original discovery records to local outputs or design assets refer to that earlier workspace. They are not claims that those assets or integrations exist in this repository. GitHub Issues are authoritative for current ticket status and dependencies.

Read [AGENTS.md](AGENTS.md) before agent work. Tracker, status-label and domain-document conventions are under docs/agents. Keep meaningful regular commits and record actual acceptance evidence. Setup/run commands and deployed-product instructions will be added as the build slices complete; no app launch command exists yet.
