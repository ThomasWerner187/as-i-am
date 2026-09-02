# As I Am

**The web adapts. You don’t have to.**

As I Am is a working WebMCP prototype for a private, portable accessibility contract.
A personal agent can know *why* someone needs a different experience. A participating
website receives only *what it needs to change*: functional values such as text scale,
minimum target size, reduced motion or step-by-step presentation.

The important part is the feedback loop: the page applies those values through its own
design system, measures the rendered DOM, reports anything it could not satisfy, and lets
the agent refine or undo the result.

## See the whole idea in 90 seconds

Run locally, open the landing page, and choose **Run the 90-second proof**:

```bash
npm install
npm run dev
# open http://localhost:5273
```

The self-guided proof uses the real application and the same dispatch path as WebMCP:

1. Measure the unadapted comparison shop.
2. Discover the page’s supported capabilities.
3. Show the boundary between simulated private context and the exact functional JSON payload.
4. Apply the profile, wait for React to commit, and measure the rendered result.
5. Refine text to 180% in response to user feedback and verify again.
6. Export a diagnosis-free receipt, reset the shop, then validate and import the full receipt on a different product surface.

Direct proof URL: `http://localhost:5273/shop?judge=1`

## The product idea

Most accessibility settings stop at one operating system, browser, application or website.
People repeatedly configure the same needs, while sites cannot safely infer which changes
would help. As I Am introduces a narrow negotiation layer:

```text
private user context
        │ stays with the agent
        ▼
functional preference profile
        │ WebMCP tools
        ▼
site-owned design tokens and components
        │ rendered DOM measurements
        ▼
fit report → refinement → portable receipt
```

This is not remote CSS and it is not medical profiling. The agent describes function; the
site decides how that function maps into its visual language.

## Why WebMCP is essential

WebMCP makes the negotiation inspectable and page-specific:

- `get_adaptation_capabilities` tells an agent what this page genuinely supports.
- `apply_adaptation_profile` accepts a bounded, validated functional contract.
- `measure_rendered_ui` reports real text, target, spacing, action, motion and overflow signals.
- `verify_profile_fit` separates satisfied, partial and unsupported requests.
- tuning tools close the observe → adapt → measure → refine loop.
- `export_adaptation_receipt` and `import_adaptation_receipt` carry a validated functional receipt to the next participating surface.
- semantic page tools expose tasks and content without fragile selector guessing.

Native WebMCP and the built-in `?agent=1` harness both call the same handlers in
`src/adaptive-contract/tools.ts`; the fallback does not maintain a second implementation.

## What is implemented

- Two visibly different product surfaces, `/shop` and `/services`, implemented as routes in one prototype SPA.
- One versioned Adaptive Web Contract with visual, interaction, cognitive, motion/media,
  reading and safety domains.
- Route-specific capability discovery and strict JSON-boundary validation.
- Diagnosis-term rejection across dispatched tool arguments.
- Atomic adaptation operations with exact undo, reset and temporary base preview.
- Render-aware measurement after the UI has committed.
- Honest fit grading for measurable values and rendered signals.
- Working product search, filters, task focus, guided forms, price totals and staged cart changes.
- Session-only activity and adaptation state; no cookies, localStorage or analytics.
- A judge-facing proof mode plus advanced profile and developer harness controls.

The current tool inventory is registered through `document.modelContext.registerTool(...)`
when the experimental WebMCP API is present. See [the tool reference](docs/tool-reference.md)
for the full schemas.

## Privacy model

The prototype enforces the boundary in code:

- The profile schema has no medical, diagnosis or identity field.
- Unknown keys, wrong types and out-of-range values are rejected or explicitly reported.
- A runtime scanner blocks protected-health terms before a handler mutates state.
- Receipts are validated and scanned before export and again at the import boundary.
- The proof shows the exact payload the website receives.
- State exists in memory for the current session only.
- Risky domain actions are staged for explicit human confirmation.

The guided proof is honest about its topology: the “private agent” is simulated by demo
chrome in this repository. A production deployment would place the agent and participating
sites on separate trust boundaries. Details: [privacy model](docs/privacy-model.md).

## Architecture

```text
real agent / proof rail / ?agent=1 harness
                    │
                    ▼
         one dispatch + validation boundary
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
  Adaptive Web Contract   semantic page tools
          │                   │
          └─────────┬─────────┘
                    ▼
           AdaptationEngine
       tokens + flags + React state
                    │
                    ▼
          committed rendered DOM
                    │
          measurement + fit report
```

Stack: React 18, TypeScript, Vite, hand-written CSS, local font packages, Vitest,
Playwright and axe-core. The output is a static SPA. See [architecture](docs/architecture.md).

## Browser modes

**Native WebMCP:** use a compatible Chrome build with WebMCP enabled. The status indicator
shows how many tools were registered.

**Portable demo:** append `?agent=1` to any route. The harness invokes the same dispatch,
validation and measurement path without requiring an experimental browser API.

The app remains usable when neither mode is active.

## Quality checks

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Coverage includes contract validation, privacy rejection, rendered measurement, apply and
refine flows, exact undo, receipt portability, real search/filter state, keyboard operation,
normal and adapted axe scans, WebMCP registration, and the complete 90-second proof.

## Deployment

The app is static-hostable. `vercel.json` provides SPA route fallback for `/shop` and
`/services`; build with `npm run build` and serve `dist/`. Do not add a public demo URL to
the submission until the deployed route and native/fallback status have been verified.

## Honest limits and next milestone

- Participating sites must implement the contract; As I Am does not restyle arbitrary pages.
- WebMCP complements semantic HTML, WCAG and assistive technology. It does not replace them.
- The shop and services portal are currently routes in one prototype SPA, not independent origins.
- The private agent in judge mode is a clearly labelled simulation.
- Browser measurement can prove rendered properties; preference semantics without a reliable
  rendered signal are reported as unsupported or implementation-level evidence.
- All catalog, resident, profile and transaction data is synthetic.

The next product milestone is a small open specification package, a conformance fixture and
two independently deployed example sites so portability crosses a real origin boundary.

## Hackathon materials

- [Under-three-minute demo script](docs/demo-script.md)
- [Recording beat sheet](docs/video-beat-sheet.md)
- [Devpost-ready submission copy](docs/devpost-submission.md)
- [Adaptive Web Contract](docs/adaptive-web-contract.md)
- [Accessibility position](docs/accessibility-model.md)

## License

MIT — see [LICENSE](LICENSE).
