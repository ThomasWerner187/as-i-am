# Demo script — a night for two

The selected film is **79.6 seconds**, 1920 × 1080 at 30 fps, with **32 English
caption cues**. The first voice begins at **4.165 seconds**. George voices Alex and Jessica
voices the agent in one continuous two-voice performance. The dialogue master is uncut, runs
at its original speed and ends at 75.569 seconds; there is no dialogue splice or time-stretch.

Alex and Lea are fictional. Their explicitly shared example history explains why the agent
knows Alex's preferred view, seating preference, favorite dish and Lea's ingredient exclusions.
The film shows the websites changing in response while Alex remains part of each decision.

## Exact spoken dialogue

The performance directions in `dialogue.json` shape delivery but are not spoken. The text below
matches `spoken-dialogue.txt` exactly.

| Voice | Exact words |
| --- | --- |
| George · Alex | Could we plan a movie night for Lea and me next week? Dinner before the film, if we can. |
| Jessica · Agent | Of course. And because the migraine is bothering you today, I'll keep the planning view calm — dark, low-glare, and still. You can change any part of the plan. |
| George · Alex | Thank you. What does Friday look like? |
| Jessica · Agent | There's an eight-fifteen showing. That leaves time for dinner first. I found two seats together: you're at the aisle, with Lea right beside you. |
| George · Alex | Could we move one row further back? |
| Jessica · Agent | Of course. Row G instead — same arrangement. You're still at the aisle. Have a look. |
| George · Alex | That's right. Let's keep those. |
| Jessica · Agent | Done. For dinner, there's a quiet garden table at six. Your mushroom risotto is on the shortlist — plus two other dishes. None lists peanut or avocado in the recipe, but the kitchen still needs to confirm cross-contact. |
| George · Alex | Perfect. Let's book the table. |
| Jessica · Agent | All set. One evening, planned together — with the web adapting around you. |

## Exact picture triggers

These points come from `tools/clickthru/out/warm-flow/story-timing.json`. Each visual response
appears only after its subject has entered the spoken conversation.

| At | Picture state |
| ---: | --- |
| 0.000 | Warm opening; no speech yet. |
| 4.165 | Alex's first audible words. |
| 6.407 | Supplied fictional context. |
| 17.936 | Calm display preferences applied. |
| 28.029 | Friday 20:15 showing. |
| 32.578 | F1/F2 aisle pair. |
| 39.867 | Alex's G1/G2 correction. |
| 49.548 | Tickets confirmed. |
| 51.228 | OLIVA in the same chosen calm view. |
| 54.748 | 18:00 quiet garden table. |
| 55.452 | Three pictured menu recommendations. |
| 63.088 | Kitchen cross-contact confirmation remains open. |
| 68.668 | Table confirmed. |
| 70.349 | The complete evening. |
| 72.889 | Closing frame. |
| 75.569 | Spoken dialogue ends. |
| 79.600 | Film ends. |

## Picture language and claim boundaries

The film uses a warm cream frame, one fixed browser position and consistent scale. It avoids
pans and rapid reframing. LUNA and OLIVA appear in Alex's deliberately chosen calm view: dark,
low-glare and still. The changed page state does the explaining; captions do not compete with
large technical callouts.

Visuals follow the spoken trigger rather than anticipating it. The sequence keeps Alex's row
correction, both visible demo confirmations, dinner timing and three recipe cards. “None lists
peanut or avocado” describes the supplied recipe declarations; the next line keeps kitchen
confirmation and cross-contact visibly unresolved.

The home route is a labelled preset walkthrough, not an embedded autonomous model. Alex and
Lea's dialogue is scripted and is not participant research or a real customer's health history.
Native WebMCP evidence and current claim boundaries are documented in
[verification](verification.md) and [inclusion evidence](inclusion-evidence.md).

The earlier 112-second film is superseded and historical. Export and playback details for the
selected film are in [recording](recording.md); its exact visual sequence is in the
[beat sheet](video-beat-sheet.md).
