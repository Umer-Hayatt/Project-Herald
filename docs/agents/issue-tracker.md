# Issue tracker: GitHub

Specifications and tickets live at https://github.com/Umer-Hayatt/Project-Herald/issues. Always name this repository explicitly; a parent directory has an unrelated SQL remote.

Use the connected GitHub tools, or an authenticated gh CLI with --repo Umer-Hayatt/Project-Herald. Read the full issue body and comments before working from a reference. Publish one specification issue and one issue per approved ticket, in dependency order. Apply ready-for-agent to fully specified work; blockers still govern eligibility.

Link each implementation ticket to the specification as its parent. Use native GitHub sub-issues and blocking dependencies when accessible. The blocking API requires an issue database ID, not an issue number. Preserve human-readable Parent and Blocked by issue links in the body as well. If the available connection cannot manage native edges, explicitly record that limitation and use body links until native edges can be set.

Work only the frontier: open tickets whose blockers are complete. Claim a ticket before implementation; record acceptance evidence before closing it. Do not close or change the parent specification as part of ticket publication.

PRs as a request surface: no.

For multiline content with gh, write an exact UTF-8 body file and use --body-file. Never include credentials in issues, commits, or logs. Keep regular meaningful implementation commits in this project, preserving accurate history.

