# Herald slice 01 setup and acceptance
Ticket: https://github.com/Umer-Hayatt/Project-Herald/issues/2
Project moved with Git history to E:/Project Herald. Implementation continues on main.

## Dedicated resources
- Supabase: https://supabase.com/dashboard/project/hnzwraiojsftuncridsp (Herald, Mumbai; organization Umer-Hayatt's Org, verified Free plan).
- Vercel: https://vercel.com/umer-hayatt/project-herald (dedicated project; CLI confirms owner/project).
- Intended production origin: https://project-herald.vercel.app. Verify assigned alias after deployment.
- Existing public repository: https://github.com/Umer-Hayatt/Project-Herald.

## Google sign-in: human configuration
1. Open https://console.cloud.google.com/apis/credentials. Configure OAuth consent/branding, audience and contact email. If external/testing, add the intended Google test accounts.
2. Create OAuth client ID > Web application. Authorized JavaScript origins: the actual Herald production origin, plus http://localhost:3000 for local verification.
3. Authorized redirect URI: https://hnzwraiojsftuncridsp.supabase.co/auth/v1/callback.
4. In https://supabase.com/dashboard/project/hnzwraiojsftuncridsp/auth/providers enable Google and save client ID and client secret there, never in source control.
5. In Supabase Authentication > URL Configuration set Site URL to the actual production origin. Add exact redirect URLs https://project-herald.vercel.app/auth/callback and http://localhost:3000/auth/callback. APP_URL must match the origin in each environment.
6. On the deployed URL, sign in with Google, save preferences, reload, sign out, sign in again and verify saved choices. Repeat as a second reader. Cancellation returns to a recoverable login state.
Official instructions: https://supabase.com/docs/guides/auth/social-login/auth-google.

## Runtime configuration
.env.example lists required keys; .env.local and .env.test.local are ignored.
NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are public client configuration, protected by RLS.
APP_URL is a trusted canonical origin used for OAuth and same-origin preference writes. Set http://localhost:3000 locally, and the production alias in Vercel.
THENEWSAPI_TOKEN, GEMINI_API_KEY and GEMINI_MODEL are server-only. No app route calls a news/AI provider in this slice.
Do not overwrite an existing .env.local using vercel env pull after adding private keys; pull to a separate ignored file and merge only intended keys.

## Provider access: pending credentials and product constraints
Create a free TheNewsAPI account at https://www.thenewsapi.com/register and get the API token from its account dashboard.
Create a Gemini key at https://aistudio.google.com/api-keys using an account/project without paid billing. Check model availability and active limits in AI Studio before setting GEMINI_MODEL.
Put keys in local .env.local, then run npm run check:providers. This sends one bounded English news request and one tiny Gemini generation request; it does not print credentials or request URLs. Results go to docs/evidence/provider-access.json.
A successful response alone does not establish free billing status, deployed-use permission, all supported regions, or quotas; verify account dashboards too. Record those facts alongside runtime evidence.

Official sources checked on 17 October 2026:
- https://www.thenewsapi.com/pricing advertises Free: 100 requests/day, 3 articles/request. https://www.thenewsapi.com/documentation documents the all endpoint, English, general/science/sports/business/health/entertainment/tech/politics/food/travel categories and country locale codes including pk/us/gb/in/ca/au. A locale describes publisher location, not guaranteed event geography. Empty regional supply needs honest handling in later slices.
- Source fields documented: uuid, title, description, keywords, snippet, url, image_url, language, published_at, source, categories, locale. Full article text is not promised. Headlines endpoint is documented as Standard and above; pricing markup and documentation differ, so probe /v1/news/all and establish actual plan entitlement.
- https://ai.google.dev/gemini-api/docs/pricing lists model-specific free access; https://ai.google.dev/gemini-api/docs/rate-limits says actual limits depend on model/project/tier and are visible in AI Studio. Exact usable model and quota remain unverified until actual credentials work.
- BLOCKER: https://ai.google.dev/gemini-api/terms restricts API Clients likely to be accessed by under-18s and requires Paid Services for API Clients offered in EEA, Switzerland or UK. This conflicts with Herald's confirmed broad younger-inclusive audience and unrestricted free-service goal. Do not silently change audience, enable billing or swap provider. Resolve with the product owner before public AI rollout. The account slice can be verified independently.
- Supabase changelog reviewed: https://supabase.com/changelog.md. TLS cipher retirement is irrelevant to Node 24/current browsers; existing deprecated server-framework adapters are not used.

## Tests
npm ci
npm run typecheck
npm run lint
npm run test:account
npm test
npm run build

The approved seam is browser -> authenticated preferences operation -> real Supabase with RLS, plus direct Data API privacy checks. The app has no test login endpoint, date override, password UI, service-role runtime client, or mocked authentication.
For isolated test readers: run node --env-file=.env.local scripts/create-test-readers.mjs once against a dedicated test allocation, verify the two emitted user IDs in Supabase and confirm ONLY those disposable accounts. It writes credentials only to ignored .env.test.local. Do not run against an unrelated project. The test runner loads this ignored file. Google callback remains a separate real-provider smoke step.
Without disposable credentials the persistence/isolation tests explicitly skip; a skipped test is not acceptance evidence.
Tests run desktop Chrome and phone-sized Chromium. Traces and automatic screenshots are disabled to avoid persisting authentication material.
The first public browser test was written before the account implementation; dependency installation prevented executing it before implementation. Strict red-before-green evidence is not claimed for that initial UI pass.

## Slice boundary
Completing onboarding opens an honest paper entry state. Real Editions remain issue #3. Final human-made artwork/motion/finishing remain issue #9.

