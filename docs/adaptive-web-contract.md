# Adaptive Web Contract — Specification v0.1

*Transport: WebMCP (imperative API, `document.modelContext`). Status: demo draft for the OpenAI WebMCP Challenge 2026.*

## 1. Idea

Websites know what they can adapt; personal agents know what their user needs. The
Adaptive Web Contract is the narrow, standardized interface between them:

- The **agent** sends a closed *functional preference profile* with no diagnosis or identity field.
- The **website** declares which adaptations it supports, applies them through its own
  design tokens and components, *measures the rendered result*, and reports applied
  changes, warnings and real values.
- Everything is **atomic and undoable**; risky domain actions always need explicit human
  confirmation in the page.

## 2. The functional preference profile

JSON Schema: [`schemas/functional-profile-0.1`](../src/adaptive-contract/schema.ts)
(`profileJsonSchema()` emits the artifact). Six sections, all optional:

| Section | Keys (selection) |
| --- | --- |
| `visual` | `text_scale` (1–2.2), `important_text_scale`, `line_height`, `letter_spacing`, `word_spacing`, `max_line_length`, `contrast` (`normal·high·maximum`), `brightness`, `glare`, `color_mode` (`grayscale·protanopia-safe·deuteranopia-safe·tritanopia-safe·invert`), `color_independent_status`, `font_style` |
| `interaction` | `minimum_target_size` (44–60 px), `target_spacing`, `keyboard_first`, `focus_strength`, `cursor_size`, `drag_alternatives`, `double_click_disabled`, `timeout_multiplier`, `error_tolerance` |
| `cognitive` | `information_density`, `maximum_primary_actions` (2–5), `step_by_step`, `hide_nonessential`, `persistent_labels`, `consistent_help`, `progress_indicators`, `plain_error_messages`, `confirmation_level` |
| `motion_media` | `reduce_motion`, `disable_animation`, `disable_autoplay`, `disable_parallax`, `mute_nonessential_audio`, `enable_captions`, `enable_transcripts`, `static_media_alternatives` |
| `reading` | `mode` (`original·plain_language·key_points·step_by_step·read_aloud·bilingual_or_explained`), `speech_rate` |
| `safety` | `confirm_destructive`, `complete_price_totals` |

Rules:

1. The public wire schema exposes no free-text label, diagnosis, condition or identity field.
   Validation rejects unknown keys and wrong types; numeric values are clamped into range
   with a warning. A finite protected-term scanner adds defence in depth.
2. Profiles **merge** (later values win) so an agent can refine granularly.
3. Simplified content modes must keep the **original reachable** (per-card disclosure).

## 3. Capability discovery

`get_adaptation_capabilities` returns the site name, page id and every page-supported
capability as `{ key, domain, supported_values }` — semantic dotted keys
(`visual.text_scale`), **never CSS selectors**. Capability sets differ by route and mark
whether support is adaptive or inherent; unsupported domains are listed explicitly.

## 4. Application result

`apply_adaptation_profile` and the `tune_*` tools answer **after the UI actually changed**:

```json
{
  "ok": true,
  "operation_id": "op-…",
  "adaptation_version": 3,
  "applied": [{ "key": "visual.text_scale", "kind": "token", "from": "1", "to": "1.5", "explanation": "Text size increased to 150%." }],
  "unmet": [],
  "warnings": ["interaction.minimum_target_size clamped from 90 to 60 (contract range)."],
  "measurements": { "smallest_target_px": 52.3, "…": "…" }
}
```

## 5. Measurement & verification loop

`measure_rendered_ui` measures the **rendered** page after commit: smallest text, price text
sizes, effective click targets (including associated labels), minimum gap between adjacent
controls, sampled contrast, visible primary actions, running animations, horizontal overflow,
occluded focusables and inspectable rendered signals. Judge/demo chrome is excluded.
`verify_profile_fit` compares requested keys against those measurements and
reports `satisfied / partially_satisfied / unsupported`, conflicts and
`suggested_refinements`. This enables the real feedback loop:

observe → adapt → measure → refine → confirm.

## 6. Undo & reset

Every operation is a snapshot. `undo_adaptation` restores the exact previous state;
`reset_adaptations` returns to the normal base view (and is itself reversible). Tool
answers report the resulting `adaptation_version`.

## 7. Privacy principles

- The closed wire schema has no diagnosis or identity field. Validation plus the runtime
  term scanner in `privacy.ts` refuse unknown structure and known protected-health terms.
- Session-only state; no storage, no network for adaptation logic, no profile values in
  URLs or share links.
- `export_adaptation_receipt` strips agent-local labels and returns only the validated
  functional profile with session-scope privacy metadata. The prototype receipt is not a
  signed credential and its functional values can still be sensitive.
- `import_adaptation_receipt` validates the complete receipt again, applies only values the
  destination route supports, and reports unsupported values rather than silently dropping them.
- The site shows the user exactly which functional values it received.

## 8. Confirmation rules

Domain actions with real-world consequences (cart changes, submissions) are **staged**:
the tool returns a preview and the page waits for explicit human confirmation. Agents
cannot confirm on the user's behalf. `confirmation_level` can widen confirmation to all
actions.

## 9. Second-site example

The same contract and full receipt-import path are implemented by two visibly different demo surfaces in this repository:
`/shop` (commerce: filters, comparison table, coupons, cart) and `/services`
(administration: multi-step form, deadlines, request statuses, appointments). They are routes
in one prototype SPA and therefore demonstrate cross-surface reuse, not independent-origin
interoperability. See `tests/e2e/portability-a11y.spec.ts`.
