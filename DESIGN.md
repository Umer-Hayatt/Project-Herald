---
name: Herald
description: Functional account interface in warm paper, slate, lilac, and orange.
colors:
  paper: "#f7f5ef"
  ink: "#293744"
  lilac: "#dcd2ee"
  orange: "#b34322"
  muted: "#535c65"
  line: "#b1ada7"
  control-line: "#727780"
  white: "white"
  button-hover: "#425363"
  secondary-hover: "#e7e0ee"
  notice: "#e8e2f0"
  error-surface: "#f5e0d7"
  error-ink: "#782b19"
typography:
  display:
    fontFamily: "Fraunces, serif"
    fontSize: "clamp(2.8rem, 6.6vw, 6rem)"
    fontWeight: 550
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Fraunces, serif"
    fontSize: "clamp(2rem, 3.6vw, 3.3rem)"
    fontWeight: 550
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  lede:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "clamp(1.1rem, 1.8vw, 1.35rem)"
    lineHeight: 1.55
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.6
rounded:
  control: "4px"
spacing:
  sm: "1rem"
  md: "1.5rem"
  lg: "2rem"
  xl: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "0.9rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.button-hover}"
  button-secondary:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.9rem 1.25rem"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  field:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.7rem"
  interest-option:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.65rem 0.8rem"
  interest-option-selected:
    backgroundColor: "{colors.lilac}"
  notice:
    backgroundColor: "{colors.notice}"
    rounded: "{rounded.control}"
    padding: "{spacing.sm}"
  notice-error:
    backgroundColor: "{colors.error-surface}"
    textColor: "{colors.error-ink}"
---

# Design System: Herald

## Overview

This records the implemented functional account slice, grounded in `src/app/globals.css`, the root font setup, and the landing, login, onboarding, and paper-entry components. It merges the existing interface foundation with the shipped controls. It is not a final visual composition or a creative seed.

Warm paper, slate text, lilac fields, and small orange accents carry the confirmed editorial direction. Landing uses Persuade; login combines Persuade in its introduction with Operate in its sign-in panel; onboarding uses Operate; paper entry uses Read. The current paper entry confirms saved preferences and explicitly states that no Edition is available yet.

Final human-made comic-style person artwork, user-provided animation direction, and visual finishing remain deferred to issue #9. Preserve replaceable illustration areas and stable account actions. No person asset, final composition, or entrance animation is approved.

**Key Characteristics:**

- Editorial Fraunces headings paired with DM Sans reading and controls.
- Paper surfaces, lilac introductory regions, and slate structure.
- Native labeled controls with visible pending, recovery, and save states.
- Calm paper-entry hierarchy without fabricated news.

## Colors

The frontmatter owns exact color values; the roles below explain their use.

### Primary

- **Slate ink** supplies text, primary actions, selected control borders, and masthead rules.
- **Orange** marks the wordmark point, keyboard focus, and input caret.

### Secondary

- **Lilac** fills introductory artwork regions, selected interests, and text selection.

### Neutral

- **Warm paper** is the page and paper-object surface.
- **Muted slate** supports help copy, notes, and summary terms.
- **Decorative line** separates preference-summary rows.
- **Control line** outlines unchecked interest choices, text fields, and selects.
- **White** supplies primary-button text.
- **Button hover** and **secondary hover** are the existing action-state fills.
- **Notice**, **error surface**, and **error ink** distinguish status and recovery messages.

**The Control Boundary Rule.** Use control-line for boundaries needed to identify editable or selectable controls. Keep line for decorative summary separators; the two roles are distinct.

## Typography

**Display Font:** Fraunces, with a serif fallback.
**Body Font:** DM Sans, with a sans-serif fallback.

The root layout loads both through Next.js font variables with swap behavior. Fraunces carries headings and the masthead; DM Sans carries body copy, navigation, labels, and controls.

- **Display / headline:** use the frontmatter ramps. Login has a local display ramp of `clamp(3rem, 5vw, 5rem)`; onboarding uses `clamp(2.7rem, 4vw, 4rem)`; paper entry uses `clamp(2.8rem, 5vw, 5rem)`.
- **Body / lede:** paragraphs stay within 65ch by default. Landing lede narrows to 33ch and account-panel copy to 40ch.
- **Labels:** semibold labels and legends use weight 650; action labels use 600.
- **Supporting copy:** help and masthead notes use 0.85rem; small notes use 0.83rem. The masthead wordmark is 2.65rem on desktop and 2.2rem on narrow screens.

## Layout

Desktop landing uses a 1.1:1 split; login uses equal columns. Onboarding is a centered grid capped at 1160px, with 1:1.3 columns, a 4rem gap, and 2rem horizontal padding. Its form groups have 2rem gaps and paired selects use equal columns. Paper entry has a calm reading inset around a 1050px central area; the preference summary is capped at 650px.

At the single narrow-screen breakpoint (maximum width 760px), landing, login, onboarding, paired selects, and summary rows become one column. Page content commonly uses 7vw side insets. The masthead becomes 82px tall instead of 100px, hides its optional note, and keeps the account action visible. Footer items stack. The empty login artwork reservation collapses.

Use wrapping interest choices and action rows. Fieldsets have zero minimum width so native controls can shrink with the layout.

## Elevation & Depth

The interface is flat except for the illustrative paper object: it rotates 5 degrees and uses a soft `0 15px 35px #29374424` shadow. This is a replaceable landing demonstration, not a general card treatment. Forms and account panels rely on spacing, color fields, and rules rather than shadows.

## Shapes

Controls and notices use restrained 4px corners. Fields, interest choices, summary rows, and masthead separators use 1px borders or rules. The current paper demonstration has square corners. Preserve the difference between an interactive boundary and a decorative separator.

## Components

### Actions and navigation

Primary actions have a slate fill, white text, a 52px minimum height, and weight 600. Secondary actions have a transparent fill and slate border; their hover fill is pale lilac. Primary hover changes background over 0.15s. The masthead sign-out variant uses transparent fill and compact padding.

Links retain an underline offset of 0.25em; text actions use weight 650. Use actual links for navigation and buttons for form actions. The masthead home link has an accessible name. The root skip link becomes visible on focus and targets the main content.

All keyboard-focusable elements receive a 3px orange outline offset by 5px. Pending buttons are disabled, use opacity 0.65 and a waiting cursor, and expose pending text with `aria-busy`. Reduced-motion preference removes transitions.

### Inputs and interest choices

Use native checkbox inputs inside their visible interest labels, with fieldset and legend grouping. Unselected choices use control-line; hover and selected borders use slate; selected choices also receive lilac fill. Native checkboxes use slate accent.

Text fields and selects share a transparent surface, 48px minimum height, 0.7rem padding, and the control boundary token. Place persistent labels above them and connect help text with `aria-describedby`. Placeholder text uses muted slate and supplements the visible label. Disable the affected fields while saving.

### Status and recovery

Status notices use a pale lilac surface; failures use the error surface and error ink. Notices have 1rem padding and 4px corners. Announce successful saves with `role="status"` and failures with `role="alert"`; show text that explains recovery. Preserve entered choices after a failed save and provide retry actions. Login errors retain a usable sign-in or sign-out retry action.

### Paper-entry summary

Use a semantic description list with muted terms and slate values, separated by decorative lines. Stack term and value on narrow screens. Keep the saved-preferences confirmation and the absence of a real Edition explicit.

## Do's and Don'ts

### Do:

- **Do** keep keyboard focus visible and preserve native control semantics.
- **Do** use control-line for field and interest boundaries, and line for summary separators.
- **Do** keep account actions usable while the illustration areas remain replaceable.
- **Do** preserve error recovery, pending labels, and visible save confirmation.

### Don't:

- **Don't** introduce generated person artwork or treat unapproved examples as final assets.
- **Don't** resolve final composition or motion ahead of the deferred issue #9 work.
- **Don't** present an illustrative paper object or placeholder as a real Edition.
- **Don't** apply the landing paper object's rotation and shadow to operational forms.
