# WebMCP ending for the submission film

The evening dialogue explains the experience. This 18.6-second ending explains the
implementation aloud, as required by the contest's video instructions. It follows
the full 79.6-second warm film; the dialogue is neither cut nor sped up.

Jessica reads one continuous passage:

> As I Am is a working prototype for a web that adapts to you. WebMCP lets an agent
> call tools registered by each website — to calm the interface, find seats, and
> plan dinner. You stay in control.

The matching diagram shows `apply_adaptation_profile`, `get_available_seat_pairs`,
and `get_dinner_plan`. It explains the interface rather than pretending to show a
live call. The visible label distinguishes the preset walkthrough from the native
tools available to external agents.

## Rebuild

Requires Node 18+, FFmpeg, Python with Pillow, and the macOS system fonts used by
the warm film. The original `warm-flow` take must contain its `delivery/` folder
and `warm-score.mp3`. Those media files stay out of Git.

```sh
# One provider request, only if no matching response is cached.
# ELEVENLABS_API_KEY must already be configured in the environment.
node tools/clickthru/submission-coda/generate.mjs \
  tools/clickthru/out/submission-coda <existing-voice-id>

# Local rendering; no network access or further generation.
python tools/clickthru/submission-coda/render.py \
  tools/clickthru/out/warm-flow tools/clickthru/out/submission-coda

python tools/clickthru/submission-coda/verify.py \
  tools/clickthru/out/warm-flow/delivery/as-i-am-warm.mp4 \
  tools/clickthru/out/submission-coda/delivery/as-i-am-submission.mp4
```

Use a fresh ignored output directory for a changed script or voice. Generation
keeps a request marker and never retries a failed or uncertain paid request.
Rendering derives caption times from the saved character alignment; the caption
spells WebMCP normally while the voice request spells out its letters.

The coda uses the original film's full-range color metadata so a stream-copy join
keeps the warm palette consistent. The transition goes through cream, avoiding
overlapping text. The render can be repeated locally and overwrites only its own
coda delivery. Keep published deliverables separately before making a new edit.

The verified delivery is 98.221 seconds at 1920×1080 and 30 fps, with AAC stereo
audio. All 2,388 original decoded frames and all 3,729 original AAC packet payloads
match the source. The final encode includes burned English captions and separate
SRT/VTT files.
