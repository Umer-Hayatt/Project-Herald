# Slice 01 verification

Date: 17 October 2026. Account implementation; issue #2 remains open for live setup acceptance.

## Implemented and checked

- Moved repository and Git history to E:/Project Herald; git fsck passes and the old empty source directory was removed.
- Dedicated Herald Supabase project hnzwraiojsftuncridsp in Umer-Hayatt's Org, organization Free plan verified. Ownership migration applied; security/performance advisors returned no findings.
- Next.js16.4.2/TypeScript/Tailwind production builds pass locally and on Vercel.
- Typecheck passes. Lint passes after verification-script cleanup.
- Full browser suite: **14 passed**, desktop and phone-sized Chromium, run against the local production server with real Supabase and two disposable reader accounts. No auth mocks or runtime admin credentials.
- Behaviors: anonymous app/database access denied; saved drafts survive reload; >=1 interest on completion; supported regions and5/10/15 reading-length validation; default10; explicit invalid zone correction; detected-zone fallback; completed paper entry; sign-out protection; cross-origin and forged ownership rejected; second reader cannot read/change/insert/take ownership of preferences.
- Final screenshots: eight loaded surfaces at1440x1000 and390x844, zero horizontal overflow and zero browser page errors. Capture tooling waits for streamed page content before saving. Keyboard skip link checked; native labeled controls and visible focus styles retained.
- Frontend review: scoped **ship** verdict after stronger control boundaries; --control-line #727780 reaches4.13:1 against paper. Final art/motion remains issue#9.
- Code review: separate Standards and Spec passes. Invalid time-zone fallback fixed with observed failing then passing browser regression; duplicated guarded page loading consolidated. See slice-01-review.md.
- npm audit --omit=dev: zero known vulnerabilities. Five high audit entries remain in the development ESLint/fast-glob/micromatch/braces chain; no patched braces release was available. Avoided an unrelated forced downgrade. PostCSS was updated/overridden to8.5.30.
- Initial deployment dpl_G9xwaggrXEKQFM5vSQxEAJ6Vx1gC built READY and was promoted. Public https://project-herald-pink.vercel.app returned200 with Herald content. Authenticated Vercel smoke request to /api/preferences returned the expected unauthenticated app rejection. Final accessibility deployment details recorded below after promotion.
- Optional Vercel protection-scope update was rejected by automatic approval review as a persistent access-control change. No retry or workaround was used. Existing protection settings permit the public production domain; no public-access blocker remains.

## Acceptance still pending

- User is still configuring Google OAuth/consent and provider keys. Production Google sign-in and returning-account callback have not been claimed as verified.
- TheNewsAPI and Gemini actual runtime credentials, selected usable model, quota and account entitlement checks remain pending. Sanitized provider-access.json reports blocked.
- Gemini published terms conflict with the approved younger-inclusive audience and unrestricted free-tier geography. A product/provider decision is required before AI rollout. No provider, audience or billing change was made.
- Local complete account tests use disposable email/password fixtures only as test setup. The deployed product exposes Google sign-in only. Google production smoke remains a separate real-user acceptance step.
- Final frontend art/motion is outside this slice. Real Editions remain slice02.

Source history is committed locally on main; no claim of pushing commits or closing issue#2 is made here.
