# Submission draft — As I Am

English project copy for Devpost. The final release gate is an internal checklist, not part
of the story. Public links and the new recording still need verification. See
[judge testing](judge-testing.md) and [recording status](recording.md).

## Title and one-line description

**As I Am — The web adapts. You don’t have to.**

Let my agent help. Let me stay in charge. A more inclusive night out, with two ways to get help.

## Inspiration

Two seats together. Dinner before the film. An ordinary evening can involve precise clicks,
a crowded menu and several decisions spread across websites. A person should be able to
choose the support that helps them take part.

Sometimes that means clearer information so I can decide for myself. Sometimes I want my
agent to research the options and bring me a plan. Both should preserve my choices, my
ability to change my mind, and my final say. That is the idea behind As I Am.

## What it does

As I Am connects a fictional cinema and restaurant through a working WebMCP contract.
The person chooses between two forms of help:

- **Help me choose:** larger adjacent-seat choices, clearer information and a menu that can
  show the full selection or focus on my stated preferences. I explore and choose.
- **Prepare for me:** tools find compatible seats, read the confirmed film time, calculate
  a dinner plan and compare menu options. I receive a proposal I can inspect and change.

The timing is concrete. The film begins at 20:15. Dinner takes 90 minutes, the walk takes
15, and the request includes at least 15 minutes of buffer. The latest start would be 18:15,
but that table slot is unavailable. The available 18:00 proposal gets the person to the cinema
at 19:45, with 30 minutes to spare. The calculation and suggested table are visible.

OLIVA has six fictional dishes with prices, ingredients and declared allergen information.
The editable **Example request** starts with vegan food, €20 per dish and a quiet table.
The person can change those inputs. Unknown ingredients or cross-contact information remain
questions for the restaurant; a filtered result is never an allergy-safety guarantee.

The person confirms the tickets and table through visible controls. Tools can prepare a
review, but there is no booking-confirmation tool. The app is free and its source is MIT licensed.

## How we built it

React, TypeScript and Vite render the participating sites. Each registers page-specific tools
through `document.modelContext`: capability discovery, validated adaptation, rendered
measurement, fit verification, undo/reset, functional receipt transfer and booking operations.
The restaurant also exposes source-backed timing and menu tools.

The guided buttons execute preset requests and label their transport. They demonstrate a
workflow an agent can perform; there is no hidden LLM in the controller. An external agent
can discover and call the native WebMCP tools on each direct site page. Where embedded
native tools are unavailable, the guided experience labels its origin-checked demo bridge.

The functional receipt carries interface preferences, such as larger targets and clearer
steps. It does not carry diet, allergens, budget or booking selections. Planning receives the
film time separately when the person asks to plan dinner from their tickets. Food requirements
are explicit domain inputs from the editable example or the person's request.

Closed schemas, destination capability negotiation, session memory and confirmation boundaries
have automated tests. The pages also have keyboard, mobile and normal/adapted axe checks.
Those checks are engineering evidence, not a claim of complete WCAG conformance or user validation.

## Why WebMCP matters

An agent needs more than permission to click. It needs to know what a site supports, where
its information came from and what an action will do. WebMCP exposes those distinctions:
read the menu, request a clearer view, check a rendered result, calculate timing, or prepare
a review. The website remains responsible for its presentation and domain rules.

That makes both forms of help possible. A person can ask for better information to decide
independently, or delegate the research and inspect a prepared plan. The same site serves
both choices, and confirmation stays with the person.

## Challenges and lessons

A simpler screen should preserve useful information and agency. We keep the full menu
reachable, preserve selections through presentation changes, and distinguish adaptation from
booking preparation. A text-size setting also does not prove the result is usable: the
contract measures the rendered UI and reports partial or unsupported requests.

Privacy requires different boundaries for different tasks. An interface receipt should not
become a container for food requirements or a booking history. The timing needed for dinner
planning is a separate, explicit input. Browser support also differs between embedded frames
and direct pages, so native execution and the guided bridge are tested and described separately.

## Scope and limits

The project uses synthetic inventory and six fictional menu dishes. There are no real bookings,
payments, restaurant integrations or claims that food is safe for a particular person. A menu
match reflects declared source information; uncertainty is shown for follow-up with the restaurant.

The sites share an implementation. The local development setup uses three origins; a single-host
public deployment uses separate documents on one origin and must be described that way. The
contract requires participating websites and does not automatically adapt arbitrary sites.

Receipts are unsigned session objects. Functional preferences can still be sensitive, and an
external agent has its own data handling. Research with people who use adaptive interfaces,
assistive-technology review and production consent safeguards remain future work.

## What’s next

Build a small integration kit and conformance fixture that another website can use. Test both
forms of help with people who use adapted interfaces. Improve agent-side consent and data
minimisation, and add receipt expiry and integrity protection before production use.

## Built during the submission period

The repository began on September 1, 2026 (`d49bf40`). Its September 1–2 history records the
functional contract, adaptation engine, WebMCP registration, original shop/services examples,
cinema-to-dinner experience, tests and earlier recording. The September 3 iteration develops
the inclusion story, two forms of help, dinner planning and source-backed menu exploration.
A new recording must show this integrated version.

React, TypeScript, Vite, Fontsource fonts, Playwright, Vitest and axe-core are existing
third-party building blocks. The cinema and restaurant artwork was generated for this demo.
ElevenLabs generates the optional English guide narration; running the app requires no
ElevenLabs account or API key. Source and font licenses and asset provenance are in the repo.

## Built with

WebMCP, React, TypeScript, Vite, CSS, Vitest, Playwright, axe-core, Fontsource, ElevenLabs.

## Testing instructions

Use the [compact Devpost testing field](judge-testing.md#compact-devpost-testing-field) and
supply the verified public controller and direct site URLs. No credentials are required.
The guide uses preset requests; native external-agent calls are tested on the direct pages.

## Internal release gate — do not paste into the project story

- [ ] Check this copy against the final integrated tools and visible UI.
- [ ] Record the new inclusion, dinner-planning and menu flow; the earlier 93-second cut is superseded.
- [ ] Verify final audio, captions, runtime below three minutes and correspondence with the deployed app.
- [ ] Verify public controller, direct LUNA/OLIVA URLs and actual deployment topology.
- [ ] Successfully discover and call native tools in the presentation browser.
- [ ] Review final source, licenses, assets and secrets before public publication.
- [ ] Publish the reviewed source with owner approval and verify it while logged out.
- [ ] Supply the public YouTube link, English copy and no-login testing instructions.
- [ ] Confirm accepted teammate invitations, or record a solo entry.
- [ ] Submit and verify the green **Submitted** label on Devpost My Projects.
- [ ] Preserve the exact submitted commit, deployment, video and entry through judging.

No public deployment, YouTube URL or submitted Devpost entry is established by this document.
The prior technical verification applies to its recorded commit and flow; new functionality
needs its own final checks before submission.
