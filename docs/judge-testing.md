# Testing As I Am

No account, credentials, API key or payment is required. Seats, bookings, menu dishes and
example preferences are fictional. Reloading starts a fresh session.

This revision puts person-chosen access needs first. Its controls and native calls are verified;
a matching recording is blocked by the browser recording security failure; the 117-second video covers the previous revision. The
[verification report](verification.md) identifies the build and scope of completed checks.
The [inclusion evidence guide](inclusion-evidence.md) distinguishes technical evidence from
research with disabled people, which has not yet been conducted.

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

## Start with the person's access request

Select any combination of **Make pointing easier for me**, **Make reading easier for me** and **Give me less to process**,
then explicitly apply the choice with **Make it easier →**. Changed support uses
**Update my support**. With all choices deselected, **Use original view** retains access to the
journey. These are functional requests, not disability categories.
The same person can change their request; different people may prefer different combinations.
No diagnosis should be requested or inferred.

| Choice | Requested adaptation | What to inspect |
| --- | --- | --- |
| Make pointing easier for me | 56 CSS-pixel minimum targets, 12 CSS-pixel spacing, strong focus | Actual target dimensions, keyboard focus and any unmet spacing request |
| Make reading easier for me | 1.3 text scale, 1.7 line height and the readable font | Readable text, reflow and retained content at the tested viewport |
| Give me less to process | Step-by-step view, nonessential content hidden and reduced motion | A focused flow with the same essential information and reachable original view |

Inspect **Original** and **My view**. Add or remove a choice and apply again. Check that the
result reflects the new request while retaining the person's seat or table selection. Removing
a choice clears its earlier support; carrying the receipt must not reintroduce it. An
applied profile is not proof that every requested measurement fits: inspect the measurement
and fit responses, including partial results.

## Native tool walkthrough: the primary WebMCP check

Use a real external agent in the direct LUNA page. Ask for **Make pointing easier for me** and
**Give me less to process**, leaving **Make reading easier for me** for a later change. Discover tools, call
`get_adaptation_capabilities` with `{}`, and inspect support. Send the supported fields through
`apply_adaptation_profile`:

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

Call `measure_rendered_ui` and `verify_profile_fit` with `{}`. Compare the visible page with
the returned target size, overflow and partial or unsupported fields. Retain a readable
native-tool request/result and the corresponding UI in the evidence. Measurements describe
the tested build and viewport, not a universal accessibility score or a user-benefit result.

Call `get_available_seat_pairs` with `{}`. In a choose-for-myself request, present those options
before preparation. If the person explicitly delegates choosing a compatible pair, follow their
criteria and explain the proposed selection. Call `prepare_seat_selection` with the returned
`pair_id`; its result requires human confirmation. `get_booking_state` must still show a review
until the person uses the visible confirmation button. No confirmation tool exists; this is a
boundary of the supplied tool contract, not a browser-wide restriction on an external agent.

With permission, call `export_adaptation_receipt` on LUNA and retain its returned `receipt`.
Open direct OLIVA, discover its capabilities, then pass that exact object to
`import_adaptation_receipt` in the `receipt` field. Inspect accepted and unsupported preferences
and the restaurant's actual view. Check both pages' visible transport status: a fallback bridge
call does not establish native execution.

Now ask for **Make reading easier for me** as well. Discover support before applying these additional
fields through `apply_adaptation_profile`:

```json
{
  "profile": {
    "version": "0.1",
    "visual": {
      "text_scale": 1.3,
      "font_style": "readable",
      "line_height": 1.7
    }
  }
}
```

The profile application merges supplied fields. Confirm that the earlier supported pointing
and cognitive settings remain, inspect the visible text change, then measure and verify again.
Existing selections must remain intact. Compare the original view and the full menu. Do not
equate larger text with complete low-vision or screen-reader support.

## Guided path one: Help me choose

1. Select **Help me choose**. Try the original seat map, choose the access requests above,
   and explicitly apply them. Adaptation preserves the selected pair. Compare **Original**
   and **My view** and try adding **Make reading easier for me**.
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

## Guided path two: Prepare for me

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

## Optional native dinner and menu check

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

The receipt must contain no diet, budget, allergen requirements, seat IDs or table selection.
The film time for dinner planning is a separate domain input. `present_menu_for_user` changes
the visible menu using separate task inputs; it does not add those inputs to the functional receipt.
The [tool reference](tool-reference.md) documents tool inputs and results.

## Paste-ready agent request

> Help me arrange two adjacent cinema seats. I want easier pointing and less to process:
> request 56-pixel minimum targets, 12-pixel spacing, strong focus, step-by-step content,
> hidden nonessential content and reduced motion where supported. These are my interface
> preferences; do not infer a diagnosis. Ask whether I want to choose myself or want you to
> research and prepare a proposal. Discover the direct LUNA site's WebMCP tools, inspect
> its supported adaptations, apply my request and measure the result. Explain any unmet
> field using the returned evidence. Prepare a seat review according
> to my chosen level of help; never confirm for me. Once I have confirmed the tickets, read
> that confirmed state. With my permission, use only its film time to plan dinner at OLIVA,
> allowing 90 minutes to eat, 15 to walk and at least 15 minutes of arrival buffer. Explain the
> proposed time and table. Use the editable example request only after I accept or change it;
> do not assume diet, budget, table preferences or allergies about me. Show source-backed menu
> options and any questions for the restaurant. Carry interface preferences only with my
> permission, in a separate functional receipt. Keep food requirements and booking details out
> of that receipt. Let me inspect the full menu and confirm the table myself. When I ask for
> easier reading, add supported 1.3 text scale, 1.7 line height and the readable font, retaining the other
> preferences and my selections. Measure again and let me compare the original view.

## Browser support and limits

If tools are unavailable inside frames, open the direct site links for native calls. The
labelled demo bridge uses the same validated handlers but is not native execution evidence.
`?agent=1` is a development harness, not a substitute for a successful native browser call.

A single-host deployment uses separate documents on one origin; the local setup uses three.
The interface states the actual topology. The sites share an implementation and synthetic
fixtures. Receipts are unsigned session objects and functional preferences can be sensitive.
Automated scans do not replace assistive-technology testing or research with intended users.

## Compact Devpost testing field

> No login, credentials or payment required; all bookings and example task preferences are
> fictional. Select and apply any combination of “Make pointing easier for me”, “Make reading easier for me” and
> “Give me less to process”. Compare Original/My view and change your request while retaining your
> selections. For native proof, use “Use WebMCP” to open direct LUNA and OLIVA pages in a
> WebMCP-capable browser. Have a real external agent discover capabilities, apply requested
> preferences, measure the visible result, then transfer a functional receipt with permission.
> Inspect partial results. Choose “Help me choose” or “Prepare for me”; the person confirms
> demo bookings. Guided buttons use labelled presets, not an embedded language model. Optional
> dinner planning uses confirmed film time separately; food and booking data stay out of the
> receipt. Full menu/manual choices remain available. Reload for a fresh session. See the
> linked judge guide and verification report for exact steps, recorded build and known limits.
