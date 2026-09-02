# Tool Reference — Adaptive Web Contract 0.1 (32 tools)

All tools take a JSON object and return a compact JSON **string**. Names ≤ 30 chars,
descriptions ≤ 500 chars (WebMCP limits). Registration: `document.modelContext.registerTool`
with `AbortController` lifecycle; the same handlers are reachable via `?agent=1`.
Errors: `{ ok: false, code, error }` with codes like `privacy_violation`, `unknown_tool`,
`not_found`, `bad_task`, `unknown_coupon`.

## Universal adaptation tools

| Tool | Input | Result |
| --- | --- | --- |
| `get_adaptation_capabilities` | – | contract+version, page id, page-specific `{key, domain, status, supported_values}`, unsupported domains |
| `get_adaptation_state` | – | `adaptation_version`, active preferences, parameter count, undo info |
| `apply_adaptation_profile` | `profile` (contract 0.1) | applied changes w/ explanations, unmet, warnings, measurements. Diagnosis terms → `privacy_violation`. Out-of-range → clamped + warning |
| `adapt_for_task` | `task`: `compare_products·understand_page·complete_form·review_price·find_information` | applies a task preset atomically |
| `tune_visual_presentation` | any of `text_scale 1–2.2`, `important_text_scale 1–2`, `line_height 1–2.2`, `letter_spacing 0–0.2`, `word_spacing 0–0.5`, `max_line_length 30–90`, `contrast`, `brightness 0.55–1`, `glare`, `color_mode`, `color_independent_status`, `font_style` | applied changes + warnings |
| `tune_interaction` | `minimum_target_size 44–60`, `target_spacing 8–32`, `keyboard_first`, `focus_strength`, `cursor_size 16–48`, `drag_alternatives`, `double_click_disabled`, `timeout_multiplier 1–4`, `error_tolerance` | applied changes |
| `tune_cognitive_support` | `information_density`, `maximum_primary_actions 2–5`, `step_by_step`, `hide_nonessential`, `persistent_labels`, `consistent_help`, `progress_indicators`, `plain_error_messages`, `confirmation_level` | applied changes |
| `tune_motion_and_media` | `reduce_motion`, `disable_animation`, `disable_autoplay`, `disable_parallax`, `mute_nonessential_audio`, `enable_captions`, `enable_transcripts`, `static_media_alternatives` | applied changes |
| `set_reading_mode` | `mode`, optional `speech_rate 0.5–2` | applied changes; original stays reachable |
| `measure_rendered_ui` | – | smallest body text (px), price text range, effective target, min action gap, sampled contrast, visible primary actions, running animations, horizontal overflow, occluded focusables, rendered signals and timestamp; demo chrome excluded |
| `verify_profile_fit` | optional `profile` (default: active) | `overall: satisfied·partially_satisfied·unsupported`, `partially_satisfied[]`, `unsupported[]`, `conflicts[]`, `suggested_refinements[]`, measurements |
| `undo_adaptation` | – | restores the exact previous state; `restored: false` if nothing to undo |
| `reset_adaptations` | – | base view (itself reversible via undo) |
| `explain_adaptation` | – | plain-language sentences of every current change + last operation |
| `export_adaptation_receipt` | – | closed-schema functional `receipt` with agent-local labels removed (contract, profile, stats, session privacy metadata) |
| `import_adaptation_receipt` | complete closed-schema `receipt` | validates contract, version, RFC 3339 timestamp, origin, profile, stats and privacy promise; applies the destination-supported/inherent subset and returns `receipt_accepted`, `receipt_origin`, `destination_page_id`, accepted count/profile, unsupported preferences, verification and measurements |

`receipt_origin` is claimed provenance from an unsigned demo receipt, not proof of issuer identity.

## Semantic page tools

| Tool | Input | Result |
| --- | --- | --- |
| `explain_page` | optional `detail_level: brief·full` | what/who/sections/tasks/costs/risks + tools hint |
| `list_available_tasks` | – | user-level tasks with `id`, `description`, serving `tool` |
| `summarize_content` | `scope: page·requests·appointments·comparison·products`, `detail_level`, `reading_level: plain·standard`, `include_prices`, `include_warnings` | summary + warnings |
| `read_content` | `scope`, optional `speak: true`, `rate` | structured speakable text; optional local TTS (Web Speech), text alternative always included |
| `focus_task` | page-listed `task_id` (or `null`) | maps a public task to a visible region; wrong-page and unknown IDs are refused; reversible |

## Domain tools (demo shop)

| Tool | Input | Result |
| --- | --- | --- |
| `search_products` | `query` | matches with price + total incl. shipping; updates the visible grid |
| `filter_products` | `category`, `max_price`, `tag`, `sort` | deterministic filtered results |
| `get_product_details` | `product_id` | description, plain version, key points, specs, full price breakdown, valid coupon codes |
| `compare_products` | `product_ids` (2–4) | price rows (totals), spec rows, cheapest verdict; differences in words, never colour-only |
| `explain_price` | `product_id`, optional `coupon_code` | item / original / discount / shipping / fees / coupon / **final total** + plain sentences |
| `calculate_total_cost` | `items[{product_id, qty}]`, optional `coupon_code` | deterministic grand total incl. shipping (once per order) and fees |
| `find_available_coupons` | optional `product_id` | **only** currently valid synthetic coupons (expired ones are never offered) |
| `apply_coupon` | `code` | validates against the synthetic list; `unknown_coupon` / `expired_coupon` otherwise |
| `read_comparison` | optional `product_ids`, `speak` | speakable comparison + cheapest/best-rated verdict |
| `prepare_cart_change` | `product_id`, `qty` | **stages** the change, shows a visible preview; requires explicit human confirmation in the page |
| `undo_cart_change` | – | cancels a staged change or removes the last cart item |

## Registration sketch

```js
if (document.modelContext) {
  const controller = new AbortController();
  for (const def of ALL_TOOLS) {
    await document.modelContext.registerTool({
      name: def.name,
      description: def.description,
      inputSchema: def.inputSchema,
      annotations: def.annotations,          // readOnlyHint, idempotentHint, …
      execute: (input) => dispatchTool(def.name, input),
    }, { signal: controller.signal });
  }
}
```
