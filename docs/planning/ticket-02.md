## Parent

[Specification #1: Herald usable first product release](https://github.com/Umer-Hayatt/Project-Herald/issues/1)

## What to build

Turn verified reporting supply and saved preferences into a finite daily Edition that readers can actually read and revisit that day. Start with honest publisher excerpts; later slices add generated Briefings and discovery while keeping the same preserved-Edition contract.

## Demo

Finish onboarding, receive a real attributed paper, reload in two tabs, and see the same dated content; move the controlled clock to the next local day to receive a new paper.

## Acceptance criteria

- [ ] Completing onboarding requests the first Edition immediately. Select real English-language reporting using interests, freshness and a regional boost while allowing global coverage.
- [ ] Use verified source metadata and available excerpts, with publisher, original URL and publication time. Do not present fixture content or unavailable full-article text as live reporting.
- [ ] Honor all three Reading lengths as upper budgets and show an estimate based on actual text. Document chosen caps; short supply yields a shorter paper without unsupported padding.
- [ ] Retrieve shared reporting through a server-only bounded cache with a refresh lock, request accounting and a verified free-tier daily cap; multiple readers reuse the same suitable supply.
- [ ] Persist the complete ordered Edition content, date, reader, time zone, source attribution/links and selection-version metadata. Return that snapshot on same-day revisits without reranking or re-fetching its content.
- [ ] Concurrent requests across tabs create at most one complete Edition for the reader's local date. An interrupted attempt can retry without duplicate or partially visible Editions.
- [ ] Use stored reader-local calendar boundaries rather than the server's UTC date; verify a midnight transition and a daylight-saving transition with a controlled clock.
- [ ] Original-source links work and Skip moves to the next Story without deleting content or saving dislike. Readers can still revisit skipped content.
- [ ] With no eligible reporting, show an honest empty/unavailable state and Retry; do not save a failed or empty generation attempt as the day's completed paper.
- [ ] Provide a readable responsive Edition screen and generation/error states using replaceable artwork/motion regions. Verify preservation, concurrency and account isolation through behavior tests.

## Blocked by

- [#2: Sign in with Google and save onboarding on the deployed app](https://github.com/Umer-Hayatt/Project-Herald/issues/2)
