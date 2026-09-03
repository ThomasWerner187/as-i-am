# Testing As I Am

No account, credentials, API key or payment is required. Seats, bookings, menu dishes and
example preferences are fictional. Reloading starts a fresh session. The current inclusion
flow needs a new recording; the old 93-second video shows the earlier version.

## Entry points

Use the verified controller URL in the submission. **Use WebMCP ↗** contains the external-agent
request and direct site links. No public URL or Submitted status is established by this document.
For local evaluation, use Node.js 22, run `npm ci`, then `npm run dev`:

| Page | Local URL |
| --- | --- |
| Guided experience | `http://localhost:5273` |
| LUNA Cinema | `http://localhost:5274/cinema` |
| OLIVA Restaurant | `http://localhost:5275/restaurant` |

Ports 5273–5275 must be available. The guided controller exposes context/navigation tools;
booking, adaptation and menu tools belong to the participating site documents. For native
agent testing, open each direct site as a top-level page in a WebMCP-capable browser.

## Path one: Help me choose

1. Select **Help me choose**. Try the original seat map, then **Make it easier →**. Larger
   adjacent-seat choices preserve the selected pair. Compare **Original** and **My view**.
2. Pick a pair, inspect the complete price with **Review selection**, and click
   **Confirm demo tickets** yourself.
3. Use **Continue to dinner →**. The restaurant remains unchanged until an explicit adaptation
   action. **Use my preferences here →** carries only the functional interface receipt.
4. Inspect **Example request**: vegan, €20 per dish and a quiet table are editable fictional
   defaults. No allergen exclusions are selected by default. Change them if desired.
5. Click **Find dinner that fits →**. Inspect the timing calculation, suggested table and
   source-backed menu matches. Open **Menu** and compare **Full menu** with **My choices**.
6. Choose whether to use **Review suggested table**, inspect the review and confirm the demo
   table yourself. The menu remains available after confirmation.

The point of this path is better information and a usable interface for the person's own decisions.

## Path two: Prepare for me

Reload for a clean run, then select **Prepare for me**:

1. Inspect or edit **Example request**. Click **Prepare my seats →**. A compatible selection
   is preserved, or an available pair is proposed from the synthetic inventory. A review is
   prepared; the person still confirms the demo tickets.
2. Click **Plan dinner from my tickets →** after ticket confirmation. The workflow reads the
   cinema booking state and uses the confirmed film time as a separate dinner-planning input.
   Its visible hint also discloses carrying chosen interface preferences when needed;
   those preferences travel in their own functional receipt.
3. Inspect the proposed **18:00** table and the calculation: film at 20:15, 90-minute meal,
   15-minute walk and at least 15 minutes of arrival buffer. The latest theoretical start is
   18:15, but that slot is unavailable. An 18:00 meal ends at 19:30; arrival at 19:45 leaves
   **30 minutes of actual buffer**. Inspect the returned table's details as well as the time.
4. Compare the menu choices and their prices/ingredients against the explicit example request.
   Any uncertain allergen or cross-contact information belongs under **Ask the restaurant**.
5. Open **Review suggested table**. Inspect and confirm through the visible interface only
   if the proposal suits you. **Full menu** and manual choices remain available.

These guided controls demonstrate preset research and preparation. They are not footage or
output of an embedded autonomous language model. An external agent can perform the corresponding
native tool calls. The visible transport label distinguishes native execution from the demo bridge.

## Native tool walkthrough

Discover tools on the direct LUNA page. Call `get_adaptation_capabilities` with `{}` and
inspect support. To request larger targets and clearer steps, use `apply_adaptation_profile`:

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

Call `measure_rendered_ui` and `verify_profile_fit` with `{}`. Inspect actual target size,
overflow and any partial or unsupported fields. Measurements describe the tested viewport,
not a universal accessibility score.

Call `get_available_seat_pairs` with `{}`. In a choose-for-myself request, present those options
before preparation. If the person explicitly delegates choosing a compatible pair, follow their
criteria and explain the proposed selection. Call `prepare_seat_selection` with the returned
`pair_id`; its result requires human confirmation. `get_booking_state` must still show a review
until the person uses the visible confirmation button. No confirmation tool exists.

After the person confirms, call `get_booking_state` again and check `booking_confirmed` and
`film_time`. Obtain the person's request to plan dinner from that time. Open the direct OLIVA
page, discover its tools, then use the following domain tools:

| Tool | Example request | What to inspect |
| --- | --- | --- |
| `get_dinner_plan` | `{"film_time":"20:15","arrival_buffer_minutes":15,"table_preference":"quiet"}` | Recommended time/table, source availability, calculation and explanation |
| `get_restaurant_menu` | `{}` | Six source dishes, prices, ingredient/allergen metadata and completeness |
| `find_menu_options` | `{"diet":"vegan","max_price":20}` | Matching, excluded and uncertain results; reasons based on declared data |
| `present_menu_for_user` | `{"diet":"vegan","max_price":20,"view":"focused"}` | The actual visible menu changes to the chosen view and filters |
| `prepare_table_selection` | Use returned `time` and `table_id` | A staged table review requiring human confirmation |

Only pass the explicit food requirements the person has chosen. If they ask to exclude an
allergen, use `avoid_allergens` with codes returned by `get_restaurant_menu`. Unknown names remain
uncertain instead of being guessed. Do not infer
an allergy from vegan selection or presentation settings. Declared matches are not allergy-safe
certifications; incomplete data and possible cross-contact require a restaurant follow-up.

The native planning tool is read-only. It receives a film time but does not authenticate a ticket
or establish consent. The external agent must check the confirmed cinema state and the person's
request. The complete booking record is not required by the restaurant.

An existing table choice is preserved. If a different proposal would replace it,
`prepare_table_selection` returns `selection_exists`; the person must change that choice
explicitly in the visible interface. Reopening a review of the same choice is supported.

## Functional receipt transfer is separate

With permission, call `export_adaptation_receipt` on LUNA and retain its returned `receipt`.
Discover OLIVA's supported adaptations, then pass that exact object to
`import_adaptation_receipt` in the `receipt` field. Inspect accepted and unsupported preferences.

The receipt must contain no diet, budget, allergen requirements, seat IDs or table selection.
The film time for dinner planning is a separate domain input. `present_menu_for_user` changes
the visible menu using separate task inputs; it does not add those inputs to the functional receipt.
The [tool reference](tool-reference.md) documents tool inputs and results.

## Paste-ready agent request

> Help me arrange two adjacent cinema seats and dinner before the film. First ask whether I
> want clearer information to choose myself or want you to research and prepare a proposal.
> Discover the direct LUNA site's WebMCP tools and apply only supported interface preferences
> I request. Measure the result and explain any unmet request. Prepare a seat review according
> to my chosen level of help; never confirm for me. Once I have confirmed the tickets, read
> that confirmed state. With my permission, use only its film time to plan dinner at OLIVA,
> allowing 90 minutes to eat, 15 to walk and at least 15 minutes of arrival buffer. Explain the
> proposed time and table. Use the editable example request only after I accept or change it;
> do not assume diet, budget, table preferences or allergies about me. Show source-backed menu
> options and any questions for the restaurant. Carry interface preferences only with my
> permission, in a separate functional receipt. Keep food requirements and booking details out
> of that receipt. Let me inspect the full menu and confirm the table myself.

## Browser support and limits

If tools are unavailable inside frames, open the direct site links for native calls. The
labelled demo bridge uses the same validated handlers but is not native execution evidence.
`?agent=1` is a development harness, not a substitute for a successful native browser call.

A single-host deployment uses separate documents on one origin; the local setup uses three.
The interface states the actual topology. The sites share an implementation and synthetic
fixtures. Receipts are unsigned session objects and functional preferences can be sensitive.
Automated scans do not replace assistive-technology testing or research with intended users.

## Compact Devpost testing field

> No login or credentials required; all bookings, dishes and example preferences are fictional.
> Try “Help me choose” for larger seat choices and a readable full/focused menu. Try “Prepare
> for me” to prepare seats, confirm the demo tickets yourself, then “Plan dinner from my
> tickets.” Inspect the 18:00 table proposal, 20:15 film and 30-minute actual arrival buffer.
> The editable example defaults to vegan, €20 per dish and a quiet table; no allergy is inferred.
> Inspect prices, ingredients and questions for the restaurant, then review and confirm the
> demo table yourself. Use “Use WebMCP” for direct LUNA/OLIVA links and native tool discovery.
> Agents can research, adapt, measure and prepare reviews; no booking-confirmation tool exists.
> Guided buttons use labelled presets. Functional receipts contain no food or booking data;
> the requested dinner task receives film time separately. Reload for a fresh session.
