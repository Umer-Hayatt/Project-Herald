# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User-selected: Next.js, TypeScript, Tailwind CSS, Supabase, and Vercel. Google sign-in through Supabase. TheNewsAPI free plan is the first news-supply candidate; Gemini free-tier API access is selected for briefings and topic labels. Provider access and exact model availability require live verification.

## Users

General readers across age groups who want a finite daily paper relevant to their interests and preferred region. Younger readers are included in this broad audience. Launch content is English-language news spanning several topic categories.

## Product Purpose

Turn scattered reporting into a reader's daily edition, combining personalized selection with one or two important stories outside their usual interests. Deliver a usable first product release by 21:00 on 17 October 2026, Asia/Karachi.

## Operating Context

- A solo beginner programmer is building for a hackathon, using free services and coding assistants.
- Readers sign in with Google, complete short onboarding, and immediately receive their first paper.
- Onboarding captures interests, preferred region, and a five-, ten-, or fifteen-minute reading length; ten minutes is the default.
- Create an edition on the reader's first visit each local day. Preserve its contents across the web, downloadable PDF, and archive.
- Readers can follow original-source links, skip stories, give explicit feedback, and revisit previous editions.

## Capabilities and Constraints

- Each story has a concise briefing explaining what happened and why it matters, grounded only in available source material, with publisher attribution and links. Short excerpts justify shorter briefings.
- Group reports about the same event into one story with supporting-source links.
- Score personalized selections using interests, freshness, and feedback. Regional preference boosts relevant local coverage while important global stories remain eligible.
- Beyond Your Bubble reserves space for one or two important stories outside the reader's usual interests. Explain why each merits attention; consider impact, freshness, and reliable reporting. Avoid repeating stories already in the personalized selection.
- More like this and Less like this are the strongest feedback signals. Skip moves past a story without declaring dislike. Feedback improves future editions and leaves the current edition stable.
- Settings allow changes to interests, preferred region, and reading length for the next edition. Reading-time estimates may be shorter when suitable reporting is limited.
- Use AI for source-grounded briefings and topic labels. Keep reader identities and personalization scores inside the app.
- If AI fails, offer available publisher excerpts and source links. If fresh news retrieval fails, offer the last saved edition under its actual date and allow retry. Existing editions remain readable.
- Initial release includes working signup, onboarding, real editions, matching downloadable PDFs, archives, feedback-driven personalization, and usable loading, empty, and error states on the deployed site.
- The PDF should draw on traditional newspaper structure and layout, as required by the brief. The frontend planning brief is outputs/design-brief.md.
- Runtime credentials, Google authentication configuration, a dedicated database project, story/word budgets, and implementation thresholds remain open setup or engineering details.
- Product discovery is complete. The user explicitly deferred final frontend artwork, animation, and visual finishing to the last implementation slice and will supply additional animation references then. Core product implementation and specification can proceed using the agreed layout and palette direction with replaceable artwork/motion areas.

## Evidence on Hand

- User-supplied two-page problem statement: E:/NaSCon'26 Problem Statement.pdf.
- Confirmed interview decisions and feasibility findings: outputs/product-decisions.md.
- Domain terms: GLOSSARY.md.
- GitHub, Supabase, and Vercel connector authentication has been verified. No application or live integration exists yet.
- Three user-supplied visual references are preserved in work/design-references/: editorial-content-layout.png, lo-news-layout.png, and youth-illustration-palette.png. The user also supplied https://dribbble.com/shots/7519181-Lilium-Homepage-Prototype as a motion/presentation reference.
- The user values the supplied poster's person illustration, composition, and color contrast, while retaining a broad audience. Herald is a suggested working name. Logo, final composition, illustration, and motion remain to be resolved with Impeccable.

## Brand Commitments

- Welcome readers across age groups through a human-centered illustrated identity.
- Treat the supplied illustrated reference as evidence of the user's taste rather than a youth-only audience definition.
- Herald is the confirmed working name.
- Person artwork must be made by a human artist. The user liked the generated mockups' layout and visual qualities but rejected their AI-generated figure.
- The intended person-art style is expressive comic illustration like the supplied poster, rather than a classical portrait or simplified doodle. Artwork selection should preserve this taste.
- Reserve final comic-style person artwork, user-supplied animation direction, and visual finishing for the last build slice. The generated figures and researched artist examples are unapproved assets. Keep their eventual replacement independent of the core reading and account flows.

## Product Principles

- Make daily reading finite and useful.
- Combine relevance with deliberate discovery.
- Ground every briefing in available reporting and preserve attribution.
- Preserve each edition consistently across reading, download, and archive.
- Improve future selection through understandable reader feedback.

