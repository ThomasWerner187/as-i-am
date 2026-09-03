# Testing As I Am

No account, credentials, API key or payment is required. All seats, table times and bookings
are fictional. Reloading the page starts a fresh session.

The main experience is a guided cinema-and-dinner evening. For native agent testing, open
each participating site as a top-level document in a WebMCP-capable browser. The guided
controller and its embedded frames may have different native tool availability.

## Entry points

Use the verified public controller URL from the submission. Its **Use WebMCP ↗** panel
contains the agent request and direct links to LUNA and OLIVA. Public URLs are not yet
recorded in this repository; publication and logged-out checks remain release gates.

For a local evaluation, run `npm ci` and `npm run dev` with Node.js 22:

| Page | Local URL | Native tools |
| --- | --- | --- |
| Guided experience | `http://localhost:5273` | 2 navigation/context tools |
| LUNA Cinema | `http://localhost:5274/cinema` | 19 adaptation and booking tools |
| OLIVA Restaurant | `http://localhost:5275/restaurant` | 19 adaptation and booking tools |

Keep ports 5273–5275 available. The launcher refuses to stop unrelated servers.

## Guided walkthrough — about two minutes

1. On the original LUNA seat map, choose two adjacent available seats, such as F6 and F7.
2. Click **Make it easier →**. The map becomes three large pair choices and keeps the seats
   already selected. Compare **Original** and **My view**.
3. Click **Review selection**, inspect the complete price, then use the visible
   **Confirm demo tickets** button yourself.
4. Click **Continue to dinner →**. The restaurant still shows its original time grid;
   navigation alone does not transfer preferences. Choose 18:30 if it is not already selected.
5. Click **Use my preferences here →**. OLIVA accepts the supported functional preferences,
   keeps its own design and preserves the selected table time. Review and confirm the demo table.
6. Open **How it works**. The readable receipt shows what crossed between sites; expand
   **Actual tools & data** to inspect the requests and results. Try **Larger text** and **Undo**.

The guided buttons run preset requests. The visible transport label identifies native tool
execution or the demo bridge. A bridge result is not evidence of native WebMCP execution.

## Native WebMCP walkthrough

Open the direct LUNA page in a WebMCP-capable browser and let an external agent discover its
tools. Discovery should show 19 page-specific tools, including `get_adaptation_capabilities`
and `prepare_seat_selection`. The top-level controller only has navigation/context tools.

1. Call `get_adaptation_capabilities` with `{}`. Check support before requesting adaptations.
2. Call `apply_adaptation_profile` with this functional profile:

   ```json
   {
     "profile": {
       "version": "0.1",
       "interaction": {
         "minimum_target_size": 56,
         "target_spacing": 12,
         "focus_strength": "strong"
       },
       "cognitive": {
         "step_by_step": true,
         "hide_nonessential": true
       },
       "motion_media": {
         "reduce_motion": true
       }
     }
   }
   ```

3. Call `measure_rendered_ui` and `verify_profile_fit` with `{}`. Inspect the actual target
   measurements, overflow and any partial or unsupported preferences. The example asks for
   56px targets; the report is evidence for this rendered viewport, not a universal score.
4. Call `get_available_seat_pairs` with `{}`. Show the returned choices to the person. After
   they choose, call `prepare_seat_selection` using that returned `pair_id`.
5. Call `get_booking_state` with `{}`. The booking should be at `review`, with
   `requires_human_confirmation: true` returned by preparation. The person confirms through
   the visible interface. No confirmation tool is registered.
6. Ask permission to carry the functional preferences to OLIVA. Call
   `export_adaptation_receipt` and retain the complete returned `receipt` object. It contains
   functional preferences and metadata, not seat selections, identity or personal reasons.
7. Open the direct OLIVA page, discover its tools and call `get_adaptation_capabilities`.
   Call `import_adaptation_receipt` with the exported object in its `receipt` field. Inspect
   the accepted profile, unsupported fields and measured fit. Do not fabricate a new receipt.
8. Call `get_available_table_times` with `{}`. After the person chooses a returned time,
   call `prepare_table_selection` with that `time`. Inspect the review; the person confirms
   through the visible **Confirm demo table** button.

All tool results are JSON strings. Argument schemas reject unknown fields and wrong types.
The [tool reference](tool-reference.md) documents the complete inputs and result fields.

## Paste-ready agent request

> Help me plan a cinema-and-dinner evening. Open the direct LUNA Cinema link and discover
> its WebMCP tools. I want larger click targets, one step at a time, and less visual clutter.
> Apply only supported functional preferences, measure the rendered result, and explain or
> correct any unmet requests. Show me available adjacent seat pairs and let me choose.
> Prepare a review, but never confirm a booking for me. Ask before carrying only my functional
> adaptation receipt to the direct OLIVA Restaurant page. Discover OLIVA's capabilities,
> import what it supports, and show me dinner times. Do not send personal reasons, identity
> or cinema selections to the restaurant. Let me review and confirm the table myself.

## Browser support and limits

If the controller cannot discover tools inside frames, follow the direct site links for
native calls. The guided bridge still demonstrates the same validated handlers and is
labelled accordingly. `?agent=1` is a development test harness; it does not prove native
browser execution. Native discovery/execution errors are surfaced rather than silently
retried through the bridge.

A single-host deployment uses separate documents on one origin. The local development setup
uses three origins; a public three-host deployment can preserve that boundary. The interface
reports the actual topology. The sites share this implementation and are not independent
third-party integrations.

The app keeps preferences in session memory. Receipts are unsigned prototype objects, and
functional preferences can still be sensitive. Automated accessibility scans do not replace
assistive-technology testing or research with people who use adapted interfaces.

## Compact Devpost testing field

> No login or credentials required; all bookings are fictional. Open the live URL, choose
> adjacent cinema seats, click “Make it easier,” and compare Original/My view. Review and
> confirm the demo tickets yourself. Continue to dinner: preferences are shared only when
> you click “Use my preferences here.” Review and confirm the demo table. “How it works”
> exposes the functional receipt and actual tool results. For native WebMCP testing, use
> “Use WebMCP” to open the direct LUNA and OLIVA pages as top-level documents. Discover each
> site's 19 tools; apply supported preferences, measure the rendered UI, export/import the
> receipt with the person's permission, and prepare booking reviews. There is no confirmation
> tool. If embedded native tools are unavailable, the guided UI labels its demo bridge;
> test native calls on the direct pages. Reload for a fresh session.
