# As I Am — current film

The selected local film is **A night for two**, completed September 3, 2026. It runs for
**112.000 seconds** and shows the familiar Alex/Lea scenario: a calm view for planning today,
next week's aisle seats, a user-requested row change, dinner before the film and three dishes.
It supersedes the older cuts documented below.

## Delivery

Media lives in the ignored production folder of the `codex-calm-personal-evening` worktree:
`tools/clickthru/out/calm-evening/delivery/`.

- `as-i-am-calm.mp4`: H.264, 1920 × 1080, 30 fps, AAC stereo, burned-in English captions.
- `as-i-am-calm-clean.mp4`: matching film with an embedded English subtitle track.
- `as-i-am-calm.srt` and `.vtt`: 15 cues preserving all 101 spoken words.
- `index.html`: local player with optional captions, eight chapters and full transcript.
- `poster.jpg`: matching opening image.

Run `node tools/clickthru/out/calm-evening/serve-player.mjs` to serve the player with HTTP
Range support at `http://127.0.0.1:4381/`. Keep the media files alongside `index.html`.
Generated films are delivered separately from the source repository.

## Sound and pacing

There is no speech until **7 seconds**. Alex and the agent share ten short utterances,
**101 words**, using the premade George and Chris voices through ElevenLabs. One generated
dialogue master was reused for the edit. Utterances were separated at aligned boundaries,
placed with deliberate pauses and played at 0.94 speed with pitch preserved. A quiet original
procedural ambient bed fades in and out. There is no percussion, rapid montage or moving camera.
The final spoken line ends at approximately 106.14 seconds, followed by a quiet closing hold.

The final AAC file measures **−19.22 LUFS integrated, −1.92 dBTP and 13.50 LU loudness range**.
Those are measurements of the delivered file, not the normalization target. Voice and music
share a 48 kHz stereo mix. Caption timings follow the aligned speech with a brief tail, with
at most two lines and 42 characters per line.

## What the images establish

The production build uses application source **`75a7054`**. The film selects **nine short
native-browser captures containing 22 captured frames**, plus actual opening/context/map
screenshots. The screen was recorded at its existing 966.5 × 1204 CSS viewport. The edit uses
static holds, correctly scaled crops and brief dissolves; it is not a continuous real-time
recording. No tool outputs or booking confirmations were fabricated.

The retained evidence has **22 selected successful native calls**: example-context and
showing-inventory discovery, then the recorded cinema/restaurant flow. Context and inventory
were read shortly before the final capture; their relevant code was unchanged. The raw
production log retains all 28 calls, including layout-check takes. Dinner availability was
checked in a separate restaurant document before the cinema confirmation. The demonstrator
performs both visible synthetic confirmation clicks. The dialogue is scripted, with fictional
shared history; it is not an unscripted research session or a production memory service.

The restaurant receives four functional display preferences separately from the confirmed
cinema date/time and explicit ingredient exclusions. The menu keeps kitchen confirmation open.
The evidence does not establish allergy safety, universal migraine benefit or independent-site
adoption. See [inclusion evidence](inclusion-evidence.md).

## Final checks

Both MP4 exports pass full FFmpeg decode checks. Runtime, resolution, frame rate and audio
streams were inspected. Corrected keyframes show the selected date/time, the F1/F2 to G1/G2
change, the 18:00 table and all three dish cards without cutting off the result. Caption text
matches all spoken words. Browser playback and its final control checks are recorded in
[verification](verification.md).

| File | SHA-256 |
| --- | --- |
| `as-i-am-calm.mp4` | `aba82b99cf564be219221645430669365baea97c10ffaa895c4e05e878c11fed` |
| `as-i-am-calm-clean.mp4` | `8bc633a6d68f27c57aebaed7609c583eb3d8723575c34adfece8a5bcf456dba0` |

Production sources, timing plans, raw captures and the renderer remain in
`tools/clickthru/out/calm-evening/`. Provider credentials, voice identifiers and API responses
stay outside Git and the delivery packet. Running the app requires no speech-provider account.
The owner's final watch/listen, public upload and logged-out link checks remain open.

---

# Historical films

The preceding local candidate was **122.980 seconds**: a Full HD inclusion-led film with real
browser footage, recorded native WebMCP results, one continuous English voice-over and
40 English caption cues. It replaces the previous 117-second guided candidate. Earlier
recordings and failed-capture metadata are preserved.


## Previous disability access revision

The new narration is ready at `tools/clickthru/out/disability-native-chris-v3/`:
`continuous-master.mp3`, `spoken-script.txt`, `as-i-am-continuous.srt`,
`as-i-am-continuous.vtt` and `speech-plan.json`. It is one 315-word Chris / Eleven v3
performance, **122.32 seconds**, with an edit plan of **122.92 seconds**. The original
140–160-second target was a production estimate, not a requirement; the voice was not stretched.

The new user-authorized recording succeeded through the supported in-app Browser on
September 3, after the local preview was restarted. Short captures were started and stopped
inside their active browser calls. The film uses 13 captured scenes (120 actual browser
frames), 21 successful native calls, edited static holds and brief editorial dissolves.
The demonstrator performs the visible synthetic booking confirmations; this is not user research.

Previous media is in `tools/clickthru/out/inclusion-premiere/delivery/`:

- `as-i-am-demo.mp4`: H.264, 1920 × 1080, 30 fps, AAC, always-visible English captions.
- `as-i-am-demo-clean.mp4`: the same film with an embedded English subtitle track.
- `as-i-am-demo.srt` and `.vtt`: 40 cues preserving all 315 spoken words.
- `index.html`: local player with captions, chapters and transcript.
- `poster.jpg`: matching opening image.

The unchanged Chris master was reused without another TTS request or time stretching.
The mix adds a quiet original procedural ambient score, measured at −16.5 LUFS integrated
and −1.9 dBFS true peak. Editorial callouts reproduce the
actual results in `../evidence.json`; raw scenes, renderer and edit plan remain in the
ignored production folder. Both final exports pass complete FFmpeg decode checks.

Captioned MP4 SHA-256: `84594fc2358e34c4fbf698eb5bda0057ee750fa6f3d9061929b3385155e5afc8`.

Browser playback, chapter seeking, caption switching and full-screen captions were checked.
For serving the player locally, `node tools/clickthru/out/inclusion-premiere/serve-player.mjs`
provides HTTP Range support at `http://127.0.0.1:4380/`, so chapter jumps can seek correctly.
The delivery folder also opens directly through its `index.html` file.

Owner watch/listen, public upload and logged-out link verification remain open.

### Preserved earlier failure

The earlier capture at
`tools/clickthru/out/disability-native-captures/take-XFjUBq/manifest.json` has zero frames.
The browser security policy could not be verified. Automatic approval review rejected renewed
recording access as a prohibited bypass, so retries stopped. Keep this as failed capture
metadata; do not export it or remove the failure flag. The native calls succeeded separately
and are preserved in the local review packet. See [verification](verification.md).

The previous 117-second video belongs to the earlier worktree and does not show the new needs
chooser or native execution. Do not submit it as a demonstration of this revision.

## Previous 117-second files and checks

All paths below are relative to the inclusion experience worktree. Generated media is ignored
by Git and included separately in the local submission packet.

- Video: `tools/clickthru/out/inclusion-release-chris-v3/as-i-am-continuous.mp4`
- Standalone player: `tools/clickthru/out/inclusion-release-chris-v3/as-i-am-continuous.html`
- Captions: matching `.srt` and `.vtt` files, **37 English cues**.
- Preserved source capture: `tools/clickthru/out/inclusion-captures/take-TUpmAS/`.
- Preserved performance: `continuous-master.mp3` with its speech and edit plans.

| Check | Observed result |
| --- | --- |
| Runtime | 117.000 seconds |
| Video | H.264, 1440 × 1080, 30 fps |
| Audio | AAC; one continuous Chris / Eleven v3 performance |
| Narration | 304 English words; 116.4-second untouched master |
| Opening | 24 words, 7.96 seconds; complete brand and help controls visible |
| Source footage | 102.879 seconds, 1,170 unique rendered frames, all ten source chapters |
| Edit | Static holds retimed; original motion speed; zero speech splices or time stretching |
| Technical playback | Full FFmpeg decode completed without errors |
| Visual review | Keyframes show the real ticket selection, 18:00/T4 plan, menu and confirmations |
| SHA-256 | `9faa81a8620bee30ece48b0ccfcce8a241a5ba8a0f00bd0dd0003a7aff9dcb70` |
| Owner watch/listen | Final personal review before upload remains open |
| Public YouTube link | Not yet uploaded |

The corrected recorder retains each unique rendered frame: dropping frames by rate could
otherwise discard the last loading-to-result transition. Earlier replacement cuts in
`inclusion-chris-v3` and `inclusion-final-chris-v3` are retained as working takes. The selected
release also explicitly brings the header into view for its opening and closing.

The app is captured through real DOM-targeted controls in the browser. The guide uses preset
requests and visibly labels its fallback transport; it is not presented as embedded autonomous
AI. Separate native execution is recorded in [verification](verification.md).

The single paid narration request was reused for every edit. Its master hash is checked before
rendering. Provider responses and voice identifiers remain outside Git and the release packet.
The [script](demo-script.md), [beat sheet](video-beat-sheet.md) and
[continuous story](../tools/clickthru/continuous-story.json) describe the same final sequence.

## Previous cut — archive only

`tools/clickthru/out/chris-v3-oyj7sk/as-i-am-continuous.mp4` is the September 2 guided recording
of the previous flow. It was checked on September 3: **93.000 seconds**, H.264 video at
**1416 × 1440**, AAC audio, an embedded subtitle track and 29 accompanying English SRT cues.
A full FFmpeg decode passed. Its SHA-256 is
`a96f7e71944e693561afbb89abaf70a597484ca5a6021eabc8b61ba43cbb623b`.

That archive includes its HTML player, SRT/VTT, untouched `continuous-master.mp3`, speech plan
and edit plan. It used the premade Chris voice with Eleven v3, one 260-word request and no
joined speech clips or post-generation speed change. Earlier takes remain in the ignored
`continuous-zpfCY5`, `take-mTiagF` and `take-7ARmxF` output directories.

Ignored media lives in the recording worktree; a fresh clone or another worktree does not
contain those files. Provider credentials, voice identifiers and API responses stay outside
Git. Running the application and its tests requires no speech-provider account or API key.

See the [capture instructions](../tools/clickthru/README.md), [entry checklist](hackathon-checklist.md)
and [release runbook](release-runbook.md). Public upload and Devpost submission remain separate,
visible release gates.
