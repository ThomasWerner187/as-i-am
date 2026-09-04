# clickthru — website click-through recorder

## Preferred voice workflow: one continuous performance

The current [demo](../../docs/recording.md) starts with a roughly ten-second pitch and uses
one full English voice generation. `continuous-story.json` contains editing markers, but its
text is joined into **one request**, without chapter breaks or separately generated snippets.

```bash
# Create a fresh ignored output directory; keep earlier takes.
mktemp -d tools/clickthru/out/continuous-XXXXXX
# Use the returned directory below and an existing voice selected for this narration.
node tools/clickthru/generate-continuous-voice.mjs <output-directory> <voice-id> "Voice name" eleven_v3
# Local editing only: no ElevenLabs request and no API key needed.
node tools/clickthru/package-continuous.mjs tools/clickthru/out/<source-take> <output-directory>
node --test tools/clickthru/voice-request.test.mjs tools/clickthru/continuous-timing.test.mjs tools/clickthru/caption-groups.test.mjs
```

The continuous master determines the chapter times, captions, and length of each screen hold.
Actual click-motion intervals remain real-time; the editor refuses a beat too short to fit
them. No audio is cut, joined or time-stretched. The video applies one global loudness pass;
the original MP3 stays untouched. The 0.6-second end hold is the only added audio padding.

Outputs: `as-i-am-continuous.mp4`, a standalone `.html` player with a visible captions toggle,
`.srt`/`.vtt`, `continuous-master.mp3`, and speech/edit timing reports. The source frames and
earlier exports are never overwritten. Finished MP4s are protected against overwrite.

Generation caches its response and retains a request marker if the paid call fails or times out.
Do not delete that marker and retry blindly: check the request's outcome first. A changed
script, voice or model requires a new output directory. Voice IDs, audio and API responses stay ignored.
The optional model argument accepts `eleven_v3` or `eleven_multilingual_v2` (the default for
compatibility with earlier takes). V3 uses Natural stability without speed or speaker boost;
v2 retains the previous 0.9 generation speed. The speech plan records the chosen model and settings.
The timing API and generation-speed setting follow the official
[ElevenLabs API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)
and [pacing guidance](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices#pace).

## Current As I Am recording

The cinema/dinner take uses `live-capture.mjs` with the selected Codex Browser tab's supported
CDP capability. It records real DOM-targeted clicks, including controls inside the two frames.
It does not launch a separate browser or invoke hidden application state.
The story uses both original sites first, then adapts the cinema. **Continue to dinner** shows
the unchanged restaurant; a separate **Use my preferences here** click performs the transfer.
The ten English chapters move from a personal need to the before/after reveal, a readable
WebMCP explanation, and possible uses beyond booking. See the [beat sheet](../../docs/video-beat-sheet.md).

From an active Browser operation, navigate to the demo, obtain its `cdp` capability, import
`evening-take.mjs`, and **await the entire** `recordEveningTake(cdp, outputDirectory)` call.
Do not leave its capture pump running after the Browser operation returns. Each take gets a
fresh directory, a bounded frame rate, an event timeline and an explicit failure marker.

Then package the returned directory:

```bash
node tools/clickthru/package-capture.mjs tools/clickthru/out/<take>
# Optional local English guide voice (macOS Daniel; synthetic, not a cloned voice):
node tools/clickthru/narrate-capture.mjs tools/clickthru/out/<take>
# Legacy segmented guide voice (retained for older takes, not the preferred cut):
# ELEVENLABS_API_KEY must already be present in the environment. Never commit it.
node tools/clickthru/narrate-elevenlabs.mjs tools/clickthru/out/<take> <voice-id> "Voice name"
```

Outputs: silent `as-i-am-clickthrough.mp4`, narrated `as-i-am-demo.mp4`, matching standalone
HTML players, and English SRT/VTT captions. The packager preserves actual frame timing and
refuses to overwrite existing videos. `narration.json` holds the editable guide script.

The ElevenLabs variant produces `as-i-am-elevenlabs.mp4`, `.html`, `.srt` and `.vtt`.
It uses [speech timestamps](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)
for short captions and keeps a local cache to avoid paying again when only packaging is retried.
Long sentences are split into balanced cues with the original alignment indexes preserved;
run `node --test tools/clickthru/caption-groups.test.mjs` to check the grouping.
It has a request timeout, does not automatically retry paid requests, refuses to overwrite the
finished video, and stops if narration would need to be rushed by more than 12%. No voice is
created or modified. API keys are read from the environment and never saved.

Recordings are ignored by Git. The capture is a guided fallback demonstration, not footage
of an autonomous native agent. The browser's existing aspect ratio is preserved.

## Original standalone recorder

Records a scripted walk-through of any website with an **animated cursor** (eased
glides, click ripples, floating caption tags) and packages it as a **single
self-contained HTML file** showing the recording inside a **browser mockup**
(traffic lights, URL bar) with player controls — play/pause, scrubber with event
ticks, captions, speed, keyboard shortcuts. Optionally also renders an MP4.

No external services, no accounts — Playwright (Chromium, headless) + CDP screencast.
Free and reusable in any project.

## Requirements

- Node 18+, the project needs `@playwright/test` (or `playwright`) installed with
  Chromium (`npx playwright install chromium`).
- Optional: `ffmpeg` on PATH for MP4 output.

## Usage

```bash
# 1. start the site you want to record (or record any public URL)
npm run dev &

# 2. record
node tools/clickthru/recorder.mjs tools/clickthru/scripts/<script>.json [outdir]

# 3. open the result
open tools/clickthru/out/<name>/<name>.html
```

## Script format

```jsonc
{
  "name": "my-demo", // output file name
  "url": "/shop", // path (against base_url) or absolute URL
  "base_url": "http://localhost:5173",
  "viewport": { "width": 1360, "height": 900 },
  "fps": 15, // not used for timing (real timestamps are kept), only mp4
  "mp4": true, // set false to skip ffmpeg
  "steps": [
    { "act": "goto_note" },
    { "act": "wait", "ms": 1500 },
    {
      "act": "caption",
      "text": "Floating label next to the cursor",
      "ms": 2000,
    },
    { "act": "hide_tag" },
    {
      "act": "move",
      "selector": "css or none",
      "x": 100,
      "y": 200,
      "dur": 600,
      "note": "scrubber label",
    },
    {
      "act": "click",
      "selector": "[data-testid='x']",
      "note": "Open the panel",
      "settle": 900,
      "timeout": 8000,
    },
    {
      "act": "hold",
      "selector": "[data-testid='x']",
      "ms": 1500,
      "note": "Press and hold",
    },
    { "act": "type", "selector": "input#q", "text": "hello", "delay": 30 },
    { "act": "press", "key": "Enter" },
    { "act": "scroll", "y": 700, "note": "Scroll down" },
  ],
}
```

Notes:

- Steps with a `selector` resolve to the element's center (`boundingBox`). `x`/`y` are
  CSS pixels in the page viewport.
- `caption` shows a floating tag at the cursor and becomes the caption + scrubber
  event in the player. `note` only feeds the scrubber/captions.
- The cursor overlay is injected into the page itself, so it is part of the captured
  frames and can never desync from the video.

## Output

```
out/<name>/
  <name>.html        ← the deliverable: single-file player (offline, embeddable)
  <name>.mp4         ← optional, via ffmpeg
  manifest.json      ← url, viewport, events, per-frame timestamps
  frames/*.jpg       ← raw screencast frames (only on content change)
```

## How it works

1. `Page.startScreencast` (CDP) streams JPEG frames whenever the page changes —
   efficient, no fixed-fps blank frames.
2. The runner resolves each step to a point, glides the injected SVG cursor with
   eased `requestAnimationFrame`, fires a ripple on click, then performs the real
   Playwright action.
3. Frames + real timestamps + events are bundled with a vanilla-JS player into one
   HTML file; the player maps real time → nearest frame (binary pointer), so pacing
   matches the original session.

## Reusing this in other projects

Copy `tools/clickthru/` (recorder.mjs, player-template.html, scripts/) — it has no
dependency on this repository beyond Playwright. Typical uses: hackathon demo
videos, bug reproductions, UX walk-throughs, README assets.
