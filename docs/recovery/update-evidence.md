# Conservative publisher decision updates

Implemented locally on 22 October 2026. This is a bounded first production path
for update evidence, not a general detector of every meaningful development.

New Edition Stories preserve each eligible supporting source's URL, original
publication time and up to 2,100 characters of publisher description/snippet in
the existing `supporting_sources` JSON. Generated Briefings are kept separate.
No schema migration, additional provider call or model request is required.
Old Editions are not rewritten; ones lacking these snapshots fail closed.

For a repeated event in the last seven completed Editions, the comparison uses
the latest delivered event and the latest same-URL source snapshot across all
matching Editions in that window. An intervening publisher cannot hide an
earlier comparable report. A newer report
can establish these explicit decisions:

- proposed → approved or rejected;
- scheduled → cancelled, launched or opened;
- opened → closed.

Both sentences must directly assert the same named institution/subject and
object, with only the supported status changing. Accepted auxiliary verbs
(`has`, `have`, `had`) and whitespace do not distinguish facts. Questions,
negation (including contractions and negative determiners), uncertainty and
embedded non-assertions are rejected. An already delivered decision in any
matching recent Edition or supporting publisher suppresses another update.
An `Updated` headline, later timestamp, generated Briefing, or provider-supplied
`material_update.verified` flag cannot establish the decision.

The saved explanation quotes the current and previous publisher sentences.
Service, archive and PDF restore the same saved explanation; word counts and
selection budgets include it. The parser does not send reader history to AI.

## Evidence and limits

`tests/genuine-updates.spec.ts` uses the approved real isolated Edition seam:
proposal → next-day approval → unchanged repeated approval, without injected
verification flags or recent-history overrides. It checks the earlier Edition
is unchanged, the archive browser displays the saved explanation, and the PDF
contains it with a measured 43-word controlled Story. Offline regressions cover
denials, questions, repeated source versions/publishers and older delivered
facts hidden behind a newer stale report.

This deliberately misses paraphrases, quantitative changes, different-URL
follow-ups without a comparable same-source snapshot, lowercase/generic actor
phrasing and old Editions without publisher snapshots. Those cases retain
normal unchanged-repeat handling rather than receiving an invented update
explanation. Live provider examples and broader coverage remain to verify;
controlled tests do not establish deployed usefulness or complete R04.
