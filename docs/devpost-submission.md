# Submission draft — As I Am

English copy for the revised entry. The new access-choice interface and native proof need
fresh verification and a matching recording. The existing 117-second guided video shows the
previous revision. The release gate below is internal and should not be pasted into the story.

## Title and one-line description

**As I Am — The web adapts. You don’t have to.**

Disabled people choose the access they need. Participating websites adapt, agents help, and
the person keeps the final say.

## Inspiration

Two seats together. Dinner before the film. An ordinary evening should be yours to arrange.
But a booking page can put barriers between a disabled person and that choice: controls that
need precise movement, text that is difficult to read, or too much information to manage at once.

Reduced dexterity or tremor, low vision, and cognitive overload or fatigue can create different
access needs. W3C WAI describes this diversity and how needs can overlap or change. We use
functional requests instead of asking the website to classify a person medically.
[Diverse Abilities and Barriers](https://www.w3.org/WAI/people-use-web/abilities-barriers/)

As I Am starts with a simple question: what would help you use this page? Then a second:
do you want to choose yourself, or ask your agent to prepare a proposal?

## What it does

The person can combine **Make pointing easier for me**, **Make reading easier for me** and **Give me less to process**. These
produce explicit requests for larger targets, larger readable text, clearer steps or reduced
motion. The agent discovers what a participating site supports; the site applies those requests in its own
design and reports the rendered result. The person can change the combination and return to
the original view.

**Help me choose** supports the person's own exploration. **Prepare for me** lets an agent
research available options and stage a review. Both preserve the person's existing choices
and leave confirmation in the visible interface. Clearing all support choices keeps the original
presentation and the journey available.

The example is a fictional cinema and restaurant. Cinema controls change while selected seats
remain selected. A functional receipt carries the chosen interface preferences to the restaurant.
The restaurant accepts its supported subset and retains its own design. Adding reading support
later makes changing needs part of the same journey.

Dinner planning is a useful secondary task: use the confirmed 20:15 film time, allow time to
eat and walk, and propose an available 18:00 table with arrival at 19:45. The full menu stays
available alongside focused options. Food requests come from an editable fictional example;
uncertain ingredient or allergen information remains a question for the restaurant.

## Why WebMCP matters

The agent needs a discoverable agreement with the website. WebMCP exposes capabilities,
validated adaptation, rendered measurement and booking preparation as distinct actions.
The agent can ask, inspect the result and refine an unmet request. The website owns its
components and rules. No arbitrary CSS injection or booking-confirmation tool is required.

The core proof is a real native sequence: discover the page tools, send chosen functional
values, show the changed page and inspect its returned measurements. Existing native calls
have been verified on the local production build; the revised sequence is being recorded.
Guided buttons run labelled presets and are kept distinct from external-agent execution.

## How we built it

React, TypeScript and Vite render the sites. `document.modelContext.registerTool` exposes their
page-specific tools. Closed schemas and destination capability checks bound the requests.
The app retains state in session memory and keeps receipt export/import separate from domain tasks.

The functional receipt contains no diagnosis, diet, allergens, budget or booking selections.
Dinner planning receives the film time separately under the person's request. The two sites
share this implementation; they demonstrate a contract, not independent industry adoption.
The source is MIT licensed and the demo is free to use.

## What we can show—and what we still need to learn

The previous integrated revision has documented native tool execution, rendered measurements,
selection-preservation checks and 178 automated tests. These are engineering results, not
proof that a particular disabled person finds the interface easier to use. The revised choices
need their own final checks and matched evidence.

No genuine user-research sessions or testimonials are documented yet. WAI's
[Stories of Web Users](https://www.w3.org/WAI/people-use-web/user-stories/) inform our awareness
of different experiences; those people are not our participants and their stories are not our
validation. We have prepared a practical worksheet for voluntary testing with real people.

The prototype uses synthetic bookings and menu data. It requires participating sites, does not
adapt arbitrary websites, and is not a WCAG certification or a guarantee of allergy safety.
Functional preferences can be sensitive; unsigned receipts are not production credentials.

## What’s next

Evaluate the actual choices with disabled people using their preferred devices and access tools.
Learn which adaptations help, which interfere and when a person wants delegated help. Then build
an integration kit for an independent website and strengthen consent, receipt expiry and integrity.

## Built during the submission period

The repository began on September 1, 2026 (`d49bf40`). Its September 1–3 history contains the
contract, native registration, working examples, tests, inclusion flow, menu and dinner planning.
The current revision adds explicit combinations of access needs and a stronger native proof.
A replacement video must show this revision before it is submitted.

Existing building blocks include React, TypeScript, Vite, Fontsource fonts, Vitest, Playwright
and axe-core. The fictional artwork was generated for the demo. Earlier narration used ElevenLabs;
using the app requires no speech-provider account or API key. Licenses and provenance are in the repo.

## Built with

WebMCP, React, TypeScript, Vite, CSS, Vitest, Playwright, axe-core, Fontsource.

## Testing instructions

Use [judge-testing.md](judge-testing.md) for the native-first walkthrough and compact Devpost
field. See [inclusion-evidence.md](inclusion-evidence.md) for claim boundaries and
[user-validation-guide.md](user-validation-guide.md) for the unfilled research worksheet.
No login or credentials are required.

## Internal release gate — do not paste into the project story

- [ ] Check the final access-choice controls and combination mapping against this copy.
- [ ] Verify and record genuine native discovery, adaptation and measurement on the revised build.
- [ ] Capture changed needs, retained selection and human confirmation; keep guided presets labelled.
- [ ] Replace the previous 117-second candidate with the matching 140–160-second target edit.
- [ ] Verify final runtime below three minutes, audio/captions and correspondence with the public app.
- [ ] Replace pending-evidence wording with actual dated results only after they exist.
- [ ] Verify public controller/direct URLs, actual topology, repository license and source visibility.
- [ ] Review secrets, assets and final publication approval; add public YouTube and testing links.
- [ ] Confirm team details, submit and verify the green **Submitted** label on Devpost My Projects.
- [ ] Preserve the submitted commit, deployment, media and entry through judging.

Nothing in this file establishes a new completed recording, public deployment or submitted entry.
