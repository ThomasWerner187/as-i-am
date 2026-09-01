# Demo Script (≈4 minutes)

**Setup:** Chrome 149+, `chrome://flags/#enable-webmcp-testing` enabled, dev server or
deployed URL open. Without the flag: use the `?agent=1` harness — same tools, same order.

## Beat 1 — The normal world (30 s)
Open `/shop`. Point out: deal ticker, 10-item navigation, icon-only controls, dense cards,
filters, comparison table, coupons. "A perfectly normal, rather exhausting shop."

## Beat 2 — The killer loop (90 s)
Send the agent (or click **Demo profiles → Precision & readability → Send as agent
would**):

> "I have low vision, a hand tremor, and I lose track of multi-step tasks. Make this page
> comfortable for me, but do not send my diagnoses to the website."

Narrate the activity timeline: capabilities → apply 26 preferences → measure. Show:
3 nav actions, visible labels, huge prices, 52px targets, no motion, guided steps.
Open the **"What this website received"** panel: functional values only.
Open **"Agent knows (never sent)"** vs the sent profile: the privacy gap, visible.

## Beat 3 — Granular refinement (45 s)
> "The text is still too small, especially the prices."

Agent: reads state → `tune_visual_presentation { text_scale: 1.8, important_text_scale: 1.6 }`
→ `measure_rendered_ui` → reports real rendered px. The **Hold to peek original** button
shows before/after live.

## Beat 4 — Colour & pain day (45 s)
Reset. Demo 3: "I cannot reliably distinguish red and green…" → statuses rebuild with
icons, labels, patterns (not a filter). Reset. Demo 4 (migraine): motion stops, glare
drops, page simplifies — framed as temporary session state.

## Beat 5 — The profile follows the person (60 s)
On `/shop`: `export_adaptation_receipt` (diagnosis-free). Navigate to `/services`
(completely different site: forms, deadlines, statuses).
> "Apply the same functional preferences you used on the shop."

Same transformation, page-appropriate. Banner: **"Preference profile applied without
sharing a diagnosis."**

## Beat 6 — Honesty (15 s)
Show the WebMCP status chip, the `?agent=1` harness, and the "Honest limits" section on `/`.

## Judge Q&A cheat-sheet
- **Why WebMCP?** Structured capability discovery + semantic tasks + measured results —
  a negotiation, not a settings panel, and no fragile DOM hacks.
- **What does the site learn?** The exact functional values on the panel. Nothing else.
- **Can the agent confirm a purchase?** No. Staging only; a human clicks.
