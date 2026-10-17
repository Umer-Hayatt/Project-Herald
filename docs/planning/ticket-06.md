## Parent

[Specification #1: Herald usable first product release](https://github.com/Umer-Hayatt/Project-Herald/issues/1)

## What to build

Let a reader keep a downloadable PDF of any owned completed Edition using the same saved content as the web paper.

## Demo

Download a real saved Edition, open it, and compare its date, ordered Stories, text and source links with the website; repeat for a saved earlier Edition.

## Acceptance criteria

- [x] Offer an actual PDF download for an owned completed Edition, with a useful Herald/date filename; no browser print dialog is the only export path.
- [x] Render from the Edition snapshot only. Download does not retrieve fresh reporting, rerank Stories or call the AI.
- [x] Match Edition identity/date, section membership, order, displayed text, discovery explanations, publisher attribution and source URLs to the saved web representation.
- [x] Use a traditional newspaper-inspired masthead, section hierarchy and legible columns/page breaks. This required functional PDF layout ships before final web artwork finishing.
- [x] Preserve clickable original/supporting-source links and handle long headlines, short excerpts, multi-source Stories and multi-page Editions without clipped or missing content.
- [x] An owner can also export a previous completed Edition by its identity; the archive will surface the same action when slice 05 is integrated.
- [x] Anonymous or other-reader requests cannot obtain the PDF, including by guessed identifiers; caching must not share private exports across readers.
- [x] Show download progress, a retryable generation error, and a working download action on narrow screens.
- [x] Compare extracted PDF text/links against the saved Edition and visually inspect representative short and long PDFs. Confirm later preference/feedback/provider changes leave export content consistent.

## Blocked by

- [#3: Read one real preserved Edition per local day](https://github.com/Umer-Hayatt/Project-Herald/issues/3)
