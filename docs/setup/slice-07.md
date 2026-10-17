# Herald slice 07 operations and verification

Ticket: https://github.com/Umer-Hayatt/Project-Herald/issues/8

## Local setup

Follow [slice 01 setup](slice-01.md) for Supabase URL/key, Google configuration, ignored `.env.local` and disposable `.env.test.local` readers. Preserve existing environment files. Do not place TheNewsAPI or Gemini credentials in public variables or commit them.

From the repository root:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Before running this code against a Supabase project, apply migrations in `supabase/migrations` in timestamp order. Slice 07 adds `20261017180000_resilient_provider_limits.sql`; it adds atomic refresh-claim RPCs and removes direct authenticated access to shared refresh metadata. Do not deploy this application migration until the matching database migration has succeeded.

The news refresh is capped at 15 provider HTTP requests per UTC day. A cache refresh reserves five calls atomically before starting; failures consume the reservation. Concurrent readers share one active refresh. Provider calls time out after ten seconds, malformed response items are discarded, and previously cached reporting is read when refresh cannot run. The cache retains only reporting from the previous 48 hours.

Gemini briefings remain disabled unless the provider audience/geography suitability blocker in [slice 01 setup](slice-01.md) is resolved and the account has confirmed eligible access. Excerpts and source links remain available without Gemini.

## Acceptance evidence still requiring a configured operator

- Apply the database migration to the actual dedicated project and verify the RPCs through concurrent-reader and exhausted-budget checks.
- Verify production Google login, live news and approved AI configuration, then run the complete reader smoke in [the demo outline](../evidence/slice-07-smoke-outline.md).
- Verify the controlled next-day selection, local midnight, two-reader isolation, PDF, archive, phone, desktop and keyboard behavior on the deployed site.
- Record the actual provider-account limits and deployed migration state. Local deterministic tests do not establish these facts.
