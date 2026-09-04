# Architecture

## Runtime and trust boundaries

```text
External agent / guided controller (localhost:5273)
       │ explicit tool requests; user permits receipt transfer
       ├── LUNA document (localhost:5274/cinema)
       │      validate → own engine/store → own UI → rendered fit report
       └── OLIVA document (localhost:5275/restaurant)
              validate → own engine/store → own UI → rendered fit report
```

The two sites use the same source implementation, but separate documents, JavaScript state,
styles and local origins. They do not share a React store. Both frames stay mounted so switching
sites preserves each user selection. Only an explicit transfer operation exports/imports a receipt.
The fixed 20:15 film schedule is fixture data already present in both sites, not transferred booking data.

## Two transports, one handler boundary

Native registration uses `document.modelContext.registerTool` with an AbortController lifecycle
and `exposedTo: [controllerOrigin]`. The controller requests tools for the destination origin,
matches the tool’s origin and window, and invokes `executeTool` with serialized arguments.
Its frames delegate `allow="tools"`. See the
[Chrome imperative API documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api).

When the browser does not expose native tools in frames, the labelled guided fallback sends
messages only to the configured frame origin. Both endpoints validate origin, source window
and correlation ID. The site allows only its registered tool inventory, not arbitrary code or
confirmation actions. Native discovery/execution failures are reported without silent downgrade.
Original-view preview is a separate demo-only UI action.

Both paths reach `dispatchTool`: argument schema/privacy checks → page capability policy →
handler → committed render → measurement. `?agent=1` exposes this handler boundary for tests;
it is not proof of native transport. Top-level native calls are verified separately.

## State ownership

- `AdaptationEngine` owns merged preferences, version, history and temporary base preview.
- `EveningStore` owns seat/time choices and choose → review → confirmed stages.
- Selection is preserved across adaptation, refinement, preview and undo.
- Domain tools can stage reviews but cannot confirm. Only visible user controls confirm.
- `EveningShell` owns the active view, transport status, guided trace and transferred receipt.
  Child notifications contain only presentation status, not booking details.
- Each site registers 14 adaptation tools, two semantic tools and three domain tools.
  The controller registers only `get_evening_context` and `open_evening_site`.

## Files

| Area | Responsibility |
| --- | --- |
| `src/evening/EveningShell.tsx` | English demo, consent action, proof trace, agent entry point |
| `src/evening/BookingPage.tsx` | Site-owned transformation, choices, review/confirmation |
| `src/evening/state.ts`, `tools.ts` | Synthetic inventory, invariants, domain tools |
| `src/evening/bridge.ts`, `config.ts` | Native/fallback transport, origin configuration |
| `src/adaptive-contract/` | Schema, validation, capabilities, receipts, measurements and fit |
| `src/engine/`, `src/webmcp/` | Atomic adaptation and native registration lifecycle |
| `src/styles/evening.css` | Three distinct presentation layers and responsive adaptation |
| `tools/dev-experience.mjs` | Safe three-server launcher; stops only its own children |

## Deployment and limits

Vite produces a static SPA. Three separately configured hosts preserve origin separation.
A single host works as separate documents on one origin, and the UI states that explicitly.
Set all three `VITE_*` URLs as documented in the README; use secure origins and appropriate
frame/permissions policies for public deployment. No production authentication, payment,
reservation backend, signed receipt or browser-managed consent is implemented.

Legacy `/shop` and `/services` routes retain their original SPA engine. They remain regression
fixtures, accessed from `/legacy`, not the new portability demonstration.
