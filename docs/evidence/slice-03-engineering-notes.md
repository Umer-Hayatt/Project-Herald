# Slice 03 engineering notes

## Story identity and grouping

Source URLs are normalized to HTTP(S), lower-case hosts without `www`, no fragments, and without common campaign/tracking parameters. Query parameters are sorted. Reports group when those canonical URLs match, or when publication times are within 36 hours, normalized titles share at least three non-generic terms and at least half of their combined distinct terms, and the reports also share a named entity or at least two specific body-text terms. Every member of a title-based group must match the new report; this avoids chaining a broad-topic match into a larger event. Invalid dates and uncertain matches remain separate. The chosen representative is the report with the longest supplied excerpt, with newest publication time breaking ties. All sources remain attached to the Edition Story.

## Briefings and shared processing

The server sends only source IDs, publisher names, titles, descriptions, and snippets to the configured Gemini model. It does not send reader identity, interests, feedback, or ranking data. Reporting text is marked as untrusted input. Output must match a strict JSON schema, use known topic labels supported by source categories or source text, cite only the group's source IDs, and pass a conservative word-overlap grounding check sentence by sentence. These checks catch many unsupported outputs but are not proof of factual correctness. Unusable output, timeout, missing configuration, or provider failure falls back to one clearly labelled publisher excerpt or headline with its source links.

Reusable processing is keyed by a SHA-256 hash of the ordered source identity and available text, so readers with the same grouped reports can reuse the same result. Cache entries contain no reader data. The immutable Edition Story snapshot stores the briefing, explanation, topics, provenance, section, and supporting source links. Existing Editions are only read and are not regenerated.

## Beyond Your Bubble policy

Up to two Stories without overlap with explicit or positively learned topics are reserved from the shared story and word budget. A discovery Story needs a source-grounded `why_it_matters` explanation; if Gemini cannot provide one, its excerpt can still appear in the main paper, and the discovery section explains why it is unavailable. Discovery ordering uses visible evidence from the supplied reports: public-impact marker terms in the reporting text, the count of distinct named publishers, then recency. These are simple first-release selection signals, not a verified or objective importance score. Distinct grouped identity prevents an event from appearing in both sections.

The edition selector accepts positively learned topics as a separate input for the next feedback slice to wire up. No feedback UI or learning store existed when slice 03 began.

## Acceptance still requiring live evidence

- Review a real generated sample against its original reporting; automated lexical checks cannot establish semantic grounding.
- Verify the deployed app after applying the migration and configuring the verified provider credentials.
- Gemini's terms/access suitability for Herald's broad younger-inclusive consumer audience and free-service geography remains unresolved in `docs/setup/slice-01.md`; the public Briefings flag stays off until the product/provider decision is resolved.
- Controlled privacy, discovery, provider-failure, responsive, and preservation tests were not run during this implementation. The controlled grouping and topic-validation examples below cover only representative cases.

## Validation run

- `npm run typecheck` passed.
- The two edition-selection regression tests pass on desktop. They cover two discovery positions beyond the personalized story-count cap and include the rendered importance explanation in stored word totals.
- Three additional desktop regression tests pass for a frozen multi-publisher grouping example, time/text disagreement leaving similar headlines separate, and rejection of a generated topic label unsupported by the source.
- `tests/edition-ranking.spec.ts` passed on desktop and phone.
- `tests/edition-browser.spec.ts` passed on desktop with the configured test backend. The phone journey reached the generation error state.
- `tests/edition-service.spec.ts` passed its reader-isolation check, but the generation/preservation check returned `SERVER_ERROR`. The test backend does not yet have this slice's migration, which adds `editions.discovery_note` and the preserved Story Briefing fields.
- The full Playwright suite ran 48 cases: 20 passed and 28 failed. Most failures came from backend reachability before network access was enabled; rerunning focused Edition cases with network access narrowed the remaining blocker to the unapplied schema migration. PDF validation also needs Python available on PATH; PDF changes are outside this slice.
- No remote migration was applied, and no real Gemini sample was reviewed. Gemini remains disabled until its terms/access suitability is resolved.
