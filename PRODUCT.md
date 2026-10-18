# Product

<!-- impeccable:product-schema 1 -->

## Active recovery

Recovery specification #11, revision 2, is the current authority for recovery work. Read [the recovery handoff](docs/recovery/README.md) and its approval checkpoint before choosing a ticket. It updates the earlier single-provider/source-only-AI assumptions, expired deadline and artwork sequencing; historical build observations below require current verification.

## Platform

web

## Stack

User-selected: Next.js, TypeScript, Tailwind CSS, Supabase, and Vercel. Google sign-in through Supabase. TheNewsAPI is the existing supply baseline. Recovery compares two complementary provider candidates and adds bounded AI selection and targeted search, subject to verified source/model permissions and access. The disabled Gemini integration does not establish a suitable public AI runtime.

## Users

General readers across age groups who want a finite daily paper relevant to their interests and preferred region. Younger readers are included in this broad audience. Launch content is English-language news spanning several topic categories.

## Product Purpose

Turn scattered reporting into a reader's daily edition, combining personalized selection with one or two important stories outside their usual interests. Recover a dependable reader-ready release, then validate a concrete paid-value offer through the pilot defined in specification #11. No new delivery deadline is assumed.

## Operating Context

- A solo beginner programmer is recovering the existing hackathon product, using free services and coding assistants.
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
- Recovery keeps usable accessible screens throughout the build. Optional custom human-made artwork and motion follow core acceptance; remove unfinished placeholder UI rather than treating missing art as a reader-release prerequisite.

## Evidence on Hand

Historical build record from the original hackathon plan. Consult the recovery handoff and current issue evidence before treating any access, deployment or acceptance claim as current.

- User-supplied two-page problem statement: E:/NaSCon'26 Problem Statement.pdf.
- Confirmed interview decisions and feasibility findings: outputs/product-decisions.md.
- Domain terms: GLOSSARY.md.
- The slice 01 account application is deployed at https://project-herald-pink.vercel.app with a dedicated free Herald Supabase allocation. Persisted onboarding and two-reader isolation pass local and deployed browser checks. Real Google OAuth callback and live news/Gemini access remain pending user configuration; provider suitability constraints are recorded in docs/setup/slice-01.md.
- Three user-supplied visual references are preserved in work/design-references/: editorial-content-layout.png, lo-news-layout.png, and youth-illustration-palette.png. The user also supplied https://dribbble.com/shots/7519181-Lilium-Homepage-Prototype as a motion/presentation reference.
- The user values the supplied poster's person illustration, composition, and color contrast, while retaining a broad audience. Herald is a suggested working name. Logo, final composition, illustration, and motion remain to be resolved with Impeccable.

## Brand Commitments

- Welcome readers across age groups through a human-centered illustrated identity.
- Treat the supplied illustrated reference as evidence of the user's taste rather than a youth-only audience definition.
- Herald is the confirmed working name.
- Person artwork must be made by a human artist. The user liked the generated mockups' layout and visual qualities but rejected their AI-generated figure.
- The intended person-art style is expressive comic illustration like the supplied poster, rather than a classical portrait or simplified doodle. Artwork selection should preserve this taste.
- Preserve the human-authored comic-art preference if person artwork is added. The generated figures and researched examples remain unapproved. Optional final art/motion stays independent of complete, usable reading and account flows.

## Product Principles

- Make daily reading finite and useful.
- Combine relevance with deliberate discovery.
- Ground every briefing in available reporting and preserve attribution.
- Preserve each edition consistently across reading, download, and archive.
- Improve future selection through understandable reader feedback.
