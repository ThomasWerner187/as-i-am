# Verification

## Release checks

Run from the assigned worktree with Node.js 22. Install Playwright's Chromium once after
`npm ci`; the browser suite manages the three local development servers.

```bash
npx playwright install chromium
npm run check
npm audit
gitleaks git --redact=100 --no-banner --log-opts=--all .
```

`check` runs type checking, unit tests, `test:recording`, browser tests and the production build.
The recorder tests also run independently with `npm run test:recording` or
`node --test tools/clickthru/*.test.mjs`.

## Current personal evening — September 3, 2026

Application source: **`75a7054`**, prepared in `codex-calm-personal-evening`.
TypeScript, **128 unit tests, 15 recorder tests and 72 browser tests** passed: **215 tests**
across the separate validation commands. After the final CSS adjustment, the eight personal
journey/menu browser checks passed again and the production build completed. The complete
browser run includes desktop, phone, keyboard and menu regression coverage. An initial run
found two outdated test expectations for the newly visible date/showtime controls and the
explicit aisle label; those were updated and the complete 72-test run passed.

`npm audit --json` reported zero vulnerabilities. Gitleaks inspected the complete branch
history with no detected leaks. `git diff --check` passed. Tests include the personalized
context, dated showings, aisle assignment and row changes, ingredient and favorite filtering,
calm rendering, retry behavior and the confirmed-booking handoff. These are technical checks,
not user-research or accessibility-certification results.

### Actual native execution and visual review

The built application was served at `http://127.0.0.1:4374/`. The in-app browser performed
actual native WebMCP calls on the top-level cinema and restaurant documents. This recording
uses **one origin with separate documents**, not independent operators. The preset home
walkthrough was also exercised through both visible confirmations; it remains labelled as
such, separately from native external-agent execution.

The film's selected evidence contains 22 successful calls; the raw session log retains 28
including earlier layout-check takes. The selected observed results are:

- Four requested functional preferences—dark appearance, lower glare, reduced motion and
  disabled animation—were satisfied on both sites. The sampled state had no horizontal
  overflow and no running animations. These are Alex's chosen preferences for planning today.
- The inventory supplied next Friday, **September 11**, at **20:15**. A separate dinner
  availability query ran before the cinema confirmation. F1/F2 then changed to **G1/G2**,
  with Alex at the aisle and Lea immediately inside. A visible UI click confirmed the tickets.
- The actual confirmed cinema state supplied the date/time for dinner. The functional
  receipt carried only the four display preferences to OLIVA. Dinner was separately proposed
  for **18:00, quiet garden table T4**, with 90 minutes for dinner, 15 minutes to walk and
  arrival at 19:45. The restaurant explicitly does not independently verify a caller's cinema
  confirmation; the controller reads it from the cinema state.
- Explicit peanut and avocado exclusions produced three visible recipe recommendations:
  qualifying favorite mushroom risotto, lemon/chickpea salad, and tomato/basil orzo. Ingredient
  and cross-contact information remain inspectable. Kitchen confirmation is still open.
- The demonstrator used the visible restaurant control to confirm the synthetic table.
  Final booking state was read back. No native confirmation tool or real transaction is claimed.

Raw recordings, structured results and matching screenshots are retained locally. The selected
original story film lasts **79.600 seconds** with a single uncut **71.520-second** two-voice performance and
32 English caption cues; speech begins at 4.165 seconds. Both 1920 × 1080, 30 fps media exports
decode completely without errors. The captioned file has subtitles burned into the picture.
The clean file uses independently rendered caption-free frames and carries one optional English
subtitle stream. See [recording](recording.md) for exact hashes, audio measurements and production
provenance.

Every film transition was inspected immediately before, at and after its trigger. Row, ticket,
table and outcome changes occur 300 ms after the complete triggering phrase. Page-state changes
within LUNA and OLIVA are direct, the restaurant keeps one scale and position, and the venue
transition passes through the cream frame without overlapping interfaces or headings.

The rebuilt player was checked at `http://127.0.0.1:4382/`: the clean video loaded at full
1920 × 1080 with a 79.6-second duration and played without a reported media error. Rapid chapter
selection landed on the last chosen chapter and displayed its current menu caption. Captions
off/on, mute/unmute, replay and full-screen entry/exit worked. The player was then returned to its
opening frame. These playback checks do not replace the owner's final listening review.

The subsequent [Netcup hosting verification](hosting.md) records valid HTTPS,
protected jury access, the complete browser flow and native WebMCP calls on the live pages.
The final **98.221333-second** submission film adds a short spoken WebMCP ending.
The original 2,388 video frames and 3,729 AAC audio payloads are preserved unchanged.
The selected upload is [on YouTube](https://youtu.be/VCrRYQfJxus).
Repository publication, final public video checks and Devpost Submitted status are
separate publication steps; the historical results below describe earlier builds.

## Historical disability access release — September 3, 2026

Application source: **`db3b386`**. The complete `npm run check` passed with **112 unit,
15 recorder and 69 browser tests: 196 passing tests**, followed by TypeScript and the production
build. New checks cover all eight need combinations, removing support, the all-deselected
original-view journey, changed receipts, maximum-text recovery, preserved selections, font
and line-height rendering, keyboard focus, live feedback and phone layouts. The changed
controller and access controls also passed the design detector.

Native WebMCP ran on the production build at `http://127.0.0.1:4373/` in the in-app browser,
1440 × 1080. This is one origin with separate cinema/restaurant documents. The successful
native-call results are preserved as `output/disability-evidence/native-tools.json` and included
in the review packet. They are real calls, not the registration shim used in automated tests.

- LUNA measured **30px** minimum targets before adaptation and **56px** afterward, with
  no horizontal overflow. Requested pointing and focus preferences returned satisfied fit.
- Seats F6/F7 were selected through the original controls, survived the native change and
  original-map comparison, and reached review through the native preparation tool. A visible
  confirmation produced confirmed tickets for **20:15**.
- The actual receipt carried **six functional preferences** to OLIVA, which accepted them.
  It contains no diagnosis, food requirements or booking details.
- A separate film-time argument produced **18:00 / quiet garden table T4**, arrival **19:45**
  and a **30-minute buffer**. Native preparation opened the real table review.
- Adding `text_scale: 1.3`, `font_style: readable` and `line_height: 1.7` through native
  visual tuning increased the smallest sampled text from **9.9px to 12.9px**. Fit was satisfied
  in the tested menu state. The full menu remained reachable and the table stayed **18:00/T4**.
- The visible table-confirmation control produced a confirmed demo table. Confirmation was
  exercised as the demonstrator's UI action; no booking-confirmation tool exists.

These measurements describe the tested properties and state, not complete accessibility or
benefit proven with disabled users. No participant research or independent operator integration
has been completed. See [inclusion evidence](inclusion-evidence.md).

### Matching film completed

The subsequent user-authorized run captured the revised app through the supported in-app
Browser: 13 short scenes, 120 actual browser frames and 21 successful native calls. The
same 30px to 56px target change, six-preference receipt import, 18:00/T4 dinner plan and
9.9px to 12.9px reading refinement were observed again. Both visible demo confirmations
were exercised by the demonstrator, not by a research participant.

The completed film is **122.980 seconds**, H.264 **1920 × 1080 at 30 fps**, with AAC audio,
40 English captions and an unchanged 315-word continuous Chris narration. Static waits
are edited to match speech. Titles and result callouts are editorial renderings of recorded
evidence; no fabricated chat or app state is shown. Both final exports decode fully without errors.
See [recording](recording.md) for files, source provenance and the media hash.

### Preserved recording limitation from the earlier attempt

A new 315-word continuous English Chris / Eleven v3 narration was generated once: **122.32s**,
with captions and a **122.92s** edit plan including the final hold. The browser capture returned
**zero frames** because its security policy could not be verified. Automatic approval review
then rejected an attempt to restore recording access as a prohibited bypass. Recording retries
were stopped at that point. The failed manifest is retained as failure evidence, and the
earlier 117-second guided cut is historical only.

The later run followed a new explicit user request and used the supported browser API.
No alternative browser-control mechanism was used to bypass the rejection. Public deployment,
repository visibility, YouTube publication and Devpost submission remain outstanding.

## Historical inclusion release review — September 3, 2026

Application candidate: **`981b90f`**. The full check at `7f9ddd5` passed TypeScript,
**105 unit tests, 15 recorder tests and 58 browser tests**: **178 passing tests**.
The subsequent changes preserve final screencast frames, remove a decorative notice border,
and exercise the complete new journey at a 390 × 844 viewport. The seven journey regressions,
15 recorder tests and production build passed again after those changes. The final build also passed after
aligning the helper text with actual ticket confirmation. Later documentation
commits do not change the application.

The browser regressions verify both chosen help modes, confirmed-ticket planning, actual T4
selection, 18:00 → 19:30 → 19:45 → 20:15 timing, two visible confirmations, no planning from
unconfirmed tickets, preservation of an earlier 18:30/T2 choice, explicit menu requirements,
removal of a shell allergen while retaining an additional restaurant constraint, and honest
labelling when a person later confirms a different table. Keyboard order follows the visible
assistance controls before entering the embedded website.

`npm audit` reports zero vulnerabilities including development dependencies. Gitleaks found
no leaks in the complete branch history. Type checking, diff checks and relative documentation
links were checked before the private handoff. No live booking service, payment or login is
required; all menu, table and seat inventory is synthetic.

### Native execution against the production build

Served `dist/` at `http://127.0.0.1:4273/` and used the in-app browser's native WebMCP capability,
without a development harness. The controller and direct routes, plus font notices, returned
HTTP 200. This preview uses **one origin and separate documents**.

1. Independently discovered **19 cinema tools and 23 restaurant tools**.
2. LUNA accepted the six functional preferences: 56px targets, 12px spacing, strong focus,
   guided steps, less nonessential content and reduced motion. It rendered the pair choices,
   measured 56px minimum targets and no horizontal overflow.
3. Native `prepare_seat_selection` opened F6/F7 at €26 total in `review`. Only the visible
   confirmation changed it to `confirmed`. `get_booking_state` then returned the film time 20:15.
4. Exported that page's real functional receipt and imported it into OLIVA. Six preferences
   were accepted. The receipt contains no food requirements or booking details.
5. Passed the confirmed film time as a separate task input to `get_dinner_plan`. The actual
   listed recommendation was **18:00, quiet garden table T4**: dinner ends 19:30, arrival 19:45,
   actual arrival buffer 30 minutes. An unavailable 18:15 slot was not invented.
6. Read all six menu items, then explicitly requested vegan dishes up to €20 and a milk check.
   `find_menu_options` returned lemon/chickpea salad and aubergine as declaration matches;
   orzo and the daily vegetable plate remained uncertain. `present_menu_for_user` visibly
   rendered that split with source, ingredients and cross-contact notes.
7. Native table preparation opened the 18:00/T4 review and required human confirmation.
   Clicking the visible button changed the stage to `confirmed`. A final measurement retained
   56px targets and no horizontal overflow. Spacing was correctly reported as unmeasurable
   on that single-action confirmation screen, so its fit was `partially_satisfied` rather
   than claiming an unsupported measurement.

Structured evidence and screenshots are included in the local release packet. The embedded
guided journey still displays **Guided demo · fallback** in this browser. Native iframe
execution is not claimed. Repeat these top-level native checks on the actual public deployment.

### Visual review and matching media

The actual controller, cinema transformation, dinner timeline, focused and full menus, and
human confirmation screens were reviewed at desktop width. The complete new journey also
passes at 390px width without horizontal page overflow. The restaurant menu has a separate
220% text-size phone regression and WCAG 2/2.1 A/AA axe checks with zero detected violations.
Automated checks do not constitute accessibility certification or replace testing with users
of assistive technology.

The new **117-second** English recording shows the integrated inclusion flow. It uses one
continuous Chris / Eleven v3 performance, 304 words, an opening pitch of 7.96 seconds, and
aligned English captions. The recorded UI is explicitly a guided demonstration. A recorder
fix preserves each unique rendered frame so the final state is not lost after a loading burst.
The first replacement cut is retained as an archive; the selected corrected file and its
checksums are documented in [recording](recording.md).

Public hosting, public repository visibility, YouTube upload and Devpost submission remain
open. The [release runbook](release-runbook.md) and [checklist](hackathon-checklist.md) distinguish
these from local readiness.

## Pre-polish baseline — September 3, 2026

At source commit `70923d9`, TypeScript and the production build passed, along with **67 unit
tests, 39 browser tests and 15 recorder tests**. These totals describe the baseline before
the final review fixes; they are not the final release count. Record fresh results and the
tested commit after integrating the polish, using the [release runbook](release-runbook.md).

The recorder suite covers sentence boundaries, balanced captions, original speech-alignment
indexes, full-script alignment, invalid timestamps, preserved click-motion speed, short-beat
rejection, complete source order, safe frame paths, global subtitles and voice-request settings.

The evening tests cover both complete synthetic booking flows, explicit UI confirmation,
selection preservation through preview/refinement/undo, earlier restaurant-time preservation,
the unchanged original restaurant before consent, no receipt import on navigation alone,
the readable proof panel and collapsed raw tool data,
mobile layouts, normal/adapted axe scans, cross-origin receipt negotiation, hostile receipt
rejection, and untrusted sibling-frame messages. Unit checks verify exact native origin/window
matching, serialized invocation and no silent fallback after native errors.

The wider suite retains the original shop/services contract and registration regressions.
Shim/harness tests are not represented as proof of native browser execution.

## Observed native browser execution — September 2, 2026

Using the in-app browser's native WebMCP capability, not the development harness:

1. Opened `http://localhost:5274/cinema` as a top-level document and discovered its 19 tools.
2. Called `get_adaptation_capabilities`, then `apply_adaptation_profile` with larger targets
   (56px), 12px spacing, strong focus, guided steps, less nonessential content and reduced motion.
3. `verify_profile_fit` returned satisfied for the six requested fields. The rendered target
   minimum was 56px and horizontal overflow was false at the tested desktop viewport.
4. Called `export_adaptation_receipt` and retained only the returned functional receipt for transfer.
5. Opened `http://localhost:5275/restaurant`, independently discovered its 19 tools, and called
   `get_adaptation_capabilities` then `import_adaptation_receipt` with that receipt.
6. OLIVA accepted six preferences, returned satisfied fit, measured 56px targets and no horizontal
   overflow. Its own cream/olive choice-list UI was visibly rendered.
7. Native `prepare_seat_selection` and `prepare_table_selection` returned
   `requires_human_confirmation: true`. `get_booking_state` remained at `review`, not `confirmed`.

The two top-level pages had separate origins and engine instances. The guided controller's
embedded frames did **not** expose native tools in this browser session. Their guided journey
therefore used the explicitly labelled fallback. Native cross-origin iframe execution is
implemented and unit-tested, but has not been verified live in this environment.

## Manual visual review — September 2, 2026

The actual controller, cinema and restaurant were inspected in the browser. The original map
and transformed pairs are working components, not images. The restaurant retains its own design.
Frame heights follow real content, preserving access to the review action. Guided transfer showed
actual target measurements of 30 → 56px for cinema and 44 → 56px for restaurant in that session.

These values describe specific layouts, not a universal accessibility score. Automated axe scans
do not replace assistive-technology testing or research with people who use adapted interfaces.

## Still outside this verification

Public deployment, production headers, independent third-party interoperability, full assistive-
technology testing, YouTube publication, and submission have not been completed by this build.
Re-verify native/fallback mode and all measurements in the actual presentation browser.

## Source and dependency audit — September 3, 2026 baseline

`gitleaks git --redact=100 --no-banner --log-opts=--all .` scanned the baseline's 17 commits
and found no leaks. A separate tracked-text scan found no secret patterns, email addresses,
machine paths or workplace context. All relative Markdown links in the README and docs resolved.

The baseline production dependency audit (`npm audit --omit=dev`) was clean. The full audit
identified five advisories in the old Vitest development tree; the final polish updates that
dependency and must rerun the full audit before release. This dated finding is not a statement
about the final integrated lockfile.

## Earlier recorded demonstration — superseded archive

The original 122-second click-through was captured from the working controller after the
story changes: both original sites are used, the full restaurant is shown again before explicit
transfer, and both synthetic bookings are confirmed by visible clicks. The readable proof panel
shows the actual functional receipt. Its 227 frames and original timestamps remain preserved.

The preferred [93-second Chris / Eleven v3 edit](recording.md) uses one continuous 260-word
ElevenLabs performance, including a 9.1-second pitch. There is one speech request, no speech splicing, and no
post-generation time stretching. The master hash is checked before rendering. Static screen
holds follow speech timestamps while short click-motion intervals retain their real durations.

`ffprobe` confirmed a 93.000-second file with H.264 video at 1416 × 1440, AAC audio and an
embedded subtitle track. The SRT contains 29 English cues. A complete FFmpeg decode returned
no errors. The selected file hash is recorded in [recording](recording.md).

These file checks do not replace watching and listening to the final cut. The recording
captures the September 2 guided workflow; later layout polish must preserve the behavior it
depicts. Check the selected video against the final deployed experience before submission.
Earlier silent and narrated takes are preserved. The footage remains the labelled guided
fallback, not autonomous native agent execution.
