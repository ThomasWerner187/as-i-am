# Submission draft — As I Am

English copy for the personal evening story. Release evidence and media status are maintained in
[verification.md](verification.md) and [recording.md](recording.md). This draft does not establish
public deployment, a public video or a submitted Devpost entry.

## Title and one-line description

**As I Am — The web adapts. You don’t have to.**

Your agent knows what matters. Participating websites adapt, and you plan the evening together.

## Inspiration

“Plan a movie night for us next week. Dinner first would be lovely.”

That ordinary request can involve much more than picking a film. A person may need a calmer
screen today, a particular seat arrangement, or food information that is easy to compare.
Having to explain those needs again on every website adds work before the evening even begins.

As I Am explores a different experience: a trusted agent carries the preferences a person has
chosen to share, while each participating website makes its own interface easier to use.
Inclusion means being able to participate, change your mind and keep the final say.

## What it does

The demo follows **Alex and Lea**, a fictional couple with explicitly shared preferences.
Alex has asked for his familiar calm view because he has a migraine today. He wants an aisle
seat beside Lea. Mushroom risotto is his favorite. Lea has explicitly shared peanut and
avocado allergies.

The agent applies Alex’s chosen dark appearance, lower glare and stopped animations for
**today’s planning**. It finds next Friday’s 20:15 film and checks that dinner can fit first.
Two seats are highlighted: Alex at the aisle, Lea immediately inside. When Alex asks for one
row further back, both seats move together and preserve that arrangement.

After Alex confirms the demo tickets, the restaurant receives the confirmed date and film time.
An 18:00 table allows a 90-minute meal and a 15-minute walk, arriving at 19:45. The restaurant
also adopts the supported calm display preferences in its own visual style.

Three illustrated dishes replace a long list. Risotto appears first because it is Alex’s
favorite **and** meets the ingredient filter. Peanut and avocado exclusions are explicit;
missing information and cross-contact remain kitchen questions. The full menu is always
available, and the person confirms the table.

## Why WebMCP matters

Personal context becomes useful when the agent can do something with it on the real page.
WebMCP gives the agent discoverable tools to inspect supported adaptations, apply functional
settings, check the rendered result, research availability and prepare a booking review.
Menu tools can present a smaller, relevant selection in the website’s own interface.

The website owns its design and booking rules. The agent provides supported requests rather
than injecting arbitrary CSS. The person sees the result, makes a correction and confirms.
That cooperation is the core of As I Am.

## How we built it

React, TypeScript and Vite render two participating demo venues: LUNA Cinema and OLIVA
Restaurant. Page-specific tools are registered through `document.modelContext.registerTool`.
Validated schemas separate display adaptation, measurements, menu research and booking state.

The home page is a **labelled preset walkthrough**, not an embedded autonomous language model.
A real external agent can read the supplied fictional context and perform the corresponding
native WebMCP calls on the direct venue pages. The advanced access-choice experience remains
available at `/guided`.

A functional receipt transfers display preferences between the venues. It contains no names,
diagnosis, allergies, food preferences or booking selections. The dinner date, film time and
explicit ingredient requirements are separate task inputs. Alex’s migraine message stays in
the example agent context; the sites receive his chosen display settings.

The repository is MIT licensed. The app requires no account, payment or API key.

## What we learned

A useful accessibility demo needs to show a person doing something they care about. Here,
calmer visuals, a correctly positioned seat pair and three understandable food choices all
serve the same evening. A small correction demonstrates cooperation better than a long
explanation of automation.

The same lesson applies to the contract: adaptations must preserve the person’s choices.
A quieter page should keep the selected seats. A menu refinement should retain explicit
allergy exclusions. A favorite must never outrank a conflicting ingredient requirement.

## Evidence and limits

The current [verification report](verification.md) records the tested build, native execution,
automated checks and remaining limitations. The [recording report](recording.md) identifies
the matching film and its completed media checks; this story is not a substitute for that evidence.

Alex and Lea, their shared history, bookings and menu are synthetic. There is no production
memory service or embedded model. These two venues share an implementation and demonstrate a
contract; the prototype does not adapt arbitrary websites.

Calm settings are Alex’s stated preference, not a migraine treatment. Ingredient declarations
are not an allergy-safety guarantee. Engineering tests do not establish usability benefits for
disabled people, and no participant research or testimonials are claimed.

## What’s next

Test the actual experience with disabled people using their own devices and access tools.
Learn which adaptations help, when they interfere and how much help each person wants from
an agent. Then integrate an independent website and improve consent, receipt expiry and integrity.

## Built during the submission period

The submission sprint produced the adaptive contract, native tool registration, participating
venues, tests and personal evening journey. The latest story adds an explicit fictional
context, calm display settings, dated showings, aisle-aware seating and a visual menu shortlist.
The repository history records the implementation; the final submitted commit belongs in the
release record.

Existing building blocks include React, TypeScript, Vite, Fontsource, Vitest, Playwright and
axe-core. Demo artwork and narration provenance are documented in the repository and recording
report. The demo needs no speech-provider account to run.

## Built with

WebMCP, React, TypeScript, Vite, CSS, Vitest, Playwright, axe-core, Fontsource.

## Testing instructions

Start at `/` for **A night for two**. Use `/guided` for advanced access choices and the direct
`/cinema` and `/restaurant` pages for native external-agent testing. No credentials are required.
The [judge guide](judge-testing.md) contains the short walkthrough, reproducible tool inputs and
a paste-ready testing field.

## Internal publication checks — do not paste into the story

- Match the final public app, repository, description and film to the recorded release commit.
- Complete the final media checks in [recording.md](recording.md); add the public YouTube link.
- Verify the public repository, MIT license, live URLs and no-login judge access.
- Complete team details and testing links, then verify the green **Submitted** label in Devpost.
- Preserve the submitted materials and working deployment for the required judging period.
