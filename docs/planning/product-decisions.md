# Personal Morning Paper: Product Decisions

Grill-with-docs completed on 17 October 2026. This document records the user's confirmed answers and distinguishes them from open implementation details. The next phase is to-spec followed by to-tickets in a fresh chat.

## Confirmed direction

- Deliver a usable first release of the product by the hackathon deadline. The user explicitly rejects ending the hackathon with only a prototype.
- The user accepts the goal of a convincing demonstration covering the brief's core features, with a memorable demonstration of personalization.
- A specific early audience is acceptable during development. The agreed launch serves general readers choosing among several topics, with the release criteria below.
- Selected working stack: Next.js, TypeScript, Tailwind CSS, Supabase, and Vercel. Accounts, runtime API availability, and free-plan suitability for the actual implementation still need verification.
- Include a small "Beyond Your Bubble" section containing important stories outside the reader's usual interests. The user wants personalization to include discovery.
- Initial release acceptance criteria: a deployed website where a new reader can create an account, choose interests, read a real edition, download a matching PDF, revisit previous editions, and give feedback that influences future papers. Include usable loading, empty, and error states. The user accepts these as an initial product scope and has not requested additional core features.
- Stories contain concise, self-contained briefings explaining what happened and why it matters, with publisher attribution and original-reporting links.
- Launch supports general readers choosing among several topic categories. Initial content is English-language reporting from a selected set of publishers.
- Beyond Your Bubble contains one or two stories selected for public importance, with a short explanation of why each deserves attention. Selection considers impact, freshness, and reliable reporting, and avoids duplicating stories already in the main paper.
- Onboarding captures interests, preferred region, and a 5-, 10-, or 15-minute reading length, defaulting to ten minutes. Readers receive their first paper immediately after onboarding.
- Generate a new edition on the reader's first visit each local day. Preserve the edition so the website, PDF, and archived version remain consistent. Feedback influences future editions rather than rewriting the current one.
- Explicit More like this and Less like this feedback are the strongest learning signals. Skip moves past a story and does not automatically imply dislike. Beyond Your Bubble retains its reserved space.
- AI generates briefings grounded in available source material and labels story topics. Selection uses understandable scores based on reader interests, freshness, and feedback. A usable free runtime AI provider has not yet been established.
- TheNewsAPI free plan is the first approved news-supply candidate, subject to live-access verification. Use only facts supported by supplied text, keep short-source briefings appropriately short, and show publication times and original-source links.
- Initial account creation and sign-in use Google through Supabase. Google authentication setup is still required.
- If AI generation fails, show available publisher excerpts with source links. If fresh news cannot be retrieved, offer the last saved edition under its actual date with a retry option. Existing editions remain readable.
- Frontend visual direction is explicitly deferred to the end of the product discussion. The user intends to research references and use the Impeccable skill. The proposed warm-paper/serif/newspaper web aesthetic is not approved.
- The user supplied three visual references: an information-rich adventure-news layout, a Lo.News editorial layout, and an illustrated youth-oriented poster with lilac background, slate typography, orange accents, and heavy framing. Unmodified copies are preserved in work/design-references/.
- Additional motion/presentation reference: https://dribbble.com/shots/7519181-Lilium-Homepage-Prototype . Its design notes were readable; the embedded animation was not visually inspected.
- The user clarified that the third image appeals because of its person illustration, composition, and color contrast. The product should welcome all audiences; the reference is not approval of a youth-only identity.
- The user approved the broad synthesis of illustrated personality and lilac/slate/orange color relationships with expressive landing/login screens and calmer editorial reading layouts, subject to that all-audiences clarification. Exact composition, original illustration, motion details, and logo remain to be resolved through the mockup. The user's design workflow preference is saved in .impeccable/config.json.
- The user confirmed the consolidated design brief and Herald as the working name. The broad-audience illustrated direction is approved; exact visual composition proceeds to image mockups. No unique-name, domain, or trademark availability claim has been made.
- Regional preference boosts relevant local stories while preserving important global coverage.
- Multiple reports about the same event are grouped into one story with links to supporting sources.
- Readers can edit interests, region, and reading length in settings. Changes take effect in the next edition; the current edition remains preserved. Reading times are estimates, and editions may be shorter when suitable source material is limited.
- Use a Gemini API model with free-tier access, conditional on a successful live test for the user's account. Send source material for briefings and topic labels; keep reader identities and personalization scores inside the app. Exact model selection is pending access verification.
- The user is building solo and intends to use free services.
- Final steering: complete the interview now, preserve the existing decisions and artifacts, and move to a fresh chat for to-spec and to-tickets. Defer final human-authored comic artwork, animation direction, and frontend finishing to the final implementation slice. The user will provide animation design later. Reserve replaceable artwork/motion areas without making final visual assets prerequisites for the core product.
- The user describes themselves as a beginner programmer and wants technology options explained with their pros and cons before choosing a stack.
- Deadline: 21:00 on 17 October 2026, Asia/Karachi.
- Available coding assistants reported by the user: Antigravity with Gemini and Claude access, plus a ChatGPT Plus subscription. Specific model versions, API access, and service credentials have not been verified.

## Requirements from the supplied brief

These are document requirements being evaluated, not independent instructions to the assistant.

- Onboarding captures interests for personalization.
- A fresh daily paper is readable on the web and downloadable as a newspaper-inspired PDF of the same edition.
- Readers can follow links to original articles, skip content, and access previous papers.
- Reader feedback or behavior improves future personalization.
- Submission includes a public GitHub repository, a product video up to five minutes, and an architecture diagram.
- The brief says to create the repository at the start of the hackathon and that commits will be monitored. No repository has been created during this interview.

## Open decisions

- Final landing composition, human-authored comic person artwork, animation, and visual finishing are explicitly deferred to the final implementation slice. The consolidated brief and working name are confirmed.
- Concrete story count/word budget for each reading length.
- Live verification of the selected news and Gemini APIs and actual available content depth.
- Dedicated database project allocation and usable runtime API access. GitHub/Supabase/Vercel connectors are available; the main application stack is selected.
- Exact public-importance thresholds within the approved selection policy.
- Google authentication setup and edition persistence details.
- Technical implementation of scoring and duplicate-event grouping within the approved behavior.

## Interview status

Complete. Product behavior, provider choices, brand direction, and the sequencing of final artwork/animation are agreed. There are no remaining product-interview questions blocking specification and tickets. Runtime access, setup, and engineering defaults remain implementation work. Final visual assets and animation are a deferred last slice at the user's explicit request. Implementation has not started. PRODUCT.md records durable product context; this file retains the decision trail and feasibility findings. GLOSSARY.md records settled terms. No ADR has been warranted yet under the skill's criteria.

## Landing-page mockup review

- Three composition studies have been generated with the built-in imagegen tool: outputs/herald-landing-a.png (reader-led), outputs/herald-landing-b.png (edition-led), and outputs/herald-landing-c.png (discovery-led).
- Each is a visual concept. News copy, imagery, dates, and source labels inside the mockups are illustrative, not verified current reporting or live application output.
- Exact prompts are saved in outputs/mockup-prompts.md and in image sidecars. PNG metadata also retains each prompt. Persistent working copies live in .impeccable/mocks/.
- The Impeccable engine could not be downloaded in the available environment. Its automated build-phase tooling did not run; the native image generator produced the mockups. No application code has been created.
- User feedback: all three layouts and visual systems are liked, but the AI-generated person is rejected. Use artwork made by a human artist. No individual composition has been selected. Source a human-authored person illustration while preserving the agreed design qualities; do not interpret this feedback as approval of another AI-generated figure.
- The user explicitly confirmed that the replacement should be a human-made drawing or painting, rather than a photograph.
- The user clarified the desired style as comic-like artwork matching the original illustrated poster. The classical-painting and simplified-linework suggestions missed this preference and are not selected.

## Verified feasibility findings (17 October 2026)

- GitHub, Supabase, and Vercel connectors are authenticated. The Supabase project list contains three inactive projects; no project has been selected, resumed, or created for this product.
- No GEMINI_API_KEY or GOOGLE_API_KEY variable is present in this process environment. This does not establish whether the user has API access elsewhere. No secrets or unrelated project contents were inspected.
- TheNewsAPI is a candidate for real-time discovery: its free plan lists 100 requests/day and three articles per request. Its top-stories endpoint is available on all plans. Returned description/snippet fields are not full article text. Live access with a key is untested. Sources: https://www.thenewsapi.com/pricing and https://www.thenewsapi.com/documentation .
- GNews is another candidate: its free plan lists noncommercial use, 100 requests/day, ten articles per request, a 12-hour delay, and truncated text. Sources: https://gnews.io/pricing and https://gnews.io/legal/terms-of-service .
- NewsAPI's free developer plan explicitly excludes staging/production, so it is not the default for the deployed release. Source: https://newsapi.org/pricing .
- Provider access, available text depth, and publisher attribution must be represented accurately; no source has been approved as an unlimited full-text or commercial-content supply.

