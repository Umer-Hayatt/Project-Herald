# Owner-approved 18+ audience — 24 October 2026

The owner explicitly requested “make it above 18” after discussing the Gemini
audience restriction. Herald now targets adults aged 18 and over. This supersedes
the earlier younger-reader direction in PRODUCT and the older specification
snapshot; no new planning or implementation approval is required.

## Implemented scope

- Home and sign-in state the 18+ audience. Google sign-in requires an unchecked
  adult declaration, native form validation and a server-side exact-value check.
- Existing signed-in readers must make the declaration before private paper,
  onboarding, settings and archive pages, or private APIs. Pages redirect to the
  declaration; API requests return 403 with `AGE_CONFIRMATION_REQUIRED`.
- A session-only HttpOnly, SameSite=Lax cookie stores a versioned self-declaration;
  it is Secure in production and clears on successful sign-out. Auth session
  refresh cookies and private/no-store headers survive declaration redirects.
- This is self-declaration, not verified age or identity. No birth date, identity
  document, permanent reader field or new database table is collected. Existing
  authentication and ownership checks continue to protect private data. A reader
  can falsely declare eligibility; the cookie is not proof of an individual's age.
- Public historical samples remain accessible and do not invoke live AI. No saved
  Edition, Story, source, preference or feedback row is rewritten by this change.

## Verification

Initial desktop regressions reproduced the missing sign-in declaration and the
absence of an existing-reader gate. Ten focused desktop/phone checks then passed
(21.2 seconds), covering declarations, private-page/API access, sign-in error
recovery and reader navigation. Further regression assertions bypass native form
validation to exercise both server checks and verify sign-out clears the cookie.
The existing test helper explicitly declares its isolated fixture readers adults;
the new regressions remove that declaration to prove refusal and normal recovery.

The final private isolated build and TypeScript passed after the accessible
44-pixel declaration target adjustment. Lint passed with zero errors. Independent
Standards and Spec reviews found no actionable findings. Final complete suite,
visual inspection and deployment evidence will be recorded in the handoff from
their actual outcomes. No production mutation tests are permitted.

## Gemini remains disabled

The owner changed the audience; this does not by itself establish full compliance,
verified ages or live model usefulness. Gemini's [current terms](https://ai.google.dev/gemini-api/terms)
also address regions and require paid services for EEA/Swiss/UK API clients. Free
quota, audience controls, data-use suitability, model access and useful grounded
behavior still require validation. No billing or public AI flags are enabled by
this change. An optional model-metadata check was blocked by automatic approval
review because it would read the actual existing Gemini key from the protected
original checkout; it did not run. A narrowly scoped owner approval was requested
while the independent 18+ implementation continued.

## Reporting key, in plain language

The reporting key lets Herald's server save newly fetched source articles. Browser
readers keep using the public key; this secret must stay on the server. It is
different from a database password or a news-provider key.

The owner creates a **new secret key** named `herald-reporting` in [production
Supabase API Keys](https://supabase.com/dashboard/project/hnzwraiojsftuncridsp/settings/api-keys).
The private `connect-herald-reporting.cmd` helper opens that page, prompts with
hidden input and stores the secret directly in Vercel. Keep existing keys; do not
paste the new key into chat. No database password or backup details are required.
Interactive key setup and trusted-refresh verification remain incomplete.

## Final publication

Main commit `fb79ca8e9df551039d0db44e202b952292b13278` is deployed READY as
`dpl_3enT78hMVkSuNGaLFUFVHmX1r1kz` at https://project-herald-pink.vercel.app.
Final full isolated suite: 288/288 passed, zero failures/skips,5.9minutes. Four
focused screenshot cases also passed in19.5seconds; desktop/phone login and
existing-reader screens were inspected. Thirty-two read-only production checks
passed,16 per viewport. Actual Google OAuth and authenticated production reader
acceptance are still open. No production mutation tests or schema changes ran.
Final documentation is committed separately on the existing recovery branch.
