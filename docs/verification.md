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

## Final integrated review — September 3, 2026

Application source commit: **`d6cc3a1`**. Subsequent release documentation does not change
the tested application. The complete `npm run check` passed: TypeScript, **90 unit tests,
15 recorder tests, 46 browser tests**, and the production build. This is **151 passing tests**.
`npm audit` reported **zero vulnerabilities**, including development dependencies. Gitleaks
scanned all 25 commits with no leaks; tracked text and the production output contained no
secrets, machine paths or email addresses. All 49 relative links in the 16 existing Markdown
documents resolved before the final verification notes were added.

The final regressions cover reversible boolean and enum preferences, exact undo including
accepted inherent preferences and task focus, closed-schema prototype-key rejection,
local-only speech fallback, integer cart quantities and complete price totals. Browser checks
also cover mobile focus, the adaptation control above the site, 2.2× text reflow, a contained
large-target seat map, delayed connection recovery and correct standalone production URLs.

### Native execution against the production build

Served the built `dist/` at `http://localhost:4173/` with no development shim and used the
in-app browser's WebMCP capability:

1. Discovered the controller's two tools. `get_evening_context` returned working top-level
   cinema/restaurant routes, separate embedded URLs and `cross_origin: false`.
2. Independently discovered **19 registered tools on each top-level site**.
3. LUNA accepted six preferences: 56px targets, 12px spacing, strong focus, guided steps,
   hidden nonessential content and reduced motion. Its measured fit was `satisfied`, with
   56px minimum targets and no horizontal page overflow.
4. Exported LUNA's real functional receipt and imported it into OLIVA. All six preferences
   were accepted with `satisfied` fit, 56px minimum targets and no horizontal page overflow.
5. Native availability tools returned the selected synthetic F6–F7 seats (€26 total) and
   18:30 table. Each preparation tool returned `requires_human_confirmation: true` and
   booking state `review`. Only clicking the visible confirmation changed state to `confirmed`.

This production preview uses **one origin and separate documents**, not separate businesses.
The September 2 native test below separately verifies the three-origin development topology.
The embedded guided journey still displays **Guided demo · fallback** in this browser; native
iframe execution is not claimed. Repeat the top-level native check after public deployment.

### Final visual and media checks

Reviewed the production controller and both native booking reviews at desktop width, then
completed the guided cinema-to-restaurant journey with a 390px mobile viewport. Both sites
retained their design; preference transfer required the visible consent action; the receipt
explanation listed only the six functional preferences. Desktop and mobile screenshots were
saved with the local release packet. The additional UX review found no introduced regressions.

The two served artwork files total approximately **124 kB**, down from 4.3 MiB of PNGs.
Original artwork is preserved under `docs/art-sources/`. The production JavaScript is 362.17 kB
(109.55 kB gzip); CSS is 64.05 kB (13.47 kB gzip). Font notices ship with the build.

The selected 93-second video decoded completely without error. Sampled frames match the
guided workflow, although its older control placement differs from the final layout.
Measured audio peak was −1.3 dB and mean −17.7 dB. This is a technical check and sampled
visual review; final watching and listening by the owner remains open before upload.

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

## Recorded demonstration — current candidate checked September 3, 2026

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
