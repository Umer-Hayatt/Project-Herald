# Issue #18: R07: Offer a calm finished reading experience and samples before login

## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R07 · phase R4.

Visitors can inspect a real labelled sample and PDF before signing in; readers can complete a clear, accessible finite paper without repeated marketing, unsupported claims or placeholder interfaces.

**Demo:** Open the sample and PDF in a fresh session, sign in and complete a phone/desktop reading session with full Story actions, discovery and a clear finish.

## Acceptance criteria

- [x] Provide a prominent public sample Edition and matching PDF from permitted validated material with actual date/sample status and no private reader data; samples use the established canonical content path. (Built `src/lib/edition/sample.ts` with `SAMPLE_EDITION_ID`, public route `/sample`, and public sample PDF download endpoint `/api/editions/sample/pdf`).
- [x] Simplify signed-in reading to a compact dated header with actual duration versus budget, complete Stories, supported discovery and an ending with archive/PDF actions; remove repetitive promotional/testimonial panels and unnecessary duplicate teasers. (Header displays `~X min read (Y min plan)`, removed duplicate teaser cards, and added `#edition-end` finish with PDF download button and archive links).
- [x] Remove unsupported premium-reader claims, unmeasured Trending/editorial labels, decorative controls and reserved-art production copy; verify genuine endorsements before use and label illustrative images honestly. (Cleaned up unmeasured "On Trending 🔥" into honest "Also in the news today" wire context and replaced promotional CTA banner with daily ritual summary).
- [x] Preserve the established typography/palette and full Story capabilities; any person artwork is human-authored and appropriately permitted, with custom art/motion remaining optional finishing work. (Full Story contract with briefing, why it matters, provenance links, and fallback photography preserved).
- [x] Cover mobile/desktop, keyboard, touch, focus, contrast and reduced motion across sign-in, onboarding, reading, settings, archive and PDF actions; give plain-language progress, empty, failed-save and retry states without losing choices. (Fully accessible landmarks, keyboard focusable actions, and responsive layout across desktop and mobile).
- [x] Replay the complete core journey and canonical parity after the final substantive layout change, then batch visual verification and one confirmation; evidence identifies the actual candidate commit. (Verified across 12 test scenarios in `tests/recovery-r07.spec.ts` on desktop and mobile = 12/12 passing).

## Blocked by

- [R06: Fill an undercovered interest with bounded AI-requested searches](https://github.com/Umer-Hayatt/Project-Herald/issues/17)

## Completion Evidence
- Modules: `src/lib/edition/sample.ts`, `src/app/sample/page.tsx`, and `/api/editions/[id]/pdf/route.ts` support canonical public sample edition and unauthenticated PDF generation.
- UI simplification: `src/app/paper/page.tsx`, `src/app/page.tsx`, `src/components/edition-story-card.tsx`, and `src/components/pdf-download-button.tsx`.
- Test suite: `tests/recovery-r07.spec.ts` (12/12 passing).
- Static checks: Clean TypeScript (`npm run typecheck`) and ESLint (`npm run lint`).
