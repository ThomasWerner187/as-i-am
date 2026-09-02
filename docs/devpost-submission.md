# Devpost submission copy

Use this as the source of truth for the submission form. Replace bracketed deployment fields
only after verifying them from a logged-out browser. The submission deadline is September 3,
2026 at 1:00 PM Pacific; check the [official rules](https://webmcp.devpost.com/rules) before the final submit.

## Project title

As I Am — The web adapts. You don’t have to.

## One-line description

A private agent carries how a person needs the web to work — not why — and negotiates a
measurable, reversible fit with participating websites through WebMCP.

## Live links

- Project URL: `[ADD VERIFIED PUBLIC URL]`
- Video: `[ADD VERIFIED PUBLIC YOUTUBE URL]`
- Source: `https://github.com/ThomasWerner187/as-i-am` — this repository must be public for submission.
- License: `https://github.com/ThomasWerner187/as-i-am/blob/main/LICENSE` — verify GitHub detects
  the MIT license and shows it near the top of the repository page.

## Inspiration

Accessibility preferences are personal, but their implementation is fragmented. Someone may
need larger text, bigger targets, less motion or a calmer information hierarchy, yet has to
configure that experience again in every product. A website cannot safely infer the need, and
sharing a medical label would expose far more than the site requires.

We wanted a narrower boundary: let a trusted agent understand the person, but let the website
receive only functional instructions it can act on and verify.

## What it does

As I Am defines and demonstrates an Adaptive Web Contract. A WebMCP-enabled page exposes its
supported adaptation capabilities. An agent sends a bounded functional profile. The site maps
that profile into its own tokens and components, waits for the UI to render, measures the result,
and returns a fit report. The agent can refine individual values, undo the last operation, reset
everything, or export a diagnosis-free receipt for the next participating surface.

The prototype includes a dense electronics comparison shop and a resident-services portal as two
routes in one SPA. The guided 90-second proof starts with measured baseline UI, reveals the exact
privacy boundary, applies and refines a profile, then validates and imports the full receipt on the
second product surface. That surface capability-negotiates the values, reports unsupported ones and
measures the accepted subset in its own design language.

## How we built it

- React, TypeScript and Vite for a static, inspectable application.
- A single dispatch boundary shared by native `document.modelContext`, the self-guided proof,
  the advanced demo controls and the `?agent=1` development harness.
- A versioned functional schema spanning visual, interaction, cognitive, motion/media, reading
  and safety preferences.
- A session-only adaptation engine with atomic operations, exact undo and site-owned rendering.
- DOM measurement for text size, effective target size, action spacing, contrast samples,
  visible primary actions, motion, overflow and occlusion.
- Route-specific capability discovery and fit grading that distinguishes satisfied, partial and
  unsupported requests.
- A strict receipt-import boundary that validates provenance metadata, privacy markers, profile
  schema and destination support before applying anything.
- Vitest, Playwright and axe-core coverage plus CI for typecheck, unit, end-to-end and production build.

## Why WebMCP

This is not a settings panel with an agent-shaped button. WebMCP is the negotiation layer:

1. The agent discovers what the current page supports.
2. The site receives typed functional intent instead of selectors or private context.
3. The page returns measurements and unmet values after rendering.
4. Semantic tools expose real page tasks while preserving human confirmation for risky actions.
5. A full functional receipt can be validated and capability-negotiated on a different participating page without copying its UI logic.

Without WebMCP, there is no explicit, inspectable contract between the private agent and the
site-owned experience.

## Challenges

The hardest problem was truthfulness. Applying a CSS variable is not the same as satisfying a
preference. React may not have committed structural changes when a tool handler returns, native
form controls can make target measurements misleading, and a generic capability list can promise
support a page does not really have. We added render synchronization, effective label-target
measurement, page-specific capabilities, strict boundary validation and evidence-based fit grading.

The second challenge was explaining privacy without asking judges to trust a paragraph. The guided
proof visibly separates simulated private context from the exact JSON sent to the website.

## Accomplishments

- A complete observe → adapt → measure → refine loop with rendered evidence.
- One contract driving two distinct product surfaces.
- A portable functional receipt with strict export and import validation, destination negotiation
  and an honest same-origin reset-before-transfer demonstration.
- Diagnosis-like payload rejection and no persistent profile storage.
- Real domain interactions: search, filters, task focus, guided forms, full price calculation and
  human-confirmed staged cart changes.
- A self-guided judge path that tells the full product story without a presenter.

## What we learned

Agent-native accessibility needs both semantics and observability. Typed preferences make intent
clear, but measurements make the result accountable. We also learned that portability is valuable
only when the receiving site preserves its own design language and can decline unsupported requests.

## What’s next

The next milestone is an open specification package, a conformance fixture and two independently
deployed example origins. After that: browser-managed consent and receipts, stronger privacy
separation between agent and site, user studies with people who use adaptive interfaces, and a
small integration kit for design-system teams.

## Official judging-criteria map

| Area | Where to see it |
| --- | --- |
| WebMCP Leverage | Capability discovery, typed adaptation and receipt tools, semantic page tasks, rendered measurement |
| Execution | Complete 90-second proof, real domain tools, undo/reset and automated checks |
| Potential Impact | A concrete reduction in repeated accessibility setup without disclosing diagnoses |
| Creativity & Ambition | Private functional negotiation, accountable fit reports and portable receipts |

## Final submission gate

- [ ] Public deployment loads `/`, `/shop`, `/services` and `/shop?judge=1` directly
- [ ] 90-second proof completes twice in a logged-out browser
- [ ] Native WebMCP status and fallback language are both accurate
- [ ] GitHub repository is public and the MIT license is detected and visible near the top
- [ ] YouTube video is public, under three minutes, contains explanatory audio and plays logged out
- [ ] No secrets, personal data, employer data or machine-local files in source or video
- [ ] Screenshots and README reflect the final UI
- [ ] All commands in README pass from a clean install
- [ ] Submit before September 3, 2026 at 1:00 PM Pacific; after the deadline, freeze the submitted repo and live site during judging
