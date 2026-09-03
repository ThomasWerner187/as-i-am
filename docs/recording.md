# As I Am — recorded demo

The preferred cut is **1:33**, with a **9.1-second elevator pitch** followed by
one continuous story. Both original websites work before adaptation; the full restaurant is
shown again before the person explicitly brings their preferences over.

The selected file was checked on September 3, 2026: **93.000 seconds**, H.264 video at
**1416 × 1440**, AAC audio and an embedded subtitle track. The accompanying SRT has
**29 English cues**. Its SHA-256 is
`a96f7e71944e693561afbb89abaf70a597484ca5a6021eabc8b61ba43cbb623b`.
This identifies the current local candidate, not a public upload.

Generated locally in `tools/clickthru/out/chris-v3-oyj7sk/`:

- `as-i-am-continuous.mp4` — English demo with ElevenLabs' premade Chris voice and Eleven v3.
- `as-i-am-continuous.html` — standalone player, chapter jumps and a visible captions toggle.
- `as-i-am-continuous.srt` / `.vtt` — captions aligned to the continuous performance.
- `continuous-master.mp3` — the untouched voice generation, also usable separately.
- `speech-plan.json` / `edit-plan.json` — speech timings and the corresponding screen edit.

These ignored outputs live in the worktree where the recording was made; a fresh clone or
another worktree will not contain them. The committed scripts and instructions describe how
to produce a new recording. Recording narration requires its own optional provider credentials;
running the application and its tests does not.

The entire 260-word script, including the pitch, was sent to ElevenLabs in **one request**.
Chris was selected for his conversational, down-to-earth profile. The shortlist also included
Liam (energetic social-media delivery) and George (warm British storytelling). These are
published voice profiles, not a claim that the finished performances were auditioned by ear.
The direction is an approachable person explaining what they built, with no dramatic tags.
Eleven v3 uses Natural stability (0.5); it does not support the v2 speed control. No clone was made.
See ElevenLabs' [voice and model guidance](https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech).
There are no joined speech clips, inserted chapter silences, or post-generation speed changes.
The full audio receives one loudness-normalization pass and AAC encoding for the video.

The screen edit follows the returned speech timestamps. It preserves every recorded chapter
and the original click-motion speed, changing only long static holds. The opening holds the
original cinema page during the pitch; the end has a 0.6-second hold. This is edited real
footage, not an uncut real-time session. The native/fallback disclosure stays visible.

Voice identifiers, API responses and generated media stay in the ignored output folder.
Rendering is a separate, local command and cannot incur another speech-generation charge.
The previous 97-second continuous take with the owner's voice remains in
`tools/clickthru/out/continuous-zpfCY5/` for comparison. It used Multilingual v2 at generation speed 0.9.
The original 122-second capture and segmented narration remain in `tools/clickthru/out/take-mTiagF/`;
the earlier 68-second cut remains in `tools/clickthru/out/take-7ARmxF/`. Nothing was deleted.

The readable explanation still shows **Discover → Adapt → Carry**, the actual shared
preferences, and possible uses for shopping, travel and forms on supporting websites.
This guided fallback is not presented as autonomous native agent execution.

Before submission, review the recording and upload the selected version to public YouTube.
No demo video has been publicly uploaded, and no submission has been made.
See the [entry checklist](hackathon-checklist.md) and [capture instructions](../tools/clickthru/README.md).
