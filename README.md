# As I Am

**The web adapts. You don’t have to.**

**New: A night for two.** The home page follows Alex and Lea through a quiet, visual evening
plan. A familiar agent uses explicitly shared example preferences: today's calm view, an aisle
seat beside a spouse, dinner before next week's film, and three ingredient-checked dishes.
The person can change the proposal and confirms each demo booking. Read the
[current story and native agent request](docs/personal-evening.md).

**An ordinary evening should be yours to arrange.** As I Am is a prototype for disabled
people who want participating websites to respond to the access needs they choose to express.
Small controls can be a barrier with reduced dexterity or tremor. Low vision can make default
text difficult to read; cognitive overload or fatigue can make dense choices harder to manage.
The person chooses what should change and how much help their agent should provide.

**Let my agent help. Let me stay in charge.** Both paths keep confirmation with the person.
This is a free, MIT-licensed prototype for participating websites.

## Choose the access you need

Three explicit choices can be combined:

- **Make pointing easier for me:** larger targets, more space between controls and strong focus.
- **Make reading easier for me:** larger text, more line spacing and a readable font.
- **Give me less to process:** guided steps, reduced nonessential content and reduced motion.

Choose what helps today, use **Make it easier →**, and inspect the result. A changed selection
uses **Update my support**; with none selected, **Use original view** keeps the journey available.
These choices describe a functional
request; the app does not infer a diagnosis. The original view and the person's selections
remain available. The receiving site applies only the preferences it supports.

W3C WAI documents diverse access needs and barriers. Our mappings are prototype design choices,
not user-validated prescriptions. See [inclusion evidence](docs/inclusion-evidence.md) for the
primary sources, measured results and the work still needed with real participants.

## Two forms of help

**Help me choose** makes the interface easier to use: larger seat-pair choices, a clearer
menu, readable prices and reversible presentation changes. The person explores and decides.

**Prepare for me** delegates the research. Tools can find a compatible seat pair, read the
confirmed film time, work out a dinner slot, check menu options against an explicit request,
and prepare a review. The person can inspect, change and confirm the proposal.

The editable **Example request** starts with vegan food, €20 per dish and a quiet table.
Those are visible fictional defaults, not preferences inferred about the person. Ingredient
and allergen information comes from the demo menu; uncertainty is a question for the restaurant.

## Try it

Use **Node.js 22** and npm. No account, credentials or API key is needed to run the app.

```bash
npm ci
npm run dev
# Open http://localhost:5273
```

This starts three separate local origins. Ports 5273–5275 must be available; the launcher
will not stop existing servers. Run one server manually with `npm run dev:site -- --port 5274`.

| Experience                      | Address                          |
| ------------------------------- | -------------------------------- |
| A night for two / agent entry point | http://localhost:5273        |
| Advanced access choices         | http://localhost:5273/guided     |
| LUNA Cinema                     | http://localhost:5274/cinema     |
| OLIVA Restaurant                | http://localhost:5275/restaurant |

The home page starts with **Plan our evening**. The following advanced paths are available
at `/guided`. Start there with **Help me choose**:

1. Try the original seat map. Choose **Make pointing easier for me** and **Give me less to process**, then apply
   the selected needs with **Make it easier →**. Compare the real controls, **Original** and **My view**; the selected
   seats should remain. Add **Make reading easier for me** when you want larger text.
2. Review the complete price and confirm the demo tickets yourself.
3. **Continue to dinner →** opens OLIVA. **Use my preferences here →** explicitly carries
   the functional interface receipt. Navigation alone does not share it.
4. **Find dinner that fits →** researches the timing and menu. Explore **Full menu** or
   **My choices**, inspect ingredients and prices, and choose whether to review a table.

Or choose **Prepare for me**:

1. Check or edit **Example request**. **Prepare my seats →** finds a compatible pair and
   stages its review; confirm the demo tickets yourself.
2. **Plan dinner from my tickets →** reads the confirmed 20:15 film time. With 90 minutes
   for dinner, a 15-minute walk and at least 15 minutes of buffer, 18:15 is the latest start.
   That slot is unavailable, so the proposal is **18:00**, arriving at the cinema at **19:45**.
3. Inspect the suggested table and menu options, open **Review suggested table**, then
   confirm only if the proposal suits you. **Full menu** remains available.

All bookings and menu data are fictional. There is no payment or real reservation. No login
is required. Use only example food requirements when exploring the demo.

## Native WebMCP and the guided demo

Each site registers page-specific tools through `document.modelContext.registerTool`.
An external agent can discover capabilities, apply a validated profile, measure the rendered
result, refine it, and export/import a functional receipt. Booking tools find actual synthetic
inventory and prepare a review. Dinner and menu tools return inspectable calculations,
prices, ingredients and uncertainty from their source data. **There is no confirmation tool.**

The guided buttons run preset requests, not an embedded language model. They use native
`getTools` / `executeTool` when available in the participating frames; otherwise they use an
explicitly labelled, source-and-origin-checked demo bridge to the same validated handlers.
Native failures are surfaced, not silently retried through the fallback.

For the central proof, use a real external agent: discover supported capabilities, request
the selected access needs, inspect the changed page and read its rendered measurements.
The [native walkthrough](docs/judge-testing.md) makes that sequence reproducible. Current
measurements demonstrate specific rendered properties, not a person's comfort or task success.

On `/`, open **How this works** for the direct venue links; the English agent request is in
the [personal story](docs/personal-evening.md#native-request-for-the-fictional-scenario).
On `/guided`, **Use WebMCP ↗** contains the request and links. Some browsers expose native
WebMCP only to top-level documents. Use the direct links in that case, and identify the actual
transport used. See [verification](docs/verification.md).

## What makes the protocol useful

- **Discover:** each page reports supported, inherent and unsupported preferences.
- **Adapt:** functional values map into the website’s own components and design tokens.
- **Measure:** tools wait for rendering and report targets, text, gaps, motion and overflow.
- **Refine:** change only what needs improvement; undo preserves the booking selection.
- **Carry:** the next site validates the receipt and accepts only its supported subset.
- **Research:** task tools return timing, availability and menu evidence for a reviewable plan.
- **Choose:** the person decides how much help to use and owns the final confirmation.

The functional receipt contains interface preferences, never food requirements or booking
selections. Dinner planning receives the film time separately under the person's explicit
request. Diet, budget and declared allergen filters are separate, editable task inputs.

This is a prototype contract for participating websites, not an automatic restyler for arbitrary
sites. Measurements are evidence for specific rendered properties, not a complete accessibility
audit. Functional preferences can still be sensitive. Receipts are unsigned session objects,
not credentials. See [privacy](docs/privacy-model.md) and [architecture](docs/architecture.md).

## Build, test and deploy

```bash
npx playwright install chromium # once after npm ci; Linux CI also needs --with-deps
npm run check
```

`check` runs TypeScript, unit tests, recorder tests, browser tests and the production build.
Run the recorder checks alone with `npm run test:recording`.
Playwright starts/reuses all three local servers. Coverage includes both booking flows,
cross-origin receipt transfer, invalid inputs, human confirmation, keyboard/mobile layouts,
normal/adapted axe scans, native registration and the older product demos.

Serve `dist/` with SPA fallback. A single static deployment works with separate documents on
one origin and labels that topology honestly. For a three-origin deployment, build with:

```text
VITE_AGENT_ORIGIN=https://your-controller.example
VITE_CINEMA_URL=https://your-cinema.example/cinema
VITE_RESTAURANT_URL=https://your-restaurant.example/restaurant
```

Use the same configuration for each deployment. Allow framing only by the controller in the
hosting policy; native cross-origin tool exposure is scoped to that controller origin. Verify
the actual browser policy and mode after deployment. The local build does not publish the app
or change repository visibility.

The [deployment and freeze runbook](docs/release-runbook.md) covers both topologies,
production checks, publication gates and preservation of the submitted build.

The previous examples remain at `/legacy`, `/shop` and `/services`. Existing shop/services
screenshots and `demo-clickthru.mp4` document that older version; they are not footage of
the new cinema/restaurant experience.

## Presentation materials

- [Judge testing instructions and native tool walkthrough](docs/judge-testing.md)
- [Inclusion claims and evidence](docs/inclusion-evidence.md)
- [Practical worksheet for genuine user research](docs/user-validation-guide.md)
- [Recorded demo and narration](docs/recording.md)
- [Hackathon entry checklist](docs/hackathon-checklist.md)
- [Inclusion-led English demo script](docs/demo-script.md)
- [Recording beat sheet](docs/video-beat-sheet.md)
- [Submission draft and release gate](docs/devpost-submission.md)
- [Tool reference](docs/tool-reference.md)
- [Adaptive Web Contract](docs/adaptive-web-contract.md)
- [Design and asset provenance](docs/art-direction.md)

Stack: React 18, TypeScript, Vite, hand-written CSS, locally bundled fonts, Vitest, Playwright
and axe-core. Changes belong in isolated branches/worktrees and should pass the checks above.

## License and build period

Source code is [MIT licensed](LICENSE). Bundled fonts retain their [SIL Open Font License
notices](public/third-party-licenses.txt); artwork provenance is recorded in
[art direction](docs/art-direction.md).

The first repository commit was made on **September 1, 2026** (`d49bf40`). The contract,
working websites, WebMCP registration, tests and recorded demonstration were developed in
this repository during the challenge's submission period. See the
[submission draft](docs/devpost-submission.md#built-during-the-submission-period) for the
development history and third-party building blocks.

The selected [79.6-second film](docs/recording.md) follows Alex and Lea's personal evening:
calm display settings, an aisle-seat correction, dinner timing and three illustrated dishes.
George voices Alex and Jessica voices the agent in one continuous, uncut performance. Speech
begins at 4.165 seconds; 32 English caption cues cover the complete dialogue. Visual changes
follow the spoken trigger in a warm cream layout with one fixed browser position. LUNA and
OLIVA appear in Alex's deliberately chosen calm view.

The 1920 × 1080, 30 fps captioned and clean exports, SRT, VTT, poster and local player are in
`tools/clickthru/out/warm-flow/delivery/`. Serve the player at `http://127.0.0.1:4382/` with
`node tools/clickthru/out/warm-flow/serve-player.mjs`. The earlier 112-second film is historical.

The [verification report](docs/verification.md) records separate component runs totaling
215 passing tests: 128 unit, 72 browser and 15 recorder tests. Eight focused browser cases
were rerun after the final CSS change. Public upload and final submission remain pending.
