# Architecture

## Runtime flow

```text
native WebMCP agent        90-second proof         ?agent=1 harness
document.modelContext      JudgeMode.tsx            advanced controls
          │                      │                         │
          └──────────────────────┼─────────────────────────┘
                                 ▼
                    dispatchTool(name, arguments)
                    schema + privacy validation
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
      universal adaptation tools              semantic page tools
              │                                     │
              ▼                                     ▼
       AdaptationEngine                     shop/services stores
       atomic in-memory state                reversible domain state
              │                                     │
              └──────────────────┬──────────────────┘
                                 ▼
                  CSS tokens + document flags
                     + React component state
                                 │
                    wait for committed render
                                 ▼
             rendered measurement + profile fit report
```

Native WebMCP, judge mode and the harness are entry points, not separate implementations.
They share the same dispatch, validation, handlers and measurement code.

## Main boundaries

### Contract boundary

`src/adaptive-contract/schema.ts` defines the versioned functional profile. Tool inputs are
validated before dispatch; page capability sets are derived for the active route. The contract
describes function, never selectors or replacement CSS.

### Rendering boundary

`src/engine/adaptationEngine.ts` owns the merged profile, operation version, undo history and
announcement state. `src/engine/tokens.ts` maps supported fields to site-owned CSS custom
properties and document attributes. Components subscribe to the engine for structural changes
such as reduced navigation, persistent labels, guided steps and reading presentation.

### Evidence boundary

Mutating adaptation tools wait for the React update and next paint before returning rendered
measurements. `src/adaptive-contract/measurements.ts` excludes judge/demo chrome and measures
the effective interactive target for labelled native controls. `verify_profile_fit` grades only
signals that can be evidenced, and reports partial or unsupported preferences explicitly.

### Domain boundary

Semantic tools operate through the same state rendered by each page: shop search and filters
change the visible catalog, task focus maps public task IDs to page regions, and risky cart
changes remain staged for human confirmation.

## Repository map

```text
src/adaptive-contract/  schema, capabilities, tools, measurements, receipts, privacy
src/engine/             adaptation state, token mapping, read-aloud support
src/webmcp/             document.modelContext bridge and browser types
src/pages/              landing, comparison shop, resident-services portal
src/components/         judge mode, advanced panels, site chrome, primitives, artwork
src/data/               synthetic domain data and in-memory stores
src/styles/             shared system, route themes, adaptation and proof presentation
tests/unit/             contract, privacy, engine, measurement and domain-state checks
tests/e2e/              product loops, portability, accessibility and registration
docs/                   product, standards, privacy, submission and demo material
```

## Deliberate decisions

- **Site ownership:** the agent sends semantic intent; each site controls its visual language.
- **Atomic operations:** one tool call produces one undoable state transition.
- **Rendered truth:** success is not inferred from requested tokens when a measurable browser
  signal exists.
- **Visible refusal:** unsupported or unmet preferences are part of the result, not hidden logs.
- **Validated portability:** the destination validates the full receipt and capability-negotiates
  its profile before applying the supported subset.
- **Progressive disclosure:** the main path is one guided proof; the full profile library and
  raw harness remain available as advanced inspection surfaces.
- **Static delivery:** React, TypeScript and Vite produce a host-agnostic static SPA.

## Current topology and next boundary

`/shop` and `/services` are intentionally different product surfaces but currently share one
bundle, engine instance and origin. This proves reuse across components, not independent-site
interoperability. The next architectural milestone is to extract the contract into a small
package and deploy two independently built example origins against the same conformance fixture.
