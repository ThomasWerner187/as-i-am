# clickthru — website click-through recorder

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
  "name": "my-demo",                 // output file name
  "url": "/shop",                    // path (against base_url) or absolute URL
  "base_url": "http://localhost:5173",
  "viewport": { "width": 1360, "height": 900 },
  "fps": 15,                          // not used for timing (real timestamps are kept), only mp4
  "mp4": true,                        // set false to skip ffmpeg
  "steps": [
    { "act": "goto_note" },
    { "act": "wait",    "ms": 1500 },
    { "act": "caption", "text": "Floating label next to the cursor", "ms": 2000 },
    { "act": "hide_tag" },
    { "act": "move",    "selector": "css or none", "x": 100, "y": 200, "dur": 600, "note": "scrubber label" },
    { "act": "click",   "selector": "[data-testid='x']", "note": "Open the panel", "settle": 900, "timeout": 8000 },
    { "act": "hold",    "selector": "[data-testid='x']", "ms": 1500, "note": "Press and hold" },
    { "act": "type",    "selector": "input#q", "text": "hello", "delay": 30 },
    { "act": "press",   "key": "Enter" },
    { "act": "scroll",  "y": 700, "note": "Scroll down" }
  ]
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
