## Parent

[Recovery specification #11](https://github.com/Umer-Hayatt/Project-Herald/issues/11)

## What to build

**Recovery slice:** R10 · phase R4.

A new reader can reliably use the deployed product and the operator can explain its coverage, capacity, configuration and recovery behavior with evidence tied to the final version.

**Demo:** On the deployed candidate, complete real Google sign-in, onboarding, reading, feedback, settings, sources, archive and PDF; demonstrate bounded failures and the controlled next-day proof, then follow the documented operational recovery.

## Acceptance criteria

- [ ] Verify the deployed candidate’s real Google callback and persisted sign-out/in journey with authorized disposable readers; prove two-reader privacy and public shared-write denial against the intended production configuration.
- [ ] Run current deployed reading/export/archive/source-link and feedback/settings checks, plus live compatible AI selection and permitted retrieval; record commit, configuration class, date and pass/fail/blocked/not-run outcomes.
- [ ] Demonstrate bounded provider/model failures, exhausted quotas, no eligible news, correct saved-date fallback, retry recovery and same-day contention without partial/duplicate Editions or provider-dependent archive/PDF reads.
- [ ] Record supported coverage, provider/output permissions, observed request capacity, model usage, costs, migration/deployment/rollback steps and sanitized diagnostics; keep secrets and private identities out of public evidence.
- [ ] Update the architecture, setup/readme state and concise product walkthrough to match the actual implementation, including two readers, labelled next-day learning, samples and web/PDF consistency; prepare a pilot-ready offer/cost worksheet without inventing market validation.
- [ ] Replay affected acceptance after the final logic or layout change and keep the release open for any failed/blocked prerequisite. The historical 78-test log and successful build alone do not establish reader readiness.

## Blocked by

- R09: Offer a calm finished reading experience and samples before login (draft identifier; replace with published issue link).
