# Submission draft — As I Am

English copy for review. This document does not publish the project, change repository
visibility, or submit the entry. Recheck the [official hackathon page](https://webmcp.devpost.com/)
and rules before submission; publishing requires the owner’s decision.

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

Deploy and verify the three public origins; record the final English demonstration. Then extract
a small integration kit and conformance fixture, test with people who use adaptive interfaces,
and add agent-side consent, minimisation, receipt expiry and integrity protection.

## Release gate

- [ ] Verify public controller, cinema and restaurant URLs and actual origin topology.
- [ ] Run both booking flows twice in the intended presentation browser.
- [ ] Verify native tool discovery/execution and keep fallback language accurate.
- [ ] Record a new English video; review audio, captions, runtime and synthetic-data disclosure.
- [ ] Obtain the owner’s approval for any repository visibility change and publication.
- [ ] Review secrets, personal data, license, assets and source links before release.
- [ ] Verify all submission links logged out and recheck the current official deadline/rules.

Project URL, video URL and submission URL remain intentionally unset until verified.
