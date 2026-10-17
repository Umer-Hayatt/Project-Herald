## Parent

[Specification #1: Herald usable first product release](https://github.com/Umer-Hayatt/Project-Herald/issues/1)

## What to build

Make preserved daily Editions easy to find and read again without regenerating their contents.

## Demo

A reader with Editions from two controlled local days opens each from the archive and sees its original date and unchanged content.

## Acceptance criteria

- [x] List the reader's completed Editions by actual Edition date, newest first, and open a chosen Edition by its stable identity.
- [x] Read the original saved text, Story order, sections, explanations and sources; archive access does not call news or AI generation.
- [x] Only complete Editions appear. Same-day concurrency or failed creation cannot create duplicate archive entries.
- [x] Preference edits, feedback, source updates and later Story generation do not change archived content.
- [x] An empty archive explains where papers will appear; invalid/unavailable entries and loading failures provide a usable recovery path.
- [x] Require reader ownership for archive listing and individual reads, including guessed Edition identifiers and direct database requests.
- [x] Demonstrate reload persistence and two distinct dates with the controlled clock, and confirm the archive works with all saved section/item kinds without separate content reconstruction.
- [x] Provide phone/desktop navigation back to today's Edition with readable dates and accessible controls.

## Blocked by

- [#3: Read one real preserved Edition per local day](https://github.com/Umer-Hayatt/Project-Herald/issues/3)
