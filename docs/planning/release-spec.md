# Herald: usable first product release

**Status:** ready-for-agent. Testing approach approved; combined Briefings/grouping/discovery slice approved on 17 October 2026.
**Tracker:** Umer-Hayatt/Project-Herald (GitHub Issues).
**Deadline:** 17 October 2026, 21:00 Asia/Karachi (16:00 UTC).

## Problem Statement

News that matters to a reader is scattered across publishers. Moving between sites and endless streams makes it hard to finish a useful reading session, understand what happened, or retain a view beyond familiar interests. Readers need one finite daily paper they can read comfortably, follow back to original reporting, download, and revisit.

The builder is a solo beginner using free services. The first release must work on a deployed website with real reporting and persistent reader data. A visual concept or fixture-only demonstration does not satisfy the release.

## Solution

Herald gives each signed-in reader a preserved daily Edition shaped by interests, Preferred region, Reading length, and explicit feedback. English-language Briefings explain what happened and why it matters, within the facts available from attributed Source articles. Duplicate reports appear as one Story. Beyond Your Bubble reserves space for one or two important Stories outside the reader's usual interests.

Readers start with Google sign-in and short onboarding, receive their first Edition immediately, read it on the web, download the same content as a newspaper-inspired PDF, and revisit it in their archive. More like this and Less like this improve future Editions. Skip simply moves past a Story. Preference changes and feedback leave existing Editions intact.

Functional screens ship throughout the build. Final human-authored comic artwork, user-supplied animation direction, and frontend finishing form the last build slice. Stable illustration and motion regions allow this work without rebuilding the reading or account flows.

## User Stories

1. As a visitor, I want Herald to explain its daily-paper promise, so that I understand why to create an account.
2. As a visitor, I want a clear Google sign-in action, so that I can begin without creating another password.
3. As a returning reader, I want to sign in to my existing account, so that my preferences and Editions remain available.
4. As a reader, I want to sign out, so that I can protect my account on a shared device.
5. As a new reader, I want to choose interests from several topic categories, so that my first Edition is relevant.
6. As a new reader, I want to choose my Preferred region, so that relevant local reporting gets extra priority.
7. As a new reader, I want to choose a five-, ten-, or fifteen-minute Reading length, so that my paper fits my time.
8. As a new reader, I want ten minutes selected by default, so that onboarding stays short.
9. As a new reader, I want my choices retained if onboarding is interrupted, so that I can finish without starting again.
10. As a new reader, I want my first Edition after onboarding, so that I can use the product immediately.
11. As a reader, I want a new Edition on my first visit each local day, so that my paper follows my day.
12. As a reader, I want repeated visits to show the same Edition that day, so that the paper stays familiar.
13. As a reader using multiple tabs, I want one complete daily Edition, so that concurrent requests do not produce conflicting papers.
14. As a reader, I want Stories selected using interests, freshness, and feedback, so that my Edition reflects what matters to me.
15. As a reader, I want relevant regional Stories boosted while global Stories remain eligible, so that local preference does not become a geographic restriction.
16. As a reader, I want a finite Edition and an honest reading-time estimate, so that I know when my reading session is complete.
17. As a reader, I want a shorter Edition when suitable reporting is scarce, so that the product does not pad my paper with weak content.
18. As a reader, I want a concise Briefing for each Story, so that I understand what happened without opening every source.
19. As a reader, I want the explanation of why a Story matters grounded in its reporting, so that interpretation does not invent facts.
20. As a reader, I want short source excerpts to produce appropriately short Briefings, so that the product does not pretend to have read unavailable full articles.
21. As a reader, I want publication times and publisher attribution, so that I can judge recency and provenance.
22. As a reader, I want original-reporting links, so that I can read more and verify the Briefing.
23. As a reader, I want several reports of the same event grouped into one Story, so that I do not read duplicates.
24. As a reader, I want supporting-source links on grouped Stories, so that I can explore their reporting.
25. As a reader, I want Beyond Your Bubble to include one or two important Stories outside my usual interests, so that personalization includes discovery.
26. As a reader, I want an explanation of why each Beyond Your Bubble Story deserves attention, so that the choice feels useful.
27. As a reader, I want discovery Stories to differ from my personalized selection, so that the section adds something new.
28. As a reader, I want discovery space preserved as the product learns, so that feedback does not remove opportunities to explore.
29. As a reader, I want More like this, so that related subjects receive greater priority in future Editions.
30. As a reader, I want Less like this, so that related subjects receive less priority in future Editions.
31. As a reader, I want Skip to move past a Story, so that navigation does not accidentally express dislike.
32. As a reader, I want feedback confirmation and a recoverable failure message, so that I know whether my preference was saved.
33. As a reader, I want current Edition content preserved after feedback, so that my paper remains consistent.
34. As a reader, I want to edit interests, Preferred region, and Reading length, so that future Editions follow changing needs.
35. As a reader, I want settings to state when changes take effect, so that I understand why today's Edition stays the same.
36. As a reader, I want my previous Editions listed by their actual dates, so that I can find earlier papers.
37. As a reader, I want archived Editions to retain their original Stories and Briefings, so that later provider updates do not rewrite history.
38. As a reader, I want a downloadable newspaper-inspired PDF, so that I can keep or read my Edition away from the website.
39. As a reader, I want the PDF to match the web Edition's date, sections, Story order, text, and sources, so that both represent the same paper.
40. As a reader, I want PDF download available for archived Editions, so that I can retrieve a previous paper.
41. As a reader, I want publisher excerpts and source links when AI is unavailable, so that a generation problem does not prevent useful reading.
42. As a returning reader, I want my latest saved Edition shown under its actual date when retrieval fails, so that I can still read without mistaking it for fresh news.
43. As a reader without a saved Edition, I want an honest empty or unavailable state with Retry, so that I understand what to do next.
44. As a reader, I want visible progress, error, and empty states, so that I am not left facing a blank screen.
45. As a reader, I want comfortable phone and desktop screens, so that every essential task works on my device.
46. As a keyboard or reduced-motion user, I want accessible controls and stable reading surfaces, so that decoration does not prevent access.
47. As a reader, I want my preferences, feedback, and Editions kept private, so that other accounts cannot read or change them.
48. As a reader, I want my identity and personalization scores kept inside Herald, so that external briefing generation only receives needed reporting.
49. As the solo builder, I want bounded provider usage and reusable reporting supply, so that the deployed product operates within verified free access.
50. As the solo builder, I want public project history, architecture documentation, and a product video of at most five minutes, so that I can submit the working product with evidence.
51. As the builder, I want replaceable artwork and motion areas, so that final visual finishing does not delay working core screens.

## Implementation Decisions

### Confirmed decisions retained

- Use Next.js, TypeScript, Tailwind CSS, Supabase, and Vercel. Google sign-in uses Supabase. Use a dedicated Herald project allocation; unrelated inactive projects are not implicitly approved for reuse.
- TheNewsAPI free is the first news-supply candidate. Gemini with verified free-tier API access is selected for source-grounded Briefings and topic labels. Exact model, keys, quota, available fields, and production suitability require live verification during the first build slice. Prior pricing findings are context, not verified runtime access.
- Launch with English-language reporting across several topic categories and a selected set of publishers. Retrieval must work across the chosen region policy; validate actual supported regions rather than advertising unavailable coverage.
- Generate on the first visit each local day. Preserve one complete Edition across web, PDF, and archive. Preference changes and feedback apply to future Editions.
- Rank using interests, freshness, and feedback, with regional preference as a boost. Explicit More like this and Less like this are the strongest learning signals. Skip is navigation with no negative-learning effect.
- Group Source articles covering the same event. Beyond Your Bubble contains one or two distinct, important Stories outside usual interests, considering impact, freshness, and reliable reporting, with a relevance explanation.
- If AI fails, retain useful publisher excerpts and links. If fresh retrieval fails, offer the latest saved Edition dated accurately and Retry; existing Editions remain readable.
- Herald is the working name. Preserve the lilac/slate/orange direction, expressive landing/login surfaces, and calm editorial reading. No individual generated mockup composition or researched artist is approved as the final design. Final person art must be human-authored, expressive comic illustration. The user will provide animation references later.
- Use the user-selected public repository, Umer-Hayatt/Project-Herald. Inspection before planning publication verified its existence and found no app code, commits, or issues. Use meaningful regular commits during the future build and record actual development history accurately.

### Proposed engineering defaults for this release

These implement the confirmed behavior; they are not claims that the interview selected exact algorithms or schema.

- Keep one application deployment and one database. Use a server-side Edition operation as the main orchestration boundary: authenticate the reader, determine the Edition day, return an existing Edition or create and atomically preserve a new one. Web, archive, and PDF read this same preserved representation.
- Store reader preferences and an IANA time zone; infer the zone from the browser during onboarding and use Asia/Karachi only as a visible fallback if detection fails. Store each Edition's local date and zone. Use the stored reader zone across devices; a later zone change cannot relabel an existing Edition. Test midnight and daylight-saving transitions. No automatic geolocation is needed.
- Persist Source articles with provider identity, canonical URL, publisher, publication/retrieval times, and available text. Persist grouped Stories, topic labels, Briefing provenance/fallback state, and supporting-source relationships. Preserve ordered Edition items with their displayed text, sources, discovery explanations, date, and preference/selection version so later provider or model edits cannot mutate them.
- Enforce reader ownership for preferences, feedback, Editions, and PDFs. Shared public reporting supply contains no reader identity. Validate account ownership on every server operation and with database access policies; browser knowledge of an identifier is not access permission.
- Use a uniqueness rule for reader plus Edition local date and a bounded generation claim to coalesce concurrent creation. Publish complete Edition items atomically. Retry an interrupted attempt safely; never expose a half-written paper or create a second completed Edition for the same day.
- Cache shared reporting and generated Story Briefings rather than calling providers per reader. Provisional retrieval cache lifetime: 60 minutes, with a bounded refresh lock and a daily request budget below the verified account limit. Derive actual caps from live access, count retries as usage, and stop before exhausting quota. No paid fallback or background scheduler is required.
- Provisional freshness window: reporting published within the last 48 hours; publication times remain visible. Do not rebrand old cache as newly retrieved reporting. If no eligible fresh supply is available, use the confirmed saved-Edition/Retry behavior. Use actual content depth to set briefing length.
- Treat source content as data. The AI returns validated topic labels and grounded text linked to known source identifiers. Reject invented source links, invalid output, unsupported numeric claims, and output not supportable by available material. Use excerpts on failure. Do not request or expose reader identifiers, preferences, or ranking scores to the AI.
- Start duplicate grouping with canonical URL plus conservative event matching using headline, time, entities, and available text. Do not merge distinct developments merely because they share a topic. Uncertain matches remain separate pending evidence. A frozen multi-source example must demonstrate successful grouping.
- Use a small declared topic catalogue and available geographic metadata. Choose transparent, deterministic ranking weights during the build and demonstrate their effects with controlled candidates. Explicit subject feedback must cause an observable larger future ranking change than Skip, which has zero effect. Keep weights and tie-breaking documented with the release evidence.
- Treat Reading length as an upper budget, not a promise to fill time. Provisional estimate: 200 rendered words/minute, total budgets of 1,000/2,000/3,000 words, and maximum 4/8/12 personalized Stories for five/ten/fifteen minutes. Reserve up to two extra Story positions within the total word budget for discovery. Actual estimates reflect all rendered Briefings and explanations. Thin supply results in shorter papers, never expanded unsupported text.
- Select one discovery Story when at least one eligible candidate exists; select a second when it is distinct and fits the budget. Use a small documented public-importance rule based on supported public impact, recency, and attributed publisher evidence. A topic outside explicit interests and positively learned interests is eligible. If no supported outside-interest candidate exists, explain the shortage without inventing, repeating, or relabeling a personalized Story. Reserve the section for later eligible supply rather than silently removing discovery from the policy.
- Store at most one active explicit feedback value per reader and Story. Repeating the same action is idempotent; changing the choice replaces its learning contribution. Explain that saved feedback affects future Editions. Skip changes the current reading position only; it does not remove content from the preserved Edition or PDF.
- Provide real PDF download from the saved Edition, with a masthead, date, clear sections, newspaper-like columns where readable, working source hyperlinks, and page breaks that preserve legibility. PDF retrieval performs no live news or AI regeneration. Functional newspaper PDF layout ships before final web artwork finishing.
- Every slice includes responsive, labeled controls, keyboard access, relevant loading/empty/error states, and a demonstrable persisted outcome. Illustration/motion containers have stable layout boundaries and neutral placeholders until the last build slice. Signup and reading remain usable without decoration or animation.
- Human-only setup work, such as obtaining keys or completing Google consent settings, is surfaced in the first build slice with precise instructions. Never put secrets in public code, issues, logs, or the demonstration. A coding-assistant subscription is not evidence of deployed-app API entitlement.

## Testing Decisions

**Proposed seam for user review:** one primary behavior boundary: a reader uses Herald through the browser and its authenticated Edition operations against a test database. Substitute only news supply, AI responses, and the clock. This exercises the entire persisted flow while avoiding live-provider instability. Test isolation with separate reader sessions and real database access policies.

- Good tests assert externally observable behavior: what the reader can access, what an Edition contains, what survives reload, and what a later day changes. Avoid assertions about component trees, private functions, prompts verbatim, implementation filenames, or ranking internals.
- Test account/onboarding persistence, one-Edition-per-local-day behavior, atomic concurrent creation and interrupted retry, actual dates in fallback, and isolation between two readers.
- Use fixed reporting candidates to prove interests/region affect selection, grouping removes duplicate events, one or two outside-interest Stories appear with explanations, and unchanged candidates are ordered differently after explicit feedback on a later day. Confirm Skip has no learning effect and current/archived Editions stay identical.
- Simulate short excerpts, malformed AI output, AI timeouts, provider timeouts, empty fresh supply, quota exhaustion, cache refresh contention, and database failures. Check meaningful fallback or retry behavior; do not record empty failure as a successful daily Edition.
- Compare saved Edition identity, date, section membership, Story order, displayed text, explanations, attribution, and source URLs across web, archive, and extracted PDF text/links. Render representative short and long PDFs to catch clipping and pagination problems. Matching content does not require identical web/PDF visual layout or byte-identical PDF exports.
- Manually review a small grounded sample against its actual supplied reporting. Automated output validation is not proof that all generated claims are correct. Test malicious source instructions as untrusted reporting content.
- Use one real deployed smoke journey to verify production Google callback, onboarding, live reporting, live selected Gemini access, saved Edition, feedback, settings, PDF, and archive. Verify next-day behavior with the controlled test clock, never a public date override. A local fixture-only pass does not establish release readiness.
- No test suite or existing seam exists in the empty repository; there is no prior art to reuse. Prefer a small browser/integration suite over separate test frameworks per module. Add lower-level tests only where an invariant is materially clearer there.
- Final visual checks cover phone/desktop, keyboard use, contrast, reduced motion, and replacement of illustration/motion without changing preserved content or authentication behavior.

## Out of Scope

- App implementation during this specification/ticket session.
- Restarting product discovery, choosing a new stack, or researching artwork now.
- Paid services, automatic paid upgrades, subscriptions, billing, advertising, or purchases of final artwork.
- Infinite scrolling, social feeds, comments, sharing systems, notifications, email delivery, native apps, password login, and editorial administration tools.
- Full-article scraping, bypassing publisher access controls, claiming unlimited full-text access, or padding Briefings beyond the material supplied.
- Continuous current-day regeneration, retroactive feedback changes to Editions, and rewriting archive content with the latest AI output.
- Training a recommendation model, vector infrastructure, multi-service orchestration, and complex background scheduling.
- Name/domain/trademark clearance or a custom domain as a release prerequisite.
- Adopting rejected AI-generated figures, unapproved artist examples, or claiming a particular mockup composition was selected.

## Further Notes

### Source of decisions and present state

The previous workspace's handoff, Product, Glossary, full decision record, design brief, and both pages of the original NaSCon problem statement have been read. Interview decisions are preserved; numeric engineering defaults above remain proposals. No application, database project, OAuth configuration, API key, deployment, or runtime integration is created or verified by writing this specification.

The brief requires a public repository, a Loom video of the product no longer than five minutes, and an architecture diagram. The public repository already exists. Keep regular meaningful implementation commits. Prepare the architecture and demonstration outline before the final art slice; record the final video from the finished deployed product afterwards. Keep submission materials accurate about any remaining limitations.

### Deadline and delivery policy

Initial clock check: 17 October 2026, 12:27:53 Asia/Karachi, leaving 8 hours 32 minutes 7 seconds until the stated deadline. Recheck before publishing a schedule or starting implementation. This is an aggressive target for a solo beginner with unverified runtime access; estimates cannot establish feasibility.

Complete account/provider access first, then real preserved Editions, grounded Stories and discovery, future personalization, archive/PDF, resilience and submission preparation, and finally artwork/motion/finishing. Work only the dependency frontier. An open API/OAuth/free-plan blocker requires an explicit status report and replanning; it does not authorize silently replacing the product with mock data or dropping a confirmed release requirement. Animation references and final human-made art gate only the last build slice.

### Release acceptance

A new reader on the deployed URL can sign in with Google, save onboarding, read a real dated Edition with grounded content and discovery, follow source links, Skip, save explicit feedback, change future preferences, download the matching newspaper-inspired PDF, and revisit preserved Editions. A controlled next-day verification proves feedback changes selection while previous Editions remain stable. Failure paths are usable, private records are isolated, the final design respects the artwork/motion decisions, and the public repository, architecture diagram, and final video are ready for the user to submit.
