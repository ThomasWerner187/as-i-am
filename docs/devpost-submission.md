# As I Am — submission copy

**The web adapts. You don’t have to.**

Your agent knows what matters. You plan the evening together.

- Live demo: https://asiam.wernerverse.de/ (jury login supplied privately)
- Demo video: https://youtu.be/VCrRYQfJxus
- Source: https://github.com/ThomasWerner187/as-i-am

## Inspiration

“Plan a movie night for us next week. Dinner first would be lovely.”

It is a small request, but the websites involved can ask a lot of someone: bright
screens, moving content, crowded controls, a seat map to navigate and a menu to
check. Having to explain your access needs again at each step adds more work.

I wanted to show a different kind of assistance. An agent should be able to use
preferences you have chosen to share, make the page easier for you to use and
stay alongside you when you make a decision.

## What it does

The demo follows Alex and Lea, a fictional couple with shared example preferences.
Alex has a migraine today and wants his familiar calm view. He prefers an aisle
seat beside Lea. She has explicitly shared peanut and avocado allergies.

The cinema switches to dark, low-glare, still visuals. The agent finds a 20:15
showing next Friday and two seats with Alex at the aisle. Alex asks to move one
row back; the pair moves together, keeping that arrangement. He reviews and
confirms the demo tickets himself.

Dinner comes next. An 18:00 table leaves time for a 90-minute meal, a short walk
and arrival before the film. Three pictured dishes replace a long list, including
Alex’s favorite mushroom risotto. Ingredient exclusions remain visible, and
uncertain kitchen information stays a question. Alex can inspect the full menu,
change the proposal and confirm the table.

## Why WebMCP

Personal context becomes useful when an agent can act on the page. WebMCP exposes
what each site supports: display changes, rendered measurements, available seats,
dinner calculations and menu information. The agent can also ask the restaurant
to show a smaller selection in its own interface.

Each site owns its design and booking rules. The agent makes supported requests;
the person sees the result. A display receipt carries only functional preferences
between the venues. Names, diagnoses, allergies and booking details are kept out
of that receipt. Final booking confirmation stays with the person.

## How I built it

React, TypeScript and Vite power two participating venues. Their tools use
`document.modelContext.registerTool`, with validated inputs and shared handlers
for the visible interface and agent calls. The hosted version has separate cinema
and restaurant pages on one HTTPS origin.

The home experience is a labelled preset walkthrough. A real external agent can
read the supplied example context and call the native tools directly. Both paths
have been tested on the deployed site; the repository includes reproducible inputs
and results.

## What I learned

The most useful moment is a small correction: “one row further back.” Assistance
should preserve what matters while making that change easy. I also learned to
separate a supported preference from a promise: calm visuals are not a treatment,
and matching recipe ingredients is not an allergy-safety guarantee.

This is a working prototype for participating sites, with synthetic bookings and
no production memory service. Validation with disabled participants is still ahead.
The next step is learning which adaptations help people complete their own tasks.

## Built during the challenge

The adaptive contract, participating websites, native tools, tests and demo were
built during the submission period. The repository began on September 1, 2026.
Existing building blocks include React, TypeScript, Vite, Fontsource, Vitest,
Playwright and axe-core. Code and generated demo artwork are MIT licensed; fonts
retain their own license notices.

## Testing instructions

Open https://asiam.wernerverse.de/ with the jury login supplied privately in the
entry. Inspect **Saved preferences**, then **Plan our evening**. Try **One row
further back**, confirm the demo tickets and continue to dinner. Review the three
menu cards and confirm the table. Use `/guided` for additional access choices and
`/cinema` or `/restaurant` for native external-agent testing.

The [judge guide](judge-testing.md) contains the complete native walkthrough.
[Hosting evidence](hosting.md) and [recording notes](recording.md) identify the
checked deployment and film. Verify Devpost’s green **Submitted** status separately.
