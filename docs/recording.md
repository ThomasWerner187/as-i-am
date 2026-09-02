# As I Am — recorded demo

The current story cut is 2:02: a night out, two working websites, different personal needs,
and two clearly visible before/after transformations. Both original sites are used first.
The full restaurant is shown again before the person explicitly brings their preferences over.

Generated locally in `tools/clickthru/out/take-mTiagF/`:

- `as-i-am-elevenlabs.mp4` — preferred version: English narration using the owner's existing ElevenLabs voice.
- `as-i-am-elevenlabs.html` — standalone player with chapter jumps and captions.
- `as-i-am-elevenlabs.srt` / `.vtt` — English captions aligned to the generated speech.
- `as-i-am-clickthrough.mp4` — clean recording for your own voice-over.
- `manifest.json` — actual timestamps and recorded chapters.

The preferred narration is AI-generated through ElevenLabs using an existing saved voice at
the owner's request. No new clone was created. All ten sections fit without speeding up the
audio. Thirty-four short caption cues use the returned speech timestamps; long sentences
are split into balanced cues rather than leaving an isolated final word. No music was added.
Voice identifiers and generated media stay in the ignored output folder, not source control.
The video preserves the browser's existing aspect ratio. The guided fallback label remains
visible; the narration does not claim these clicks are autonomous native WebMCP calls.

The readable explanation shows **Discover → Adapt → Carry**, actual shared preferences,
and the broader idea for shopping, travel and forms on supporting websites. Raw tool calls
remain available in the app under **Actual tools & data**, outside the main story.

The earlier 68-second cut, silent version and macOS Daniel guide voice are preserved in
`tools/clickthru/out/take-7ARmxF/`. The current take also retains its first caption pass in a
separate subdirectory; the corrected export reused saved speech and required no new API calls.

Before submission, review the recording and upload the selected version to public YouTube.
No demo video has been publicly uploaded, and no submission has been made.
See the [entry checklist](hackathon-checklist.md) and [capture instructions](../tools/clickthru/README.md).
