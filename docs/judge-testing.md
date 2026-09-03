# Testing As I Am

No account, credentials, API key or payment is required. Alex and Lea, their shared history,
bookings and menu are fictional. Reload the experience to begin a fresh session.
See [verification.md](verification.md) for current build evidence and [recording.md](recording.md)
for the matching film and completed media checks. Neither this guide nor the playable demo
establishes public deployment or Devpost Submitted status.

## Entry points

Use the verified live URL supplied with the entry. Locally, use Node.js 22 or later, run
`npm ci`, then `npm run dev`. Ports 5273–5275 must be available.

| Experience | Development URL |
| --- | --- |
| A night for two — primary story | `http://localhost:5273/` |
| Advanced access choices | `http://localhost:5273/guided` |
| Direct LUNA Cinema | `http://localhost:5274/cinema` |
| Direct OLIVA Restaurant | `http://localhost:5275/restaurant` |

A production build defaults to `/`, `/guided`, `/cinema` and `/restaurant` on the serving
origin, unless venue URLs are configured separately. Follow **How this works → Open LUNA /
Open OLIVA** for the actual direct URLs. The development ports demonstrate separate origins;
they do not establish the topology of a published deployment.

## Try the personal story

1. Open `/` and inspect **Saved preferences**. Alex’s aisle preference and favorite risotto,
   Lea’s explicit peanut and avocado exclusions, and Alex’s earlier calm-view request are
   supplied fictional context. The migraine request applies to **today**, not next Friday.
2. Click **Plan our evening**. The cinema adopts the chosen dark appearance, lower glare and
   stopped animation. A 20:15 showing next Friday and a compatible dinner time are proposed.
   Alex is on the outside at F1, with Lea immediately inside at F2.
3. Click **One row further back**. Inspect G1–G2 and the updated price. Alex stays at the
   aisle. Use the cinema’s **Review selection**, then confirm the demo tickets yourself.
4. Click **Dinner, next**. The restaurant uses the confirmed date and film time. Its 18:00
   table leaves time for a 90-minute meal and 15-minute walk, arriving at 19:45 for 20:15.
5. Inspect three illustrated choices: mushroom risotto, chickpea salad and tomato orzo.
   The favorite is promoted only after filtering. The cards distinguish recipe declarations
   from **Kitchen confirmation open**. Open ingredients, **Full menu** or **Refine choices**.
6. Open **Your table**, inspect the staged review and confirm the demo table yourself.
   **Compare original view** remains available. Changing the appearance must preserve choices.

The home walkthrough executes labelled presets. It is not an embedded autonomous model.
**How this works** shows actual tool results and their transport. A demo-bridge result is not
native WebMCP execution. The next section tests a real external agent against the page tools.

## Native external-agent walkthrough

Use a WebMCP-capable browser. Keep the direct cinema and restaurant pages open as top-level
documents, and discover each page’s tools. Use returned inventory and receipt objects rather
than fabricating their contents. Final confirmation remains with the person.

### 1. Read the supplied context and apply the chosen calm view

On the primary home page, call `get_personal_evening_context` with `{}`. Inspect `simulated`,
`saved`, `today`, `planning_date`, `calm_profile` and `sites`. This is explicit fictional
example history, not retrieved memory about the person evaluating the app.

Open the returned direct cinema URL. Call `get_adaptation_capabilities` with `{}`, then
`apply_adaptation_profile` with the supported settings:

```json
{
  "profile": {
    "version": "0.1",
    "visual": { "color_scheme": "dark", "glare": "low" },
    "motion_media": { "reduce_motion": true, "disable_animation": true }
  }
}
```

Call `measure_rendered_ui` and `verify_profile_fit` with `{}`. Compare the actual rendered
appearance and motion settings with the result, including any partial or unsupported request.
Send the display profile, not Alex’s health message or the couple’s names.

### 2. Choose a showing, check dinner and propose aisle seats

Call `list_showings` with `{}`. It returns next week’s inventory and `default_date`, the Friday.
Use that returned date throughout the run. The following date is an example for planning on
September 3, 2026; replace it with the actual returned `default_date` before calling:

```json
{ "date": "2026-09-11", "time": "20:15" }
```

Pass that object to `select_showing`. Then call `get_available_seat_pairs`:

```json
{ "prefer_aisle": true, "row": "F" }
```

Inspect the returned `aisle_side`, `assignments`, seat IDs and complete pair price. The
F1–F2 pair assigns the user to F1 and spouse to F2. Show it with `prepare_seat_selection`:

```json
{ "pair_id": "F1-F2", "review": false }
```

Before ticket confirmation, check dinner on the direct restaurant page with `get_dinner_plan`.
Use the selected cinema date:

```json
{
  "date": "2026-09-11",
  "film_time": "20:15",
  "table_preference": "quiet",
  "plan_source": "selected"
}
```

This is read-only planning from a selected showing. Inspect the returned recommendation and
calculation; it does not reserve a table or verify a cinema confirmation.

Back on LUNA, act on the person’s request to move one row back: call `get_available_seat_pairs`
with `{"prefer_aisle":true,"row":"G"}`, then `prepare_seat_selection` with
`{"pair_id":"G1-G2","review":false}`. Check that the user is at G1 and spouse at G2.
Open the review using `{"pair_id":"G1-G2","review":true}`. Read `get_booking_state` with `{}`:
`booking_confirmed` must still be false. The person now uses the visible confirmation button.
Read the state again and retain its confirmed `date` and `film_time`.

### 3. Carry display preferences, then plan dinner from the confirmed showing

On LUNA, call `export_adaptation_receipt` with `{}`. On OLIVA, discover adaptation capabilities
and call `import_adaptation_receipt` with `{"receipt": ...}`, replacing the ellipsis with the
**exact returned receipt object**. Verify the profile fit and inspect the restaurant’s own
calm appearance.

Call `get_dinner_plan` again using the confirmed cinema date/time and `plan_source:"confirmed"`.
The date example still needs replacement with the actual booking date:

```json
{
  "date": "2026-09-11",
  "film_time": "20:15",
  "table_preference": "quiet",
  "plan_source": "confirmed"
}
```

Expect an available 18:00 quiet table, with dinner ending at 19:30 and arrival at 19:45.
The requested default arrival buffer is 15 minutes; the available slot leaves 30 minutes.
`cinema_confirmation_verified:false` makes the boundary explicit: the restaurant receives
context, not authenticated ticket proof. The external agent must read the confirmed cinema state.

Use the returned date, time and table ID with `prepare_table_selection`:

```json
{ "date": "2026-09-11", "time": "18:00", "table_id": "T4" }
```

This stages a review, not a confirmed reservation. An existing different table choice is kept
unless the person changes it explicitly. Confirmed bookings cannot be replaced through these tools.

### 4. Show three appropriate dishes without implying allergy safety

Call `get_restaurant_menu` with `{}` to inspect synthetic recipes, prices, ingredient completeness,
contains/may-contain declarations and current criteria. Research with `find_menu_options`, then
show the same request with `present_menu_for_user`:

```json
{
  "diet": "any",
  "max_price": 24,
  "avoid_allergens": ["peanuts", "avocado"],
  "favorite_dish_id": "mushroom-risotto",
  "limit": 3,
  "view": "focused"
}
```

Omit `view` for the read-only `find_menu_options` call. Expect three `recommendations`:
`mushroom-risotto`, `lemon-chickpea-salad`, `tomato-orzo`. `matches` retains the complete valid
set; `total_matches` reports its size. Check the following distinctions:

- The avocado and peanut bowl is excluded because both ingredients are explicitly declared.
- The market vegetable plate remains uncertain because its recipe information is incomplete.
- A favorite is not recommended when it conflicts with diet, budget or ingredient requirements.
- A recipe match still requires kitchen confirmation for an allergy. Missing information is
  not evidence of absence; possible cross-contact and unknown requirements remain unresolved.

Try a refinement without `avoid_allergens`; the current exclusions must survive. An explicit
empty array clears them. Open **Full menu** and check that all source dishes remain reachable.
Return to **Your table** and let the person confirm the reviewed demo reservation. Read
`get_booking_state` to distinguish the final confirmed state from the earlier proposal.

## Keep the information boundaries visible

The functional receipt carries display preferences, not names, a diagnosis, allergies, favorite
food, budget, selected seats or table details. Date/time and explicit ingredient constraints are
separate task inputs. Native discovery, validation and returned measurements are technical
proofs; they are not a migraine treatment, allergy certification or evidence of user-research outcomes.

The prototype supports these participating venues. It contains no embedded model or production
memory service and does not adapt arbitrary websites. `/guided` retains the broader pointing,
reading and cognitive-support controls for additional exploration.

## Paste-ready external-agent request

> Read the fictional Alex and Lea context on the As I Am home page. Plan next Friday’s movie
> night with dinner first. Discover the direct venues’ native tools. Use Alex’s requested calm
> display settings for today; keep his health message and names out of site requests. Find the
> 20:15 showing and check dinner availability. Put Alex at the aisle beside Lea, show the pair,
> then move one row back when requested. Leave ticket confirmation to the person. Read the
> confirmed date and time, transfer only the functional display receipt and propose an 18:00
> quiet table if available. Show three dishes for the explicit peanut and avocado exclusions,
> prioritizing mushroom risotto only if it matches. Keep kitchen questions, full menu access and
> final confirmation visible. All people, history and bookings in this scenario are fictional.

## Compact Devpost testing field

> No login, credentials, API key or payment is needed. Start at the submitted live URL’s home
> page and inspect Saved preferences, then choose Plan our evening. Try One row further back,
> confirm the demo tickets, and continue with Dinner, next. Inspect the three menu cards,
> ingredient details and full menu, then confirm the table yourself. How this works exposes
> actual results and direct venue links for native WebMCP testing. The walkthrough is a labelled
> preset; real external agents use the direct cinema and restaurant tools. Alex and Lea, their
> history and all bookings are fictional. Use /guided for advanced access choices. The linked
> judge guide, verification report and recording report provide exact inputs and current evidence.
