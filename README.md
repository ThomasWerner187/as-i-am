# As I Am

**The web adapts. You don’t have to.**

One evening. Two websites. Your agent makes tiny cinema seats easier to choose, then carries
the same functional preferences to a restaurant. Different designs, familiar comfort.
The site receives how its interface should change—not your personal reasons.

## Try it

```bash
npm ci
npm run dev
# Open http://localhost:5273
```

This starts three separate local origins. Ports 5273–5275 must be available; the launcher
will not stop existing servers. Run one server manually with `npm run dev:site -- --port 5274`.

| Experience | Address |
| --- | --- |
| Guided demo / agent entry point | http://localhost:5273 |
| LUNA Cinema | http://localhost:5274/cinema |
| OLIVA Restaurant | http://localhost:5275/restaurant |

1. Notice the working seat map. Click **Make it easier →**.
2. The map becomes three large adjacent-pair choices. Choose one; review and confirm the demo tickets yourself.
3. Click **Use my preferences at dinner →**. Only the functional receipt crosses the boundary.
4. OLIVA presents large dinner-time choices in its own design. Select and confirm a demo table.
5. Try **Larger text**, **Original**, **Undo**, and **How it works**.

All bookings are fictional. There is no payment, real reservation or personal-data collection.

## Native WebMCP, not an invented agent

Each site registers 19 page-specific tools through `document.modelContext.registerTool`.
An external agent can discover capabilities, apply a validated profile, measure the rendered
result, refine it, and export/import a functional receipt. Booking tools find actual synthetic
inventory and prepare a review. **There is no confirmation tool.**

The guided buttons run preset requests, not an embedded language model. They use native
`getTools` / `executeTool` when available in the participating frames; otherwise they use an
explicitly labelled, source-and-origin-checked demo bridge to the same validated handlers.
Native failures are surfaced, not silently retried through the fallback.

Use **Use WebMCP ↗** for the English request and direct site links. Some browsers expose
native WebMCP only to top-level documents. In that case, use the direct links for native calls;
do not describe the embedded guided view as native. See [verification](docs/verification.md).

## What makes the protocol useful

- **Discover:** each page reports supported, inherent and unsupported preferences.
- **Adapt:** functional values map into the website’s own components and design tokens.
- **Measure:** tools wait for rendering and report targets, text, gaps, motion and overflow.
- **Refine:** change only what needs improvement; undo preserves the booking selection.
- **Carry:** the next site validates the receipt and accepts only its supported subset.
- **Choose:** the person owns the final decision and the explicit preference-transfer action.

This is a prototype contract for participating websites, not an automatic restyler for arbitrary
sites. Measurements are evidence for specific rendered properties, not a complete accessibility
audit. Functional preferences can still be sensitive. Receipts are unsigned session objects,
not credentials. See [privacy](docs/privacy-model.md) and [architecture](docs/architecture.md).

## Build, test and deploy

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
```

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

The previous examples remain at `/legacy`, `/shop` and `/services`. Existing shop/services
screenshots and `demo-clickthru.mp4` document that older version; they are not footage of
the new cinema/restaurant experience.

## Presentation materials

- [Recorded demo and narration](docs/recording.md)
- [Hackathon entry checklist](docs/hackathon-checklist.md)
- [Two-minute English demo script](docs/demo-script.md)
- [Recording beat sheet](docs/video-beat-sheet.md)
- [Submission draft and release gate](docs/devpost-submission.md)
- [Tool reference](docs/tool-reference.md)
- [Adaptive Web Contract](docs/adaptive-web-contract.md)
- [Design and asset provenance](docs/art-direction.md)

Stack: React 18, TypeScript, Vite, hand-written CSS, locally bundled fonts, Vitest, Playwright
and axe-core. Changes belong in isolated branches/worktrees and should pass the checks above.
