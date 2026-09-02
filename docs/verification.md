# Verification — 2026-09-02

## Automated checks

Run from the assigned worktree with the three local sites available:

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
node --test tools/clickthru/caption-groups.test.mjs
node --test tools/clickthru/continuous-timing.test.mjs
```

Final local run: TypeScript and production build passed; 67 unit tests and 39 browser tests
passed (106 total). The browser suite includes both new and legacy flows.
Four additional recorder tests verify sentence boundaries, balanced caption splitting and
preservation of the original speech-alignment indexes.
Eight continuous-narration tests additionally cover full-script alignment, invalid timestamps,
preserved click-motion speed, short-beat rejection, complete source order, safe frame paths and
global subtitle timing and balanced caption lines. The application itself is unchanged by the
continuous-voice edit.

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

The original 122-second click-through was captured from the working controller after the
story changes: both original sites are used, the full restaurant is shown again before explicit
transfer, and both synthetic bookings are confirmed by visible clicks. The readable proof panel
shows the actual functional receipt. Its 227 frames and original timestamps remain preserved.

The preferred [97-second edit](recording.md) uses one continuous 260-word ElevenLabs performance,
including a 9.3-second pitch. There is one speech request, no speech splicing, and no
post-generation time stretching. The master hash is checked before rendering. Static screen
holds follow speech timestamps while short click-motion intervals retain their real durations.

It contains H.264 video, AAC audio and 29 English subtitle cues. The export decoded without
errors. Browser review verified playback, chapter seeking, the opening, both restaurant views,
visible balanced captions and the captions toggle. A silence scan of the master at −38 dB
found only three pauses of at least 0.7 seconds;
the longest was 1.30 seconds. This is a timing check, not a substitute for the owner's listening
review. Earlier silent and narrated takes are preserved. The footage remains the labelled
guided fallback, not autonomous native agent execution.
