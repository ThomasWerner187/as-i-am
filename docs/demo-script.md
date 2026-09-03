# Demo script — inclusion, with help on my terms

The authoritative narration is [continuous-story.json](../tools/clickthru/continuous-story.json):
**304 English words**, intended for one continuous performance under three minutes. The opening
is 24 words, intended to land within about ten seconds. Final runtime and chapter timings must
come from the generated speech alignment; no new video has been measured yet.

The previous 93-second cut is an archive of the earlier flow. Record the integrated inclusion,
dinner-planning and menu experience before generating the replacement. See
[recording status](recording.md) and the [beat sheet](video-beat-sheet.md).

The story offers two forms of help: clearer information for independent decisions, and delegated
research with a proposal for review. Neither path removes the person's final say. The spoken
“I” belongs to a fictional demo scenario; it is not a user interview or evidence of a diagnosis.

## Opening, about ten seconds

Hold the original cinema and the two visible help choices. Start with the pitch immediately. Do not add an extra captured chapter for this opening hold.

Source chapter: opening hold (`null`).

> Let my agent help. Let me stay in charge. As I Am makes an ordinary night out easier to plan, with support I choose.

## An ordinary evening

Show the original working seat map. Choose F6 and F7 with the normal controls. The person has a goal, and the interface gives them several ways to pursue it.

Source chapter: `A night out, on my terms.`.

> I want two seats together and dinner before the film. Precise clicking and crowded information can make that harder. I should still get to shape my evening.

## Clearer information for my own choice

Keep Help me choose selected. Click Make it easier. Show the real larger pair controls and preserved selection; briefly compare Original / My view.

Source chapter: `Help me choose.`.

> Help me choose gives me larger seat choices and clearer information. The cinema keeps its own design and the seats I picked. I can return to the original.

## The person confirms

Open Review selection, pause on the complete price, then visibly click Confirm demo tickets. The recording must show the confirmation rather than imply that an agent completed it.

Source chapter: `My ticket, my decision.`.

> I review the full price and confirm my demo tickets myself. The same tools let an external agent prepare a review, while confirmation stays with me.

## Research and preparation by request

Select Prepare for me. Keep the editable Example request visible, then click Plan dinner from my tickets. The tickets must already be confirmed. This action is a guided preset demonstrating the agent workflow.

Source chapter: `Prepare for me.`.

> Now I ask for more help: Prepare for me. Using my confirmed film time, the guided workflow demonstrates an agent researching dinner options and preparing a table review.

## Explain the actual plan

Hold the actual itinerary: film 20:15; meal 90 min; walk 15 min; requested minimum buffer 15 min. Latest theoretical start 18:15 is unavailable, so 18:00 is proposed. The result arrives at 19:45, giving 30 min actual buffer. Do not animate an invented result over the page.

Source chapter: `A plan I can check.`.

> The film starts at eight fifteen. Allow ninety minutes to eat, fifteen to walk, and a buffer. Six o'clock is the latest available fit, getting me there thirty minutes early.

## Explicit example, source-backed menu

Show the visible vegan / €20 per dish example and matching menu dishes, including prices and source ingredient information. Show uncertainty if the example produces it; otherwise keep the restaurant-question wording visible without inventing an alert. No allergen is selected by default.

Source chapter: `Food preferences I choose.`.

> My editable example asks for vegan dishes within twenty euros each. The menu returns matching dishes with prices and ingredient information. Uncertain allergen or cross-contact questions belong with the restaurant.

## The complete menu and a reviewable proposal

Show Full menu, then My choices. Keep ingredient details reachable. Return to the table proposal, use Review suggested table, pause on it, then visibly Confirm demo table.

Source chapter: `My choices, my view.`.

> I can explore the full menu or switch to My choices. The agent reduces the research; I keep the information, the choice, and the final table confirmation.

## Separate interface and task information

Open How it works and its real receipt/data view. Show that the interface receipt excludes food and booking fields. Identify film time as a separate requested planning input; do not claim that no information ever passes between tasks.

Source chapter: `Only what each task needs.`.

> Interface preferences travel in a functional receipt. Food preferences and booking details stay out of it. Dinner planning receives the film time separately, because I asked it to.

## The WebMCP mechanism

Show Discover / Adapt / Carry and the actual planning/menu tool trace. Keep the native-versus-demo transport label visible. The narration explicitly describes preset guided requests and a separate native external-agent path.

Source chapter: `Why WebMCP matters.`.

> Web M C P makes those actions discoverable: understand the page, request changes, check the result, prepare a review. These buttons use preset requests; an external agent can call the native tools.

## Close on choice and the brand

Return to the hero and both help modes. Keep the free/open-source statement and original brand intact. Do not add commercial pricing, broad compliance badges or claims of user validation.

Source chapter: `The web adapts.`.

> Free and open source. More ways to take part, with help on my terms. As I Am. The web adapts. You don't have to.

## Recording requirements

Use the real interface and source tool results. Both mode labels must be visible at least once:
**Help me choose** and **Prepare for me**. Keep the editable **Example request** readable and
synthetic-data disclosure visible. Do not imply that the app guessed a person's food requirements,
that a menu filter guarantees allergy safety, or that an embedded LLM is running the guided buttons.

The capture must follow the source chapter names exactly and in order. The first spoken block
uses an opening hold; each subsequent block maps to one real capture marker. Preserve the user's
confirmation clicks and the full-menu comparison. Hold the itinerary long enough to read why
18:00 was selected and distinguish the requested 15-minute minimum from the actual 30-minute buffer.

Generate the entire script in one speech request. Preserve the performance and actual click-motion
speed; retime static holds rather than joining separate narration clips or stretching audio.
Review the completed video by watching and listening, then verify captions and runtime before
publication. A native WebMCP demonstration requires native tool calls in the browser; guided
preset footage must remain labelled as a guided demonstration.

## Native agent request

Use the [paste-ready request](judge-testing.md#paste-ready-agent-request). It asks which level
of help the person wants, discovers supported capabilities, checks the confirmed ticket state,
uses only required timing information for the dinner task and keeps food inputs outside the
functional receipt. The person confirms both bookings.
