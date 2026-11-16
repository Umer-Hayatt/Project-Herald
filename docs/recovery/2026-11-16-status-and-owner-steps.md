# Herald status and owner steps — 16 November 2026

Start here when resuming. This supersedes older "complete" claims; the detailed
history stays in [the long handoff](2026-10-19-audit-fixes-handoff.md).

Working clone: `E:\Project herald i`, branch `fix/sample-page-and-status-docs`
(one commit ahead of `main` at `87a2708`). **Pushed to GitHub as a branch; not merged and not deployed.**
Pushing to `main` deploys to production, so only do it when the owner says so.

## Plain-language verdict

The code is healthy. The product is not finished against recovery spec #11:
the live site works but has no fresh news, AI is off, and no real person has
been confirmed to sign in and use it end to end. The pilot has not started.

## Checked on 16 November

| Check | Result |
| --- | --- |
| `npm run typecheck`, `npm run lint`, `npm run build` | Pass (lint: 0 errors, 4 known image warnings) |
| `npm run test:offline` | 54 passed |
| `npm run test:reporting-security` | Pass |
| Full browser suite (`npm test`) | **Not run.** Test database "Herald Recovery Test" is paused and this clone has no `.env.test.local` |
| Live site, anonymous: home, sample, sample PDF, login, private-page redirect | Working |
| Live homepage news | **None.** No stored article is inside the 48-hour window |
| Production database (read-only counts) | 148 sources, 25 Editions, 133 Stories, 13 accounts (includes test accounts) |
| Last Edition | 28 Oct: one Story, 168 words, 1 minute of a 5-minute plan |
| News refresh | Timestamps on 28 Oct are consistent with one reader-triggered refresh working. A 2 Nov attempt reserved a call and recorded no success; cause unknown |

## Fixed in this branch (not yet live)

Two low-severity bugs on the public `/sample` page, found on the live site:

1. **React hydration error #418.** The Story card computed "N days ago" in the
   browser, but `/sample` is built once at deploy, so the saved HTML disagreed
   from the next day onward. Sample Stories now show a fixed date ("11 Oct 2022").
2. **Two failed `/api/feedback` requests.** Commit `36ca723` hid the feedback
   buttons for sample Stories but left the fetch running. The fetch is now skipped.

Regression test: `tests/recovery-r07.spec.ts`, case 2b (moves the browser clock
three days ahead). It is in the full suite, which could not run today; the fix
was verified with a local production build and a headless browser, red before
and green after. Run the full suite once the test database is back.

Also corrected: root `README.md` status and `docs/evidence/architecture-overview.md`.

## Later on 16 November: Global Voices photo-credit rule

The branch is pushed to GitHub (the note above is out of date). Nothing is merged or deployed.

The one-request Global Voices check returned 15 feed items, 3 inside 48 hours and 0 accepted.
All three were excluded because a photo caption carried a credit ("Used with permission", a
photo licence). The owner approved a narrow change: a notice inside a caption block that holds
an image no longer excludes the article, because Herald never stores or shows those images or
captions. A notice in the article text, in a quotation, or in a caption block without an image
still excludes it. Regression test: `tests/offline/globalvoices-coverage.spec.ts`, third case,
red before and green after. `npm run test:offline` 55 passed; typecheck and lint pass. The same
live check then accepted 3 articles. Not yet run in the full suite, not merged, not deployed.

Provider keys: the owner holds TheNewsAPI, GNews and NewsData keys. They belong in Vercel as
`THENEWSAPI_TOKEN`, `GNEWS_API_KEY`, `NEWSDATA_API_KEY`. The `*_COMMERCIAL_APPROVED` flags stay
`false` until a provider confirms permitted use in writing.

Honest labels, same day: the homepage "Editor's Choice" badge now reads "Lead story", and every
category stock photo on the homepage and the paper spotlight carries an "Illustrative image" label
(`src/components/illustrative-image-label.tsx`). Test: `tests/offline/honest-labels.spec.ts`; offline
suite 57 passed; build passes. Label placement was checked on desktop and phone with a scratch page
using the real stylesheet, not on a page with real Stories. "Featured Perspective", "Featured
Stories" and "Trending" headings on the homepage were not reviewed.

Vercel Production, read 16 Nov (names only): the three provider keys and both NASA Earth switches
exist; all three `*_COMMERCIAL_APPROVED` flags are `false`; no deploy has happened since they were added.

## Still open (from spec #11)

- Fresh, broad, permitted news supply. Only Global Voices is enabled. NASA Earth
  is built but its production flags are off. TheNewsAPI, GNews and NewsData
  permission is unconfirmed. Three successive daily coverage samples never completed.
- Useful live AI. Gemini is disabled; the one test call returned incomplete output.
- A real Google sign-in and reader journey on the live site.
- Canonical migration baseline (repo has 8 migration files, production ledger has 5 rows). No verified backup.
- The seven-day pilot: price, currency and five readers are undecided.
- Found by reading code, hidden while the homepage is empty: an "Editor's Choice"
  badge (`src/app/page.tsx`) and unlabelled stock-photo fallbacks
  (`src/lib/edition/images.ts`) conflict with the spec's honest-label rule.
- Hackathon extras: no product video link in the repo.

## Owner steps — only you can do these

Never paste passwords or keys into a chat.

### 1. Sign in and walk through the live site (about 10 minutes)

1. Open https://project-herald-pink.vercel.app and click **Create my paper**.
2. Tick **I am 18 or older**, click **Continue with Google**, pick your account.
3. If asked, finish onboarding: interests, region, reading length.
4. On the paper page, note what you see. "No fresh reporting available" is
   expected right now. Click **Retry** once; that is what triggers a news refresh.
5. If Stories appear: open one source link, click **More like this** on one
   Story, and check it says it was saved.
6. Open **Settings**, change the reading length, save.
7. Open **Archive**, open an older Edition, click **Download PDF** and open the file.
8. Click **Sign out**, then sign in again and check your settings were kept.

Write down for each step: worked, failed, or confusing. Bring that list to the next chat.

### 2. Decide the news sources and AI

- **NASA Earth (free, already built):** to switch on, go to Vercel → project
  `project-herald` → Settings → Environment Variables → Production. Add
  `NASA_EARTH_ENABLED` = `true` and `NASA_EARTH_PUBLIC_REPORTING_ENABLED` = `true`,
  then redeploy. It only adds science Stories.
- **TheNewsAPI / GNews / NewsData:** their free plans may not allow a public or
  paid product. A ready-to-send question is in
  [provider-permission-request.md](provider-permission-request.md). Either send
  it, or decide to stay with free licensed sources only. Do not set any
  `*_COMMERCIAL_APPROVED` flag to `true` without a written yes.
- **AI (Gemini):** decide which countries you will launch in and whether you
  accept that the free tier may not be enough. Until then leave it off. Honest
  answer today: Herald works without AI, with shorter papers.

### 3. Choose a price and five pilot readers

Open [pilot-offer-and-costs.md](pilot-offer-and-costs.md) and fill in: the exact
monthly price and currency, what the reader gets, and five real adults with
different interests who agree to try it for seven days. Do this after step 1
works and there is enough news to read; a one-Story paper will not pass a pilot.

### 4. Restore the paused test database

1. Open https://supabase.com/dashboard and choose project **Herald Recovery Test**.
2. Click **Restore project** and wait a few minutes until it shows as active.
3. The file `.env.test.local` (test keys) exists only in the older checkout
   `C:\Users\HP\Documents\Codex\2026-10-18\rev\herald-recovery`. Copy it into
   `E:\Project herald i` yourself; it is git-ignored and must stay private.

Free Supabase projects pause again after about a week without use.

## What an assistant can do next

- Run the full suite after step 4 and confirm case 2b passes there.
- Run the one-request Global Voices coverage check to see whether the feed has eligible articles today.
- Replace the "Editor's Choice" badge and label or remove stock images.
- Push and deploy this branch when the owner approves.
