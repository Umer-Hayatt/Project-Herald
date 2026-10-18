## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R05 · phase R3.

A compatible enabled model selects a balanced Edition from bounded eligible candidates, creates grounded Briefings and supported discovery reasons, and leaves a useful deterministic fallback when the model fails.

**Demo:** Generate live AI-selected papers for two contrasting readers, inspect selection/source reasons, then simulate invalid output or timeout and show an accurately identified fallback without changing old Editions.

## Acceptance criteria

- [ ] Verify an enabled model’s actual access, suitability and allowed public use before claiming this capability; the existing disabled/incompatible Gemini configuration is not a successful AI-editor release. Keep any required owner setup or spending approval as an explicit prerequisite.
- [ ] Form a bounded deterministic shortlist using subjects, supported geography, freshness, quality, stored feedback and recent inclusion; let AI choose eligible Story identities, order and sections under the Reading length and discovery policy.
- [ ] Use the explicitly approved minimal request-scoped topic/subtopic/coarse-region preference brief; account identity, emails, exact location, raw histories, numeric personalization scores and credentials remain inside Herald. Shared enrichment remains source-only.
- [ ] Validate selected IDs, duplicates, evidence, source/output permissions, sections and budget before persisting; reject invented sources and instructions embedded in reporting. Generic importance templates do not qualify a discovery Story.
- [ ] Cache reusable source/event enrichment and Briefings by content/policy version, while preserving reader-specific selection/reasons only in the owned Edition. Stable reload/archive/PDF reads do not regenerate model output.
- [ ] Provide deterministic, source-grounded fallback on disabled/failed/invalid model output with honest release evidence; show a supported discovery shortage rather than manufacturing reasons.
- [ ] Exercise valid/invalid choices, prompt-like source instructions, absent evidence, minimal outbound preferences, timeout and fallback through the approved journey; record real live AI selection and manually review a dated grounded sample.

## Blocked by

- R04: Reduce repeated events while retaining meaningful updates (draft identifier; replace with published issue link).
