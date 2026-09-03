# Inclusion: claims and evidence

As I Am explores how a familiar agent can help a person use participating websites on their
own terms. A person's chosen settings, existing preferences and ability to change their mind
matter throughout the task. The current film demonstrates a fictional evening for Alex and
Lea; it is not a user study or a participant testimonial.

## The current scenario

Alex has explicitly asked for his familiar calm view while planning today. The supplied example
history mentions today's migraine; the website receives only the display settings. This does
not prescribe a treatment or assume the same needs for next week's visit.

| Expressed preference | Demonstrated response |
| --- | --- |
| Alex wants his calm view today | Dark appearance, lower glare, reduced motion and disabled animation on LUNA and OLIVA |
| Alex prefers the aisle, beside Lea | F1/F2, then G1/G2 after an explicit request to move one row back; Alex stays outside |
| Dinner should fit before the film | The recorded Friday 11 September showing at 20:15 allows dinner at 18:00, a 15-minute walk and arrival at 19:45 |
| Lea has shared peanut and avocado exclusions | Three recipe recommendations use declared ingredients; cross-contact still needs kitchen confirmation |
| Alex likes mushroom risotto | It is shown first only because it passes the stated ingredient filter |
| Both want the final choice | Original appearance, the full menu and visible booking confirmations remain available |

The example history is deliberately supplied by the prototype. It does not establish an
agent memory service or reveal facts about the person testing the app. Health context, food
requirements and booking context stay outside the functional adaptation receipt.

## Current technical evidence

Application revision **`75a7054`** is the basis for the latest run. See
[verification](verification.md) for the environment and detailed results, and
[recording](recording.md) for media files and final playback checks.

| Evidence | Recorded observation | Limit |
| --- | --- | --- |
| Automated checks | 128 unit, 72 browser and 15 recorder tests passed; eight personal/menu browser checks passed again after the CSS changes | Technical coverage does not establish real-user benefit |
| Native calm adaptation | Four requested preferences were satisfied on both participating sites: dark appearance, lower glare, reduced motion and disabled animation | A preferred combination for this fictional example, not a universal accessibility setting |
| Native seat correction | F1/F2 changed to G1/G2 while preserving the selected date/time and outside/inside assignment | Synthetic inventory, not real cinema tickets |
| Planning and confirmation | Dinner was checked before ticket confirmation; the confirmed date and 20:15 time then informed the 18:00/T4 proposal | Cross-origin confirmation is not independently verified by the restaurant tool |
| Native menu presentation | Three visual recommendations include the qualifying favorite; peanut/avocado exclusions and the kitchen check remain visible | Ingredient matches are not a guarantee against allergic reactions |
| Media | A 112-second film has been rendered, with two voices, 101 spoken words, first speech at second 7 and 15 caption cues | A scripted demonstration with actual native tool execution, not an unscripted participant session |

The home walkthrough is a labelled preset. The external-agent native run uses the participating
pages' real WebMCP tools. Both sites are controlled by this project and use synthetic inventory;
this is not independent-operator interoperability or adaptation of arbitrary websites.

## Other access choices remain available

The advanced journey at `/guided` retains pointing, reading and cognitive support choices.
Earlier native evidence on application `db3b386` recorded targets increasing from 30px to 56px,
a six-preference receipt, and a menu text sample increasing from 9.9px to 12.9px. Those are
historical observations from their stated viewport and state, not the current film's preference
counts or current participant outcomes.

The earlier zero-frame capture failure and the older film cuts are historical. The current
film is rendered; see [recording](recording.md) rather than treating that old failure as a
present capture blocker.

## What has not been established

- No research sessions with disabled people, participant testimonials or comparative task-success results are documented.
- No reduction in fatigue, universal migraine benefit or saved-time outcome has been measured.
- No independent website operator has adopted the contract in the documented work.
- Automated checks do not establish WCAG certification or replace assistive-technology and user testing.
- A local completed film does not establish public deployment, upload or submission status.

The next evaluation step is to work with disabled people using their own devices, access tools
and chosen settings. Use the unfilled [user-validation worksheet](user-validation-guide.md).
WAI's [Diverse Abilities and Barriers](https://www.w3.org/WAI/people-use-web/abilities-barriers/)
provides background for varied access needs; it is not an endorsement of this prototype.

Supported public wording: **“A working prototype that lets a familiar agent apply person-chosen
settings, present source-backed options and keep decisions with the person.”** Pair that claim
with the technical evidence and limits above.
