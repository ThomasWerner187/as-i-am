# Verification — 2026-09-02

## Automated checks

Run from the assigned worktree with the three local sites available:

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
node --test tools/clickthru/caption-groups.test.mjs
```

Final local run: TypeScript and production build passed; 67 unit tests and 39 browser tests
passed (106 total). The browser suite includes both new and legacy flows.
Four additional recorder tests verify sentence boundaries, balanced caption splitting and
preservation of the original speech-alignment indexes.

The evening tests cover both complete synthetic booking flows, explicit UI confirmation,
selection preservation through preview/refinement/undo, earlier restaurant-time preservation,
the unchanged original restaurant before consent, no receipt import on navigation alone,
the readable proof panel and collapsed raw tool data,
mobile layouts, normal/adapted axe scans, cross-origin receipt negotiation, hostile receipt
rejection, and untrusted sibling-frame messages. Unit checks verify exact native origin/window
matching, serialized invocation and no silent fallback after native errors.

The wider suite retains the original shop/services contract and registration regressions.
Shim/harness tests are not represented as proof of native browser execution.

## Observed native browser execution

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

## Manual visual review

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

## Recorded demonstration

The [122-second click-through](recording.md) was captured from the working controller after the
story changes: both original sites are used, the full restaurant is shown again before explicit
transfer, and both synthetic bookings are confirmed by visible clicks. The readable proof panel
shows the actual functional receipt. The 227 captured frames retain their real timing.

The exported MP4 decoded without errors and played in the browser; the original restaurant and
readable explanation were visually checked in playback. It contains H.264 video, AAC audio and
English subtitles. English narration uses
the owner's existing ElevenLabs voice; all ten sections fit without a speed change. Thirty-four
speech-aligned captions avoid dangling final-word cues. The silent and earlier narrated takes
are preserved. This recording shows the labelled guided fallback, not autonomous native agent
execution.
