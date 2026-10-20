# Isolated recovery verification

Docker is not required. The owner chose a separate hosted Supabase project on
20 October 2026 after local WSL/Docker setup proved unavailable.

## Approved targets

- Test: **Herald Recovery Test**, project `ebvwcsazotyzczrtjfol`, Mumbai,
  in **Umer-Hayatt's Org**. Supabase quoted $0/month at creation.
- Production: `hnzwraiojsftuncridsp` — prohibited for test mutations.
- The app is started by Playwright at `http://localhost:3000`. Remote app
  overrides are prohibited. A hosted test database does not authorize testing
  mutations through the production website.

`tests/isolation.ts` pins the exact test-project origin, permits loopback
databases for machines able to run local Supabase, and rejects other hosted
targets. No environment variable can substitute an arbitrary hosted project.

## Configuration

Use Node 24 and an ignored `.env.test.local` containing the test project's
publishable key and disposable reader credentials. No production keys belong
in it. The normal runner loads only test settings, clears inherited live
news/model keys, disables live Gemini calls, and starts its own application.

The two initial disposable test readers were provisioned in the empty test
project through an operator SQL fixture with generated random passwords and
confirmed email identities. Their actual Auth sign-in was verified. Credentials
were written only to ignored local files; no email was sent.

The owner later configured `SUPABASE_REPORTING_SERVICE_KEY` directly in the
ignored file. Its test-project reference and server role were checked without
printing the key, and the server-only read RPC succeeded. The normal app/test
writer can now exercise real persistence in this isolated project.

Additional readers can be created through the guarded operator command
`node --env-file=.env.test.local scripts/create-test-readers.mjs` when a
test-project key is separately supplied as `SUPABASE_TEST_ADMIN_KEY`. The CLI
on this machine is not logged in, and the connector exposes publishable keys
only; neither is used to retrieve production credentials.

Never put server credentials in `NEXT_PUBLIC_` variables, logs or commits.

## Running

1. Use the recovery checkout on `codex/herald-audit-fixes` for edits.
2. Its existing dependency junction points outside the Turbopack root. Run
   browser tests in the verification copy with copied dependencies under the
   chat's `work/build-check`; synchronize source/tests without changing shared
   dependencies and copy the ignored test environment privately.
   PDF checks require Python with `pypdf`. Set `HERALD_TEST_PYTHON` to that
   interpreter and put its directory on `PATH` for older checks that invoke
   `python` directly. The bundled Codex Python was used for this verification.
3. Run `npm test` for development checks, or
   `npx playwright test --config=playwright.production.config.ts` to build and
   test the local production server without development compilation delays.
   Both configurations inherit the same isolation guard and controlled-provider
   environment. Fix fixture assumptions against the real isolated database
   without weakening production authorization or content policy. Hosted Auth
   rate limits may require spacing or reusing test sessions; do not raise
   production limits to accommodate tests.
4. Record passes, failures, skips and blocked cases separately. Stored feedback
   changing future selection and unchanged old web/archive/PDF require this real
   Auth/PostgREST run. Offline tests alone cannot establish those criteria.

The account screenshot utility also uses the shared database guard, loads only
test settings, rejects URL overrides, and expects a local app at
`http://localhost:3001`. Start that app with the same isolated environment.

The first six historical migrations were applied individually to the empty
project. The legacy trusted-ingestion and corrective server-only migrations
were then applied together as `trusted_ingestion_with_server_only_reporting`
after connector request-state errors; this avoided leaving the historical
reader-callable helper exposed between those two steps. Production migration
history and saved Editions were untouched.

Google OAuth and deployed reader acceptance remain separate checks.
