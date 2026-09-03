# Submission draft — As I Am

English copy for the submission form. The final section is an internal release gate, not
part of the project story. This document does not publish the project, change repository
visibility or submit the entry. See [testing instructions](judge-testing.md) and the
[release runbook](release-runbook.md) for the remaining publication steps.

## Title and one-line description

**As I Am — The web adapts. You don’t have to.**

One evening, two websites: WebMCP carries how you need the interface to work, not why.

## Inspiration

Choosing cinema seats and booking dinner should be an ordinary evening, not another round
of explaining how you need the web to behave. Accessibility preferences are personal, but
people repeatedly configure them across products. We wanted a shared functional language:
larger targets, calmer choices, one step at a time. The website does not need a medical label.

## What it does

As I Am demonstrates an Adaptive Web Contract through two instantly recognizable tasks.
A dense cinema seat map becomes large adjacent-seat choices. A restaurant then imports the
same functional receipt and offers clear dinner-time choices in a completely different design.
The user chooses and confirms; the agent can only prepare a booking review.

Each site discovers, validates, renders and measures its own supported adaptations. Preferences
can be refined, undone or exported without transferring identity, personal reasons or booking
selections. The local experience uses three origins and separate document-level engines.

## How we built it

React, TypeScript and Vite render the sites. Native `document.modelContext` registers 19 tools
on each participating page: capability discovery, validated adaptation, rendered measurement,
fit verification, undo/reset, receipt export/import and domain-specific booking operations.

The guided controller runs preset requests and openly labels its transport. It uses native
WebMCP discovery/execution where the browser exposes cross-origin frame tools; otherwise an
origin-checked bridge calls the same validation and handlers. It is not an embedded LLM.
An external agent can use the direct site pages through native WebMCP.

Closed schemas, destination capability negotiation, session-only state and human confirmation
boundaries are covered by unit and browser tests. The pages also have keyboard, mobile and
normal/adapted axe checks. Automated scans are not a claim of complete WCAG conformance.

## Why WebMCP matters

WebMCP makes adaptation discoverable and inspectable at the page boundary. An agent learns
what the site supports, sends typed functional values, and receives a fit report after the UI
renders. Domain tools return real synthetic availability and stage a review without exposing
a confirmation operation. A receipt makes those preferences portable without copying CSS or
sharing booking data.

The memorable moment is visual. The technical substance is the measured, reversible contract
behind it—not the number of tools.

## Challenges and lessons

Applying a design token does not prove that a request was satisfied. We wait for committed
rendering, measure effective targets and overflow, and report partial or unsupported results.
The second challenge was clarity: the earlier shop/services examples needed too much explanation.
Seats together and dinner before the film communicate the benefit immediately.

Browser support also differs between top-level pages and embedded frames. We test native calls
separately and expose a truthful fallback instead of claiming native execution everywhere.

## What is demonstrated—and what is not

- Working synthetic booking flows, explicit human confirmation, larger-target transformations,
  reversible refinement and validated receipt transfer.
- Three separate local origins using a shared implementation, not independently owned websites.
- A real native WebMCP path, plus a clearly labelled guided fallback.
- No persistent profile storage by this app; functional preferences may still be sensitive.
- Unsigned prototype receipts, not authenticated credentials or production consent management.
- Participation is required; the prototype does not adapt arbitrary third-party sites.

## What’s next

Extract a small integration kit and conformance fixture so another website can implement
the contract. Test the experience with people who use adaptive interfaces. Add agent-side
consent, minimisation, receipt expiry and integrity protection before treating receipts as
production infrastructure.

## Built during the submission period

The repository began on September 1, 2026 (`d49bf40`). Its September 1–2 implementation
history records the functional contract and adaptation engine, WebMCP registration, the
original shop/services examples, the cinema-to-dinner experience, validation and accessibility
tests, and the narrated demonstration. The final polish and release preparation continue
during the submission period.

React, TypeScript, Vite, Fontsource fonts, Playwright, Vitest and axe-core are existing
third-party building blocks. The fictional cinema and restaurant artwork was generated for
the demo, and ElevenLabs generated the English guide narration. The app does not require
an ElevenLabs account or API key. Asset provenance and font notices are included in the repo.

## Built with

WebMCP, React, TypeScript, Vite, CSS, Vitest, Playwright, axe-core, Fontsource, ElevenLabs.

## Testing instructions

Paste the [compact Devpost testing field](judge-testing.md#compact-devpost-testing-field),
then supply the verified public controller and direct site URLs. No credentials are needed.
The video shows the guided demo; native tool calls are tested separately on top-level pages.

## Internal release gate — do not paste into the project story

- [ ] Verify public controller, cinema and restaurant URLs and actual origin topology.
- [ ] Run both booking flows twice in the intended presentation browser.
- [ ] Verify native tool discovery/execution and keep fallback language accurate.
- [x] Record a new English video with guide narration, captions and synthetic-data disclosure.
- [ ] Owner reviews the [recording](recording.md) and approves the final voice and publication.
- [ ] Obtain the owner’s approval for any repository visibility change and publication.
- [ ] Review secrets, personal data, license, assets and source links before release.
- [ ] Verify all submission links logged out and recheck the current official deadline/rules.
- [ ] Confirm team invitations are accepted, or record that this is a solo entry.
- [ ] Save and submit, then verify the green **Submitted** label on Devpost My Projects.
- [ ] Preserve the exact submitted commit, deployment, video and entry through judging.

Project URL, video URL and submission URL remain unset until verified. Before submission,
replace deployment-dependent statements with the observed public topology. The current local
setup has three origins; a single-host production deployment must be described as one origin.
