# Inclusion: claims and evidence

As I Am is intended to help disabled people shape participating websites around the access
needs they choose to express. This document separates the reason to build it from evidence
that the implementation works, and from research that has not yet happened.

## Why these needs

W3C WAI describes varied, overlapping and changing access needs, including differences in
stamina, dexterity and concentration. It recommends considering functional requirements rather
than sorting people by medical classifications. [Diverse Abilities and Barriers](https://www.w3.org/WAI/people-use-web/abilities-barriers/)

Its guidance identifies small click areas as a barrier for some people with physical
impairments, describes user-controlled text presentation for visual access, and discusses
understandable, consistent interfaces for cognitive access. These are reasons to investigate
our choices, not evidence that this product helps a particular person.
[Physical](https://www.w3.org/WAI/people-use-web/abilities-barriers/physical/),
[Visual](https://www.w3.org/WAI/people-use-web/abilities-barriers/visual/),
[Cognitive and learning](https://www.w3.org/WAI/people-use-web/abilities-barriers/cognitive/)

WAI's [Stories of Web Users](https://www.w3.org/WAI/people-use-web/user-stories/) illustrate
several different experiences and explicitly do not cover every disability or barrier.
We have not copied its personas, recruited those people, or tested our app with them.
These references do not imply W3C endorsement or accessibility certification.

## Product choices, not diagnoses

The person selects one or more functional requests and explicitly applies them:

| Choice | Requested functional values | What a reviewer can inspect |
| --- | --- | --- |
| Make pointing easier for me | 56px targets, 12px target spacing, strong focus | Rendered target measurements, available selection controls and visible focus |
| Make reading easier for me | Text scale 1.3, line height 1.7 and readable font | Actual text/font change, text measurements and overflow at the tested viewport |
| Give me less to process | Guided steps, hide nonessential content, reduced motion | Changed task presentation, retained essential details and motion state |

The choices can be combined. They are not a “tremor mode,” “low-vision mode” or a diagnosis
inferred by an agent. The mapping is a prototype design decision; its usefulness and preferred
values must be evaluated with actual people. A person may want a different combination, a
different value or no adaptation at all.

A separate choice determines the level of help: **Help me choose** supports exploration;
**Prepare for me** delegates research and review preparation. Neither is intended as a ranking
of ability. The person can return to the original view and retains booking confirmation.

## What is actually evidenced

The evidence below describes the existing recorded revision. It must not be silently reused
as proof of new need-selection controls or a new video.

| Evidence | Recorded observation | What it does not establish |
| --- | --- | --- |
| Automated checks | The earlier inclusion build passed 105 unit, 15 recorder and 58 browser tests; later checks are itemized in verification.md | Real-user usability, population impact or complete accessibility |
| Rendered measurement | Native calls on the earlier production preview reported 56px minimum targets and no horizontal overflow at the inspected viewport | Successful pointing for a person with tremor, or a universally usable layout |
| Honest partial result | Spacing on a single-action confirmation screen was unmeasurable and returned partial fit | Full WCAG conformance or satisfaction of every preference |
| Native WebMCP | Earlier top-level cinema/restaurant tools were discovered and called in the in-app browser | Native iframe support, public deployment readiness or a recording of an autonomous agent |
| Selection and confirmation | Tests and direct checks covered preserved selections and reviews requiring a visible confirmation | A browser-wide guarantee that any external agent will obey the person |
| Receipt boundary | The functional receipt excluded food requirements and booking details | Anonymity, consent enforcement across agents or signed credentials |
| Earlier video | The 117-second cut documented the prior guided preset flow | The new combinable access choices or native execution in the main video |

The dated source of these observations is [verification](verification.md), including commit,
browser and deployment topology. The new controls, changed-need path and matching native clip
are **pending fresh verification and capture**. Public links and submission remain separate gates.

## What has not been evidenced

- No research sessions with disabled users are documented for this prototype.
- No participant testimonials, comparative task-success rates, fatigue reduction or saved-time
  claims have been established.
- No independent website operator has implemented this contract as part of the documented work.
- The two sites share a developer-controlled implementation and synthetic inventory.
- Automated scans and the available keyboard checks do not replace assistive-technology review.
- The app does not adapt arbitrary websites. The prototype requires participating sites.

Use [the user-validation worksheet](user-validation-guide.md) for genuine future sessions.
Do not fill missing evidence with generated personas, model feedback presented as user feedback,
accessibility simulations or invented quotations.

## Record the new native proof

Record real execution on the tested build, with the browser/tool context visible. A useful
short sequence is: the person's chosen functional request; native capability discovery;
validated application; the actual changed page; and its returned measurements. Then show the
same person's choice and visible confirmation. An annotation may explain a real result, but
must not invent chat messages, tool output or agent decisions.

Repeat with a changed need: add **Make reading easier for me**, retain the chosen pointing request, apply
and inspect the result. Show the receipt crossing to the restaurant as a separate operation
from the film-time input used for dinner planning. Keep the full menu and original view reachable.

For each recorded sequence, retain:

| Field | Record from the real run |
| --- | --- |
| Revision and environment | Commit, built artifact, URL, browser/version, viewport and date |
| Request | Exact selected needs and tool arguments; no unnecessary personal or medical details |
| Native calls | Discovered tools, actual calls and returned results |
| Before and after | UI screenshots and measured values from the same viewport/state |
| Choice boundary | What the person selected, what the tools prepared and who confirmed |
| Limits | Unsupported/partial fields, unmeasurable properties and observed failures |
| Media | Source capture, final edit boundaries, duration and file hash |

Describe edited waiting time honestly. A guided bridge capture remains a guided demonstration,
even if the same handlers also have a native registration. If the new native recording is
unavailable, retain that limitation in the submission instead of presenting presets as proof.

## Public wording

Supported: “A working prototype with measured interface changes and separately documented native
tool execution on the stated build.” Add the new recording only after it exists.

Not yet supported: “Validated by disabled users,” “reduces fatigue,” “works for every disability,”
“WCAG compliant,” or a predicted judging score. The contribution is a testable approach to
person-chosen access, with the next evaluation steps stated openly.
