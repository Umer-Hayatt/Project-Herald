## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R05 · phase R3.

Readers optionally specify subtopics/entities, understand supported regional selection, and see persisted More/Less feedback improve a later Edition without rewriting current or archived papers.

**Demo:** Two readers choose contrasting interests/subtopics, receive useful differences, save feedback through the real UI, and use a labelled controlled next-day replay to show the intended change.

## Acceptance criteria

- [ ] Add optional editable subtopic/entity choices to short onboarding/settings while broad interests still work; preserve existing interests, region, Reading length and account progress. Infer the time zone with a familiar correction path rather than mandatory technical syntax.
- [ ] Use declared interest/subtopic signals and evidence-supported regional meaning for candidate selection; distinguish publisher location from reported places, retain global coverage and show honest limited-coverage explanations.
- [ ] Fix negative-feedback priority so Less like this cannot be promoted by a subsequent sort; preserve one active replaceable/idempotent feedback value and keep Skip neutral.
- [ ] Load actual stored feedback through normal next-day orchestration rather than passing computed feedback totals directly in the acceptance journey; show meaningful selection differences for contrasting readers and explain the effect of future settings.
- [ ] Keep the current Edition, old dates, archive and PDF content stable after feedback/settings changes, including feedback identity when equivalent reports come from different providers.
- [ ] Test the complete persisted browser/API journey with isolated readers and controlled supply/clock, including save failure/retry, repeated choice, changed choice, unknown geography and old-preference compatibility; record privacy checks and actual Reading length limitations.

## Blocked by

- R04: Read and download one complete, consistent Edition (draft identifier; replace with published issue link).
