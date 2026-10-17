# Herald: published specification and tickets

**Repository:** [Umer-Hayatt/Project-Herald](https://github.com/Umer-Hayatt/Project-Herald)
**Specification:** [#1: Herald usable first product release](https://github.com/Umer-Hayatt/Project-Herald/issues/1)
**Status:** Published after user approval. All ten issues use ready-for-agent; ticket blockers govern start eligibility.
**Scope:** Eight build slices and one submission-delivery task, with 91 acceptance criteria. Former planning slices 03 and 04 were merged at the user's request.

| Build order | GitHub ticket | Blocked by | Delivers |
| --- | --- | --- | --- |
| 01 | [#2: Sign in with Google and save onboarding on the deployed app](https://github.com/Umer-Hayatt/Project-Herald/issues/2) | None | A new reader signs in on the deployed URL, chooses interests, Preferred region and Reading length, and returns after reload to the saved choices. |
| 02 | [#3: Read one real preserved Edition per local day](https://github.com/Umer-Hayatt/Project-Herald/issues/3) | [#2](https://github.com/Umer-Hayatt/Project-Herald/issues/2) | Finish onboarding, receive a real attributed paper, reload in two tabs, and see the same dated content; move the controlled clock to the next local day to receive a new paper. |
| 03 | [#4: Read grounded, grouped Stories with Beyond Your Bubble](https://github.com/Umer-Hayatt/Project-Herald/issues/4) | [#3](https://github.com/Umer-Hayatt/Project-Herald/issues/3) | A new Edition groups duplicate reports into one grounded Story and includes distinct outside-interest Stories with importance explanations; the same journey remains useful when Gemini fails. |
| 04 | [#5: Improve future Editions through explicit feedback and settings](https://github.com/Umer-Hayatt/Project-Herald/issues/5) | [#3](https://github.com/Umer-Hayatt/Project-Herald/issues/3) | Save More like this or Less like this, change settings, and demonstrate a different next-day selection while today's Edition stays identical; Skip produces no learning change. |
| 05 | [#6: Revisit previous Editions in a private archive](https://github.com/Umer-Hayatt/Project-Herald/issues/6) | [#3](https://github.com/Umer-Hayatt/Project-Herald/issues/3) | A reader with Editions from two controlled local days opens each from the archive and sees its original date and unchanged content. |
| 06 | [#7: Download the same Edition as a newspaper-inspired PDF](https://github.com/Umer-Hayatt/Project-Herald/issues/7) | [#3](https://github.com/Umer-Hayatt/Project-Herald/issues/3) | Download a real saved Edition, open it, and compare its date, ordered Stories, text and source links with the website; repeat for a saved earlier Edition. |
| 07 | [#8: Keep the complete product usable through provider failures and free-tier limits](https://github.com/Umer-Hayatt/Project-Herald/issues/8) | [#4](https://github.com/Umer-Hayatt/Project-Herald/issues/4), [#5](https://github.com/Umer-Hayatt/Project-Herald/issues/5), [#6](https://github.com/Umer-Hayatt/Project-Herald/issues/6), [#7](https://github.com/Umer-Hayatt/Project-Herald/issues/7) | Run the full reader journey, then disable AI and fresh-news responses: excerpts still work, old Editions stay readable under their real dates, and Retry can recover without duplicates. |
| 08 | [#9: Finish Herald with human-made comic artwork and supplied animation direction](https://github.com/Umer-Hayatt/Project-Herald/issues/9) | [#8](https://github.com/Umer-Hayatt/Project-Herald/issues/8) | Use the complete deployed product with final approved human-made comic art and the user's animation references, then repeat signup, reading, feedback, archive and PDF without functional regressions. |
| 09 | [#10: Prepare the public repository, architecture diagram and final product video](https://github.com/Umer-Hayatt/Project-Herald/issues/10) | [#9](https://github.com/Umer-Hayatt/Project-Herald/issues/9) | Open the public repository, readable architecture diagram, deployed product URL and final Loom product video of at most five minutes from the submission checklist. |

## Working frontier

Start with [#2: Google sign-in and onboarding](https://github.com/Umer-Hayatt/Project-Herald/issues/2). It is the only initially unblocked ticket. No ticket has been claimed or implemented during this planning session.

After #3 is complete, #4, #5, #6 and #7 are independently unblocked. A solo builder may choose their order without treating the numbering as extra dependencies. #8 requires all four; #9 is the LAST build slice; #10 packages submission evidence afterwards.

## Preserved decisions

- The merged #4 includes grounded Briefings, duplicate-event grouping and Beyond Your Bubble together.
- #9 covers final approved human-made comic artwork, the user's later animation references and frontend finishing after the complete functional core passes #8.
- Earlier slices deliver usable responsive screens with replaceable artwork/motion regions. Final assets never gate their implementation.
- #10 is a delivery task rather than another build slice. The submission includes the public repository, architecture diagram and final Loom product video of at most five minutes.
- Test the complete reader journey with controlled news, AI and clock inputs, plus a real deployed smoke journey. Engineering defaults are distinguished from confirmed product decisions in the specification.

## Verified tracker configuration

Nine native parent links connect the tickets to specification #1. Eleven native blocking dependencies match the table above; human-readable Parent and Blocked by links are also present in every applicable ticket. The parent specification remains open and its body was not changed during ticket publication.

GitHub is authoritative for live status and dependencies. Local specification and ticket files are snapshots of this approved publication. See the release-plan document for deadline checkpoints and runtime-access risks.

## Deadline

21:00 on 17 October 2026, Asia/Karachi. Publication-time check: 12:51:20, leaving 8 hours 8 minutes 40 seconds. Recheck when implementation begins; checkpoint targets are aggressive and do not establish delivery certainty.
