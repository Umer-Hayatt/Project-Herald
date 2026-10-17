# Slice 04: Feedback and future settings

## Implementation

- Apply `supabase/migrations/20261017200000_story_feedback.sql` before using feedback in a deployed environment. It creates one private feedback value per reader and stable Story key, with row-level policies tied to the authenticated reader.
- The Edition Story controls save More like this or Less like this. Repeating a choice is safe; choosing the other value replaces it. The selected value is shown again after reload. Skip remains a navigation link and does not call the feedback endpoint.
- Story feedback stores only a hash of its supporting source identities, the explicit value, and validated topic labels. Reader identity and feedback remain in Herald and are not sent to news or AI providers.
- Future selection adds or subtracts 20 points per feedback vote from matching topics, aggregating one active vote per Story and capping each topic at three votes. Positive topics remain out of Beyond Your Bubble; negative topics receive a ranking penalty and are excluded from that section. Completed Editions are returned before feedback or settings are loaded, so their saved contents do not change.
- `/settings` reuses the validated preference form for interests, Preferred region, Reading length, and time zone. It explains that changes apply to a future Edition.

## Verification

- `npm run typecheck` and lint passed locally.
- The controlled ranking test covers More, Less, and neutral Skip behavior on an unchanged candidate set.
- Browser checks are in `tests/feedback-settings.spec.ts`. They require the disposable test readers and a reachable test Supabase project. The current environment could not reach that endpoint, so signed-in persistence, RLS, and reload checks remain unverified here.
- Run `npm run test` after test-service access is available. Apply the migration before deployed feedback smoke testing. No remote migration or deployment was performed for this slice.
