# Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (Chrome 149+ with WebMCP testing flag — or any browser) │
│                                                                  │
│  Agent (ChatGPT / any MCP client)                               │
│    │  tool calls (JSON args → JSON string results)              │
│    ▼                                                            │
│  document.modelContext.registerTool(...)   ← src/webmcp/register.ts
│    │                ▲                                           │
│    │                │ ?agent=1 dev harness (same dispatch)      │
│    ▼                │                                           │
│  src/adaptive-contract/tools.ts  — 31 tool handlers (single source)
│    │            │              │               │                │
│    ▼            ▼              ▼               ▼                │
│  schema.ts   profile.ts     privacy.ts      receipts.ts         │
│  (v0.1 JSON  (merge, clamp, (diagnosis-term (portable,           │
│   schemas)   validate)      scanner)        diagnosis-free)     │
│    │                                                            │
│    ▼                                                            │
│  AdaptationEngine (src/engine) — atomic, undoable ops            │
│    │  CSS custom properties + data-attributes on <html>          │
│    │  + React-level structure (nav reduction, labels, steps,     │
│    │    reading modes, status pills)                             │
│    ▼                                                            │
│  Two demo sites over one contract                                │
│    /shop  (Hearth & Signal — commerce)                           │
│    /services (City of Meridian — administration)                 │
│                                                                  │
│  measurements.ts — measures the REAL rendered DOM               │
│  → verify_profile_fit closes the loop: observe→adapt→measure→   │
│    refine                                                        │
└──────────────────────────────────────────────────────────────────┘
```

## Key decisions

- **One handler source.** WebMCP, the `?agent=1` harness and the demo panel all call
  `dispatchTool()`; behaviour cannot diverge.
- **Tokens, not selectors.** Agents send semantic keys; `profileToTokenOps()` maps them
  onto design tokens + document flags; components render structural changes from the
  engine store (`useSyncExternalStore`, cached snapshots).
- **Session-only state.** The engine, shop and activity stores are in-memory modules.
- **Measurement over promise.** Every claim ("targets ≥ 52px") is verified against the
  rendered DOM and reported back with real numbers.
- **Stack:** Vite, React 18, TypeScript, hand-written CSS (custom properties), no CSS
  framework, self-hosted fonts (Fraunces, Instrument Sans, Atkinson Hyperlegible), Playwright
  + axe-core for tests. Fully static-hostable.

## Repository map

```
src/adaptive-contract/  schema, profile, capabilities, tools, measurements, receipts, privacy
src/engine/             adaptationEngine (state/undo/sync), tokens mapping, speech
src/webmcp/             register.ts (document.modelContext bridge), types
src/pages/              Landing, ShopPage, ServicesPage
src/components/         Panels (demo/activity), Icons, Artwork, Primitives, SiteChrome
src/data/               synthetic catalog, services data, session stores
tests/unit/             contract + tool-smoke suites (Vitest)
tests/e2e/              demo loop, portability, axe, keyboard, WebMCP shim (Playwright)
docs/                   contract, privacy, accessibility, demo, tool reference, this file
```
