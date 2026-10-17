# Slice 07 deployed smoke demonstration outline

**Status:** outline only. No production smoke run is claimed by this document.

## Preconditions

- Deploy the tested commit and apply all migrations, including the slice 07 refresh-lock migration, to the dedicated Herald Supabase project.
- Confirm Google sign-in configuration and the intended live provider access. Keep Gemini off until the documented audience and geography suitability issue is resolved.
- Use two authorized disposable reader accounts. Never record passwords, OAuth tokens, provider keys, or private reader data in the video.
- Note the deployment commit, provider-plan limits, migration state, browser/device and actual date at the start of the evidence record.

## Reader journey

1. Open the production URL in a phone viewport and sign in with Google as a new reader.
2. Complete onboarding, save interests/region/Reading length, and show that the first available Edition has a real date, publisher attribution, source links and a Beyond Your Bubble section or honest shortage note.
3. Open a source link, use Skip, save More like this or Less like this, change Settings for a future Edition, then download the PDF and open the archive. Show the same preserved Edition date and content in the web paper, PDF and archive.
4. Repeat with the second reader and verify the first reader's private Edition, preferences and exports cannot be read by the second.
5. With an operator-controlled provider failure, revisit the first reader. Show the latest saved Edition under its original date and use Retry. With no saved Edition, show the honest unavailable state and Retry.
6. Restore fresh supply and retry. Confirm one new completed Edition for that local date, no partial paper, no duplicate, and no change to the older archived Edition.
7. Repeat key reading, download and keyboard operations on desktop. Check loading, failed-save, generation and download feedback.

## Controlled next-day proof

Use the approved non-production test clock or a controlled disposable database fixture. Change candidate reporting and explicit feedback for the next local date. Show the new selection changes, the prior Edition remains identical, local midnight creates at most one Edition, and the two readers remain isolated. Never add a public production date override.

## Record outcome

Attach date-stamped screenshots or a short capture with secrets and private data excluded. Record each step as pass, fail, blocked or not run. Distinguish live-provider results from controlled tests. Do not mark slice 07 complete while production account access, provider suitability, required deployed flows or privacy checks remain unverified.
