# Specification: Herald recovery to a reliable, valuable daily paper

**Status:** ready-for-agent; testing boundary confirmed by the product owner on 18 October 2026.
**Revision:** 2 — incorporates the owner's approved multi-source reporting and AI-editor recommendations on 18 October 2026. The previously approved testing boundary remains unchanged.
**Tracker:** Umer-Hayatt/Project-Herald, GitHub Issues.
**Published specification:** https://github.com/Umer-Hayatt/Project-Herald/issues/11.
**Baseline:** main commit `3e8e437735d3258e5e342c7d1f738a30e8d99f9c` and the end-to-end retrospective of 18 October 2026.
**Delivery model:** repair and verify the existing product in five gated phases; retain one deployment and one database. No new delivery deadline is assumed.

## Problem Statement

Readers want one finite daily paper that helps them understand news relevant to them, discover something important outside their interests, and finish with useful knowledge. They need credible reporting, clear explanations, convenient reading, a matching newspaper-style PDF, and a product that improves as they use it.

Herald has much of the required foundation, but its actual output does not consistently meet that promise. The review found weak and sometimes unusable Source articles, thin Editions, limited evidence of meaningful personalization, incomplete lead-Story controls, a PDF content omission, misleading presentation labels, and a shared-reporting write boundary that needs correction. Late interface changes were not covered by the preserved passing test evidence. A reader can encounter a polished news portal without receiving enough useful reading to justify returning or paying.

The builder also needs a manageable recovery process. The previous 51-story, 91-criterion release plan encouraged broad implementation before establishing content quality and user value. Recovery must reuse the working foundation, remove unnecessary presentation, resolve the highest-impact defects first, and measure usefulness before expanding scope.

The current narrow candidate pool also limits personalization and variety. Readers need enough distinct reporting about their actual subjects and regions for selection to be meaningful. Adding APIs helps only when they contribute useful complementary coverage; multiple copies of the same articles, a publisher-country filter mistaken for event relevance, or extra headlines without substantive text do not solve the problem.

## Solution

Deliver Herald as a dependable personal daily paper: trustworthy Source articles become concise, source-grounded Briefings; each reader receives a finite preserved Edition shaped by interests and explicit feedback; Beyond Your Bubble adds distinct, justified discovery. The website, PDF and archive display the same saved reading content. Every Story, including the lead, supports attribution, sources, Skip and explicit feedback.

Make value inspectable before sign-in through a clearly labelled sample Edition and matching sample PDF. Keep Google account persistence, short onboarding, Reading length and Preferred region, while advertising only coverage the supply can actually support. Simplify the paper around reading and finishing. Preserve Herald's editorial typography and established palette, and remove unsupported endorsements, fake interactive decoration and unsubstantiated editorial/popularity claims.

Make complementary reporting sources and a bounded AI editor explicit capabilities of recovery. Compare two candidate providers against the existing supply before selecting integrations. Normalize permitted reporting into a shared pool, validate quality, group reports into distinct events, create a reader-specific shortlist, and let AI select a balanced Edition and produce grounded Briefings. Use limited targeted searches to fill demonstrated coverage gaps. Retain deterministic selection as a reliable fallback; do not send the entire pool to AI separately for every reader.

**Intended pipeline:** permitted providers → shared normalized Source articles → quality checks and event grouping → reader-specific candidates → validated AI selection and Briefings → preserved Edition → matching web, archive and PDF.

Completion has two distinct gates:

1. **Product-ready:** the deployed product satisfies its documented content, learning, accessibility, reliability and privacy contracts with current evidence.
2. **Commercially promising:** target readers repeatedly find it useful and provide credible willingness-to-pay evidence at an explicit proposed price, with a feasible operating-cost estimate. Engineering completion alone cannot satisfy this gate. Early pilot evidence is directional, not proof of product-market fit or guaranteed sales.

Use the existing broad English-language reader direction. The first pilot should recruit time-poor English-language news readers with contrasting interests; this is a validation cohort, not a new age restriction, an invented customer base or a claim that all reader segments have been validated.

## User Stories

These stories describe coverage of the recovered product, not 50 separate build tickets. Implement them through the five phases and release gates below.

1. As a visitor, I want a clear explanation of the useful outcome Herald provides, so that I can decide whether a daily paper fits my needs.
2. As a visitor, I want to read a clearly labelled sample Edition before signing in, so that I can judge the reading experience without committing an account.
3. As a visitor, I want to open the matching sample PDF, so that I can see what I would receive offline.
4. As a new or returning reader, I want dependable Google sign-in, sign-out and saved account state, so that I can use my paper across sessions.
5. As a new reader, I want short interest-based onboarding with sensible defaults, so that I reach my first useful Edition quickly.
6. As a reader, I want my detected time zone handled in familiar language, so that setting up a daily paper does not require technical knowledge.
7. As a reader, I want Source articles to be substantive reporting rather than comment feeds, generic pages or empty cards, so that each Story is worth my attention.
8. As a reader, I want accurate publication dates and clear publisher provenance, so that I can judge freshness and trust.
9. As a reader, I want different reports of one event grouped conservatively, so that my finite paper does not repeat the same event or merge unrelated developments.
10. As a reader, I want a self-contained Briefing grounded in available reporting, so that I understand what happened without opening every source.
11. As a reader, I want an evidence-specific explanation of why a Story matters, so that Herald adds understanding rather than generic claims of importance.
12. As a reader, I want original and supporting-source links on every Story, so that I can verify or explore its reporting.
13. As a reader, I want Stories selected meaningfully for my interests and optional subtopics, so that my Edition differs usefully from a reader with different interests.
14. As a reader, I want Preferred region to distinguish publisher location from the places or people reporting concerns, so that local relevance is honest rather than implied by an unsupported field.
15. As a reader, I want Reading length to communicate my chosen budget and the actual available reading duration, so that I know what the current Edition delivers.
16. As a reader, I want a clear explanation when coverage is limited, so that a short Edition does not masquerade as a full ten-minute paper.
17. As a reader, I want Beyond Your Bubble to contain distinct outside-interest Stories with supported reasons to read them, so that discovery adds value.
18. As a reader, I want an honest discovery shortage when suitable reporting is unavailable, so that Herald does not manufacture importance or pad the section.
19. As a reader, I want More like this on the lead Story and every other Story, so that the content I actually read can teach Herald about my interests.
20. As a reader, I want Less like this to reduce future preference for a subject, so that negative feedback never accidentally promotes it.
21. As a reader, I want Skip to move through the paper without recording dislike, so that navigation and learning remain distinct.
22. As a reader, I want feedback to persist and changes to replace my earlier choice, so that retries and repeated taps do not multiply its influence.
23. As a reader, I want feedback confirmation and a retryable failure, so that I know whether Herald saved my choice.
24. As a reader, I want future Editions to reflect saved feedback while existing Editions stay unchanged, so that the product learns without rewriting my paper.
25. As a reader, I want settings to preserve my interests, Preferred region and Reading length and explain when changes apply, so that my future paper follows my choices.
26. As a reader, I want one complete Edition per local day even with multiple tabs or retries, so that I do not receive conflicting or half-written papers.
27. As a reader, I want an archive of previous Editions under their real dates, so that I can return to the same reading content later.
28. As a reader, I want PDF and web content to match, including separate importance explanations and supporting sources, so that both formats represent the same Edition.
29. As a reader, I want the PDF to have a recognizable, legible newspaper composition, so that exporting feels like a finished product rather than a text dump.
30. As a reader, I want old Editions and PDFs to remain available during provider failures, so that my saved papers do not depend on today's integrations.
31. As a phone, keyboard or reduced-motion reader, I want every essential task to remain accessible, so that presentation does not obstruct reading.
32. As a reader, I want a calm sequence of complete Stories and a clear finish, so that repeated teasers, marketing and decorative controls do not consume my attention.
33. As a reader, I want honest image captions, curation labels and customer claims, so that I can trust what the interface implies.
34. As a reader, I want usable loading, empty, failed-save, download and retry states, so that I can recover without losing my choices.
35. As a reader, I want a saved fallback Edition labelled with its original date, so that I never mistake old reporting for today's paper.
36. As a reader, I want my preferences, feedback, Editions and exports restricted to my account, so that another reader cannot access or alter them.
37. As a reader, I want shared reporting to be written only by trusted ingestion, so that public clients cannot poison the content used to build my paper.
38. As the operator, I want to reject or quarantine unsuitable candidates without silently rewriting completed Editions, so that future papers improve while stored history stays truthful.
39. As the operator, I want verified provider permissions, bounded usage and visible failure evidence, so that the product can run dependably within its declared service limits.
40. As the builder, I want a reproducible two-reader and next-day demonstration, so that personalization, learning and preservation can be assessed directly.
41. As a pilot participant, I want to try the real product over several days and describe its usefulness, so that development follows actual reading needs.
42. As a prospective customer, I want an explicit proposed price and a clear statement of what it covers, so that willingness-to-pay feedback refers to a concrete offer.
43. As the builder, I want operating costs and pilot limits matched to that offer, so that positive price feedback does not conceal an unsustainable product.
44. As the builder, I want current deployed acceptance evidence, a readable architecture diagram and a concise product walkthrough, so that a release claim describes the version people can actually use.
45. As a reader, I want complementary reporting sources to fill gaps in my countries and subjects, so that more provider requests translate into useful variety rather than duplicate cards.
46. As a reader, I want to optionally identify specific subjects or entities within my interests, so that Herald can distinguish AI startups or semiconductors from technology in general.
47. As a returning reader, I want unchanged events already included in recent Editions to receive less priority, so that each new paper offers fresh understanding.
48. As a returning reader, I want important new developments in an ongoing event to remain eligible, so that reducing repetition does not hide meaningful updates.
49. As a reader with an undercovered interest, I want the AI editor to request a limited relevant search when permitted, so that my paper can improve beyond the initial general-news pool.
50. As a reader, I want AI choices to be validated and a truthful fallback when AI or a provider fails, so that useful selection does not depend on unbounded or invented model output.

## Implementation Decisions

### Preserve the working foundation

- Keep Next.js, TypeScript, Tailwind CSS, Supabase, Vercel and Google sign-in. Repair the existing system instead of rebuilding it or adding a separate recommendation service.
- Reuse the existing daily Edition orchestration, reporting supply, grouping, story processing, ranking, saved snapshot, feedback, archive and PDF boundaries. The main behavior boundary remains the authenticated daily Edition operation and the reader's browser journey.
- Preserve the meaning of Edition, Story, Source article, Briefing, Beyond Your Bubble, Preferred region, Reading length, More like this, Less like this and Skip from the project Glossary.
- The expired 17 October hackathon deadline and its dependency sequence do not govern recovery. The five phases below supersede that schedule for this work. Original issues remain historical; publication of this spec does not close or reclassify them.

### Trustworthy supply before broader promises

- Route all live public previews, samples and newly generated Editions through the same reporting-eligibility policy. The homepage must not select raw newest records around that policy.
- Accept a candidate only when it has a useful article-specific title, valid original-reporting URL, identifiable publisher, credible publication time, supported language and enough authorized source text for a meaningful Briefing. Reject generic site titles, comment feeds, feed/index pages presented as articles, empty media wrappers, malformed dates and duplicate canonical pages. Short text is not permission to invent details.
- Store the eligibility result and a bounded reason for rejection/quarantine with the source identity and retrieval provenance. Keep rejected records out of public previews and future selection. Retain originals for diagnosis only as allowed by the provider; do not build an editorial-admin interface merely to support this.
- Audit existing shared supply and refresh it through trusted ingestion. Exclude invalid candidates from future generation. Preserve completed Editions; a necessary exceptional withdrawal of unsafe content must be explicit and auditable, not a silent replacement by newer text.
- Keep TheNewsAPI as an existing adapter and comparison baseline, without assuming its current plan, content depth, rights or quotas are sufficient. Evaluate two additional candidate providers before choosing the production combination. Retain a source only if it adds demonstrated useful coverage or reliability and permits Herald's actual use. Do not silently enable paid services or claim full-article access.
- Gemini stays disabled unless current access, audience suitability and allowed deployment use are resolved. A configured key or successful tiny response is not release evidence. Source-grounded publisher text is acceptable when genuinely useful; excerpt-only mode cannot pass a content gate on empty or superficial output. New runtime providers remain an implementation decision requiring verified suitability and any necessary owner authorization.
- Report supported interests and regional coverage from observed supply. Broad age-inclusive access remains the product direction. Do not silently narrow the audience to solve provider restrictions.
- Proposed supported-interest gate: on three successive daily live samples, each advertised interest must have at least three eligible distinct relevant Stories drawn from at least two publishers. Missing coverage is a failed coverage gate, not a reason to fabricate results. Record the sample dates and exceptions. Existing saved preferences remain intact if new selection options must be temporarily marked unavailable.
- Preferred region must identify the meaning of its signal. Publisher location must not be presented as confirmed event location. When regional evidence is absent, explain limited regional coverage and use the declared global fallback rather than pretending a preference was fulfilled.

### Complementary providers and a shared reporting pool

- Evaluate two candidates from GNews, NewsData.io, Currents and Mediastack against the existing adapter before integrating all four. These are candidates, not approved production dependencies. Start with allowed evaluation access and record the permission for each environment. Production, public samples, customer-facing AI Briefings, PDF export and persisted archives must each fit the selected provider's actual permissions.
- Compare matched topic, country, language and time-window queries, accounting for each provider's delay. Record useful unique events added, new publishers, coverage of missing subjects/regions, source-text depth, article freshness, duplicate rate, error behavior, requests/credits consumed and expected operating cost. Retain a second integration only when it fills a real gap or provides a useful tested fallback; more API keys or a larger raw record count are not acceptance criteria.
- Record the final provider combination and its measured benefit before R1 closes. Support multiple adapters through the existing reporting-supply boundary, but do not require every candidate to become a production integration. A single-source outcome needs explicit evidence that alternatives added no useful permitted coverage; do not quietly revert to the old 15-candidate constraint and declare the multi-source evaluation complete.
- Normalize provider article identity, canonical URL, title, publisher, publication/retrieval times, language, source text, topics, original links and provider provenance. Retain provider country metadata separately from evidence-supported places discussed in the article. Unknown event geography remains unknown. Use keyword/entity queries and source-supported location analysis to complement country filters, while retaining important global reporting.
- Attach environment/usage eligibility and content-retention constraints to the source lineage. Non-commercial evaluation material must not leak into a commercial Edition, public sample, Briefing or PDF through the shared cache. A multi-source Story and its Briefing must use only sources permitted for that output; mixed-provider grouping does not erase source restrictions.
- Build and cache a shared eligible pool across readers using the existing refresh/coalescing boundary. Plan retrieval around actual aggregate coverage gaps in supported interests and regions. Avoid one full provider-fetch cycle per reader. Request budgets, cache lifetimes and pool size must follow measured coverage needs and verified limits, rather than retaining the old hard-coded 15-candidate or three-refresh assumptions.
- Remove exact duplicate URLs before conservative event grouping. Group independent reports of the same event with provenance, and preserve materially different developments as distinct updates or clearly identified continuing coverage. Grouping by broad topic alone is insufficient. Multiple outlets repeating one wire report should not be treated as many independent perspectives.
- Track recent inclusion using the last seven completed Editions as a proposed bounded default. An unchanged event already delivered is down-ranked; supported material developments can qualify with an update explanation. Inclusion is not proof that the reader read a Story, and Skip remains neutral. Preserve each archived Edition and avoid rewriting feedback identity when provider IDs differ.
- Use actual useful unique coverage to size the pool and shortlists. Example volumes such as 500 articles, 200 events and 30 reader candidates are illustrations only. They are not verified entitlements, performance results or mandatory scale targets for a solo recovery build.

### An AI editor with bounded selection and search

- Keep broad-interest onboarding short. Offer optional editable subtopic/entity preferences so a reader can express subjects such as AI startups within technology. Broad selections remain sufficient to start. Store explicit choices separately from inferred topic cues; changing feedback must not silently rewrite a declared preference. Avoid inferring sensitive personal traits from reading behavior.
- Enrich and group shared reporting once where possible. A transparent deterministic first pass uses interests/subtopics, supported regional evidence, freshness, stored feedback, source quality and recent inclusion to form a bounded candidate shortlist. AI then chooses eligible Story identities, order, section placement and grounded selection reasons, balancing relevance, freshness, source/event diversity, Reading length and Beyond Your Bubble. No single publisher or repeating event should crowd out equally suitable distinct reporting without a documented reason.
- **Explicit privacy revision:** the earlier source-only AI-input restriction is extended for personalized selection. An enabled compatible model may receive a minimal request-scoped brief containing user-chosen topics/subtopics, coarse Preferred region and bounded subject preference cues. Account identifiers, email, exact location, raw feedback/reading histories and numeric personalization scores remain inside Herald. Shared source enrichment still receives reporting only. Do not introduce stable reader identifiers in model requests; log no preference-bearing prompts by default.
- Give the model responsibility for relevance and evidence-based editorial selection, not unrestricted network access. A model can propose a structured targeted search using approved provider operations and allowed topic/entity, country/language and date filters. The server validates the request, chooses a permitted adapter, executes it under budget and returns eligible results. The model never receives API keys, arbitrary URLs, elevated database access or the ability to change quota policy.
- Proposed initial limit: at most two additional provider requests per Edition attempt, charged against shared and provider budgets, with at most one reranking pass after new reporting arrives. Reuse completed equivalent searches, coalesce concurrent requests and count failed retries. If results remain thin or the budget is exhausted, show the real shortage; do not loop. Document any later change from these initial bounds with capacity evidence.
- Validate all AI-selected Story/source identities, uniqueness, section eligibility, required fields, available evidence, reading budget and output-use permissions before saving an Edition. Treat instructions within Source articles as untrusted text. A model cannot invent sources, manufacture facts or turn a generic significance claim into a valid discovery reason. Human live-sample review remains necessary; structural validation alone cannot establish truth or editorial quality.
- Cache reusable source/event enrichment and Briefings by source content plus processing-policy version. Store reader-specific final selection and its explanations only in the reader-owned Edition. Provider, model or future preference changes do not regenerate an existing paper.
- A suitable enabled model and real successful end-to-end AI selection are prerequisites for claiming the recovered AI editor works. Preserve deterministic selection plus grounded source text during timeout, invalid output or disabled-model conditions, and identify that mode honestly in release evidence. A permanent disabled model does not satisfy the R3 AI acceptance gate.

### Complete, preserved reading content

- Define one canonical saved Story content contract: title, Briefing, separate importance explanation when supported, topics, section, provenance/fallback label, publication time, publisher and all original/supporting-source links. Save selection reason and policy version with the Edition when those are displayed. Rendering may differ by surface; content may not disappear by visual variant.
- Lead and standard Story treatments share capabilities. Every eligible Story supports all source links, saved feedback and neutral Skip. Decorative variants must not return before essential content/actions.
- Fix Trending URL construction. Prefer removing Trending from the finite Edition; if retained anywhere, every link must target a real source or existing Story and its label must describe the actual selection. Remove decorative pagination and arrows unless real accessible navigation exists.
- Repair main-section priority so discovery exclusions and positively preferred topics are different concepts. Less like this must not gain priority through a later partition or sort. Keep transparent deterministic ranking for candidate selection and fallback, with bounded AI refinement as specified above; do not add model training or embeddings as a recovery prerequisite.
- Discovery requires an evidence-specific explanation. Generic claims of essential perspective, publisher identity alone or a truthy template do not establish public importance. Allow an explicit shortage.
- Preserve one complete Edition per reader/local date. Feedback and settings affect future creation, not saved reading content. Use existing generation/concurrency protection and correct incomplete-failure cleanup rather than introducing public regeneration controls.
- PDF renders the same canonical saved fields, including the separate importance explanation. Original and supporting-source links remain clickable. Export and archive reads do not retrieve news, invoke AI or rerank Stories. A shared pure presentation mapping is allowed to prevent field omissions; no new distributed service is needed.
- Improve newspaper composition with clear masthead, date, section hierarchy, a lead Story, legible columns where content length supports them, deliberate page breaks and page numbering. A short Edition should look deliberately short, not stretched to resemble a full newspaper. Identical content does not require identical layouts or byte-identical files.
- Reading length remains an upper reading budget. Show actual duration separately from the preference and explain shortages. Do not pad content, relabel old reporting or expand Briefings beyond source evidence.
- Proposed content-depth gate: before advertising a Reading length as supported, actual useful reading must reach at least 60% of that budget on at least 80% of measured cohort reader-days during a seven-day pilot, without exceeding the declared budget. Include Briefings and importance explanations in estimates and state the estimation method. These are declared product targets to evaluate, not known user preferences. If a length fails, improve supply or transparently restrict new offers; do not silently rewrite existing preferences.

### Shared-data security and operational continuity

- Restrict shared reporting INSERT/UPDATE/DELETE to a trusted server ingestion identity. Anonymous visitors and ordinary authenticated readers may read eligible public reporting as intended but cannot write it directly. Scope elevated credentials to ingestion and keep them out of client assets, public samples and logs.
- Preserve row ownership for preferences, feedback, Editions and private exports. Test both public shared-data restrictions and private cross-reader restrictions; enabling RLS alone is not proof of either.
- Migrations and application changes must be compatible with existing saved Editions. Backfill optional provenance/version fields conservatively; old unknown values remain unknown. Apply restrictive write policies together with the working trusted ingestion path so the security repair does not break news retrieval.
- Preserve bounded refresh claims, quotas, timeouts and cache reuse. Derive caps from verified account limits, count retries, and prevent arbitrary client input from triggering unbounded fetching or URLs. Saved reading and downloads remain available when limits are reached.
- Add only bounded operational evidence needed to diagnose ingestion quality, refresh/Briefing failures, selection shortages and export errors. Keep user identity and source credentials out of diagnostics. Operator checks may be scripts or existing logs; an analytics platform and dashboard are not prerequisites.
- Keep test fixtures and disposable reader data separate from production supply. Controlled clocks and reporting inputs must be confined to test infrastructure and never exposed as public production override parameters.
- Document migration, deployment, rollback and provider-configuration steps. Verify the deployed version before declaring a gate passed. A rollback restores compatible software/configuration without deleting preserved Editions or reopening public shared writes.

### A simple, finished reader experience

- The entry page shows an honest product promise and a readable sample Edition with matching sample PDF. Samples use validated, attributable material and display their actual date and sample status. They contain no private reader data and are not misrepresented as the visitor's own current Edition.
- Onboarding captures existing interests, Preferred region and Reading length without technical timezone syntax in the primary flow. Detect the browser zone and offer a human-readable correction only when needed. Preserve interrupted choices and explain when settings take effect.
- The paper consists of a compact date/duration header, a clear sequence of complete personalized Stories, a small Beyond Your Bubble section and a clear end with PDF/archive actions. Remove repetitive marketing panels from signed-in reading. Navigation previews must have a demonstrated purpose and valid destinations.
- Remove unsupported premium-reader endorsements. Use customer quotes only with real provenance and permission. Labels such as Editor's Choice or Trending require a real documented basis; otherwise use truthful labels such as lead Story or recent reporting.
- Prefer publisher images when appropriate. Label category/stock images as illustrative or omit them; do not imply they document a specific event. Preserve the established color/type direction. Person artwork must remain human-authored if used. Do not ship reserved-art production labels or empty placeholder regions as final UI. Custom comic artwork and animation remain optional finishing work after core acceptance, with no use of previously rejected assets.
- Responsive layout, keyboard access, touch targets, contrast, visible focus and reduced-motion support ship with each phase rather than as a final cosmetic task. Use plain-language progress and recovery copy.

### Commercial evidence without pretending demand is established

- Recruit five consenting target readers with contrasting interests for a seven-day pilot after the product-ready gates pass. Recruitment and external communication are owner-led unless explicitly delegated; publication of this plan does not authorize messaging people.
- Before the pilot, record the candidate audience, supported coverage, exact proposed recurring price and currency, what it includes, the intended pilot capacity and a conservative cost estimate. No price or paid provider has been selected in this conversation; choosing and recording these is a pilot prerequisite rather than grounds for inventing a number now.
- Track only the minimum consented events needed: Edition availability, successful reading sessions/returns, feedback changes, PDF use, source openings and task failures. Do not add behavioral surveillance or treat Skip as dislike.
- Proposed pilot go/no-go criteria: at least four of five readers complete onboarding, reading and PDF retrieval without coaching; at least three return on three distinct days; at least three can identify specific useful learning and describe improved relevance; and at least two give an explicit, attributable commitment to continue at the stated price. Record rejections and reasons as carefully as positive responses. Compliments about design and a hypothetical yes to an unstated price do not pass.
- Treat those small-sample thresholds as directional evidence. If they fail, make a focused change to usefulness, audience, coverage or the offer and repeat the affected pilot; do not respond by adding unrelated features.
- Record expected per-active-reader costs, shared retrieval cost, quota capacity and a margin/contingency calculation at the proposed price. Staying within free services during recovery is the constraint; a hypothetical future paid plan is not an approved purchase or proven entitlement. If the offer cannot operate sustainably within verified access, the commercial gate stays open.
- This spec targets a validated product offer, not live charging. Checkout, recurring billing, taxes/refunds and commercial-launch terms require a subsequent explicit implementation scope once price, merchant access and demand are established. Do not label a site with no billing path as already selling subscriptions.

## Testing Decisions

**Owner-confirmed primary seam:** the reader's browser journey and existing authenticated daily Edition boundary against an isolated test database. Substitute only reporting supply, AI/provider responses and the clock. Reuse existing controlled-input support rather than adding production-facing test endpoints.

- Good tests assert external behavior: useful eligible content, selected titles/sections, accessible actions, saved feedback effects, dates, identity/ownership and complete exported text. Avoid component-tree snapshots, private method calls, exact weight constants, prompt wording and tests that merely reproduce the implementation.
- Reuse prior art from the existing account/preferences browser tests, Edition service/concurrency tests, feedback persistence tests, ranking regressions, archive journeys and PDF extraction/rendering checks. They are starting points, not proof the reviewed defects are fixed.
- **One complete persisted journey:** two reader sessions choose contrasting interests over the same sufficiently varied controlled supply; receive meaningfully different Editions; save More like this and Less like this through normal UI/API; verify idempotence/replacement; advance the test clock; create the next Edition through real orchestration using stored feedback rather than injected feedback totals; verify the intended selection change and unchanged current/archived content. Skip must produce no feedback change.
- **Canonical content and PDF:** use a saved Story with a separate populated importance explanation, a deliberately different excerpt, multiple source links, fallback provenance, long title and nontrivial text. Compare ordered canonical content across lead/standard web views, archive and extracted PDF text/links. Render representative short and multipage PDFs to verify hierarchy, columns, clipping, fonts and page breaks. Do not embed the separate explanation inside the test excerpt to conceal a missing field.
- **Supply quality:** at the public preview/Edition output boundary, exercise comment feeds, generic titles, empty wrappers, invalid dates, duplicate URLs/events, short authorized text, absent region metadata and valid sources. Assert rejected candidates cannot appear on any public reading surface. Human-review a dated sample of at least 30 live candidates and all pilot outputs; automatic structural checks do not establish semantic truth or editorial usefulness.
- **Multi-source behavior at the same seam:** substitute two provider response streams through the existing reporting boundary. Include overlapping URLs, alternate-provider identities for the same event, conflicting/missing dates, different coverage, delayed results, rate-limit errors and one failed provider. Assert that usable distinct reporting survives, duplicates do not consume Edition slots, feedback/inclusion identity survives provider changes, permitted supply can continue after one provider fails, and disallowed evaluation material never reaches a public/customer output. Verify actual retained-provider benefit in a separately dated live scorecard.
- **Geography, preferences and repetition:** include a Pakistani publisher discussing an unrelated foreign event, a foreign publisher reporting on Pakistan, unknown event geography, technology subtopics, unchanged previously delivered events and a substantive supported update. Verify selection and reasons reflect the declared signals; broad country metadata is never falsely labelled event location. An unchanged event is deprioritized while a genuine update can appear. Check saved explicit preferences and neutral Skip behavior remain intact.
- **AI editor and targeted retrieval:** feed valid selections, invented identities, duplicate selections, unsupported claims, source instructions, over-budget requests, unauthorized adapters, malformed output, timeouts and undercovered candidates through the existing Edition journey. Assert bounded server-executed search and one post-search refinement, shared reuse, fallback continuity and unchanged saved Editions. Do not assert exact model wording or demand byte-identical outputs. Inspect outbound test requests to verify preference minimization and absence of identity/history/credentials. No new public testing endpoint is required.
- **Security:** through ordinary anonymous and authenticated clients, prove shared reporting writes fail while intended public reads work; prove trusted ingestion still succeeds; prove one reader cannot read/write another's preferences, feedback, Editions or export. Include direct data access, not only hidden UI controls. Use isolated data for mutation checks.
- **Reliability:** reuse the Edition orchestration seam for same-day contention, interrupted generation, provider timeouts, malformed responses, no eligible reporting, stale cache and exhausted quotas. No half-completed Edition is published, no old Edition is relabelled today, retries remain bounded and saved archive/PDF reads avoid provider calls.
- **User-interface contract:** verify every visible link/control has a real outcome, the lead Story has full capabilities, public samples reveal no private data, sample PDF matches, and timezone defaults do not require technical input. Batch desktop/mobile, keyboard and reduced-motion checks; fix significant findings, then confirm once.
- **Deployed acceptance:** verify real Google callback, live validated reporting, persistence after sign-out/in, reading, feedback, settings, original links, PDF and archive on the deployed candidate using authorized disposable readers. Check actual provider configuration rather than assuming local success transfers. A skipped prerequisite is recorded as blocked/not run, never passed.
- **Pilot evidence:** record actual observed completion, returns, usefulness, proposed-price responses and operating costs. Browser tests cannot prove willingness to pay. Do not substitute generated personas or invented quotes for participants.
- All evidence identifies the deployed commit and actual run date. Replay the complete journey after the last substantive logic or layout change and before promotion. The old 78-test log cannot certify the recovery release. Use one primary acceptance journey plus the focused security, quality and rendering checks where that highest seam cannot explain a failure clearly.

## Out of Scope

- Implementing, deploying or changing production data during this specification-writing request.
- Rebuilding the application, replacing the stack, training a recommendation model, adding vector infrastructure or splitting the system into services.
- A new 91-criterion ticket hierarchy, automatic publication of implementation tickets, or closing/relabeling historical issues in this planning session.
- Unlimited global/topic coverage, unsupported geographical promises, full-article scraping or access-control bypasses.
- Paid upgrades, provider purchases, automatic billing enablement, payment processing and a live subscription launch without a separately scoped commercial implementation.
- Infinite feeds, social features, notifications, scheduled email delivery, native apps, broad analytics tooling and a new editorial dashboard.
- Replacing the established brand identity, using rejected generated person art, or blocking the reader-ready release on custom artwork/motion references.
- Editing old Editions to make a demo appear better, altering source dates, public clock overrides, fixture-only evidence presented as production, or fabricated customer validation.
- Guaranteeing hackathon selection, market success or willingness to pay from technical completion alone.

## Further Notes

### Recovery phases and completion evidence

| Phase | What becomes demonstrably better | Exit gate | Dependency |
|---|---|---|---|
| R1 — Trustworthy reporting from complementary sources | Public previews and newly created Editions draw from a protected, normalized pool with demonstrated useful coverage. | Public/ordinary-client writes denied; trusted ingestion works; two candidate providers compared against the existing adapter; retained combination and incremental benefit recorded; grouping/usage eligibility and provider-failure checks pass; reviewed live sample excludes junk; supported coverage and actual limits recorded; existing private/history access intact. | Start here. |
| R2 — One complete paper everywhere | A reader can read a complete lead/standard Story and keep the same paper as a finished newspaper PDF. | Canonical web/archive/PDF comparison passes including separate importance text and all source links; full Story controls work; broken/decorative navigation removed or repaired; short/long PDF render checks pass. | R1. |
| R3 — AI-assisted personal relevance and learning | Two readers receive useful topic/subtopic differences; AI can fill a coverage gap within limits; saved feedback improves a subsequent Edition. | Real compatible-model selection plus controlled persisted next-day journey pass; targeted search bounds and fallback verified; regional evidence distinguished from publisher country; unchanged events deprioritized and supported updates eligible; negative feedback fixed; discovery reasons supported; current/old Editions unchanged; coverage/Reading length limits truthful. | R2. |
| R4 — A finished, dependable reader release | A visitor can inspect real value and a signed-in reader can complete a calm accessible reading session and recover from failures. | Sample Edition/PDF available before login; mobile/desktop/keyboard checks and deployed OAuth/reading/export/archive/failure journey pass on final candidate; no unsupported testimonials or placeholder UI; operating/rollback notes complete. | R3. Basic usability ships throughout R1–R3. |
| R5 — Evidence of a paid-value offer | Actual readers return, describe useful outcomes and respond to a concrete offer that can be operated sustainably. | Seven-day pilot, declared content-depth targets, pre-recorded price/capacity/cost model and all proposed pilot go/no-go criteria assessed; shortcomings reported; final walkthrough and architecture match deployed release. | R4. Recruit planning may begin earlier; pilot starts after reader-ready acceptance. |

**Product-ready requires R1–R4. Commercially promising requires R5 as well.** Do not mark the entire recovery complete merely because code was merged. If a gate fails, keep that phase open and change the smallest relevant assumption. Further live charging requires the separately scoped billing/commercial work described above.

Do not assign optimistic calendar deadlines before R1 establishes content feasibility and the remaining changes are estimated. Work sequentially on the earliest open phase; independent checks within a phase can share the same release candidate. Record an early working walkthrough after R2 and update it rather than postponing all evidence until R5. Use meaningful commits and rerun acceptance after late changes.

### Relationship to existing work

Revision 2 incorporates the owner's agreement to compare complementary providers, build a shared multi-source-capable pool, use bounded AI editorial selection and targeted searches, and distinguish event updates and geographic relevance. It preserves the five-phase plan and previously approved highest-level testing seam; additional provider/model cases are controlled inputs at that seam rather than new test frameworks or public override routes.

The original specification and tickets describe intended behavior; many features exist even while all ten tracker issues remain open. Audit current implementation/evidence against their acceptance rather than treating either issue state or old test passes as implementation truth. Recovery does not automatically close those issues or create native dependency edges. A later ticket-breakdown request should produce a small number of demoable slices from R1–R5, linked to this spec, with evidence-based blockers.

Original specification: https://github.com/Umer-Hayatt/Project-Herald/issues/1. Related existing work: reporting and preserved Edition #3; grounded Stories/discovery #4; feedback #5; archive #6; PDF #7; resilience #8; visual finishing #9; evidence #10.

### Provider findings informing the evaluation

These are documentation observations checked on 18 October 2026, not verified account entitlements or a selected production combination. Recheck before implementation and record what each provider permits for public Briefings, PDF downloads and persistent archives.

- GNews lists 100 free requests/day, up to 10 articles/request, a 12-hour delay, truncated free content and paid access for commercial use. Treat free access as evaluation-only for this proposed commercial product. Source: https://gnews.io/faq and https://gnews.io/legal/terms-of-service.
- NewsData.io documents 200 free credits/day, up to 10 articles/credit and no full free article content. Its own published commercial-use guidance conflicts between pages; do not resolve that conflict by picking the more favorable statement. Confirm the intended plan and outputs directly before production selection. Sources: https://newsdata.io/documentation, https://newsdata.io/ and https://newsdata.io/blog/free-news-api-for-commercial-use/.
- Currents currently advertises 250 free requests/day and up to 20 results/request, rather than the older 600-request claim. Its pricing/usage-rights page says customer-facing AI summaries and long-term archives are not included by default in self-service plans. Resolve those specific output permissions before selecting it for Herald. Source: https://currentsapi.services/en/product/price.
- Mediastack lists 100 delayed free calls/month and non-commercial free use; Standard lists commercial use. It is a low-volume evaluation candidate rather than an assumed free commercial backbone. Source: https://mediastack.com/pricing.
- Country filters can identify where reporting is published rather than what place the event concerns. GNews documents this distinction explicitly; each adapter must preserve the meaning of its own field. Source: https://docs.gnews.io/endpoints/search-endpoint.

The end-to-end review identifies concrete implementation defects and distinguishes submission-time facts from observations made the following day. No organiser feedback or selected-competitor evidence is available. Today's content samples are not proof of yesterday's judging experience.

### Remaining implementation prerequisites

Actual content entitlements, production access, sufficient source depth, provider suitability, pilot participants, a proposed recurring price/currency, operating capacity and user outcomes are facts to verify during the appropriate phase. They are not invented by publishing a spec. The owner confirmed the testing seam; this publication authorizes a specification, not purchases, contacting readers, app implementation, production migrations or a claim that the product is already commercially validated.
