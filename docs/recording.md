# As I Am — selected film

The selected local film is **A night for two**, completed September 3, 2026. It runs for
**79.600 seconds** and follows Alex and Lea through a calm planning view, aisle-seat correction,
dinner timing and three pictured dishes. The earlier 112-second film is superseded and belongs
to the historical record below.

Video: [As I Am — A night for two | WebMCP Challenge](https://youtu.be/r40L1yJhNyc).
The captioned export and poster were uploaded, and the English SRT track was added.
YouTube's copyright and community checks reported no issues. Final public playback
verification is recorded separately from Devpost submission.

## Delivery

The complete local delivery is in `tools/clickthru/out/warm-flow/delivery/`:

- `as-i-am-warm.mp4`: H.264, 1920 × 1080, 30 fps, AAC stereo and burned-in English captions.
- `as-i-am-warm-clean.mp4`: matching picture and sound with an embedded English subtitle track.
- `as-i-am-warm.srt` and `as-i-am-warm.vtt`: 32 English caption cues.
- `index.html`: local review player.
- `poster.jpg`: matching opening image.

Run `node tools/clickthru/out/warm-flow/serve-player.mjs` and open
`http://127.0.0.1:4382/`. The server supports HTTP Range requests for reliable seeking. Keep the
six delivery files together; generated media is delivered separately from the source repository.

## Continuous performance

George voices Alex and Jessica voices the agent in one continuous two-voice performance. The
**71.520-second encoded dialogue master** is placed once at 4.000 seconds. The first audible word begins
at **4.165 seconds** and the final spoken line ends at **75.569 seconds**. There are **zero
dialogue cuts**, no time-stretch and no playback-speed change. A quiet original instrumental bed
sits beneath the complete performance.

The delivered AAC track measures **−17.8 LUFS integrated, 5.4 LU loudness range and −2.2 dBFS
true peak**. These are measurements of the selected file, not normalization targets. Voice and
music share a 48 kHz stereo mix.

## Picture and story

The edit holds one fixed browser position and consistent scale inside a warm cream film layout.
Visual responses appear after the relevant spoken content. LUNA and OLIVA remain in Alex's
deliberately chosen calm view: dark, low-glare and still. The sequence shows Friday's 20:15 film,
F1/F2 changing to G1/G2 at Alex's request, the 18:00/T4 dinner and three menu cards.

Alex and Lea are fictional, and their shared history is supplied example context. The home route
is a labelled preset walkthrough rather than an embedded autonomous model. The visual edit
changes documented page states around the continuous performance; it does not claim the browser
interaction happened in real time. Both confirmations are synthetic. The recipe declarations
list neither peanut nor avocado, while kitchen confirmation for cross-contact remains open. See
[verification](verification.md) and [inclusion evidence](inclusion-evidence.md) for the native
execution evidence and claim boundaries.

## Final checks

Both MP4 exports pass full FFmpeg decode checks. FFprobe reports 79.600 seconds, H.264 at
1920 × 1080 and 30 fps, plus AAC stereo at 48 kHz; the clean export also contains its English
subtitle stream. The 32 caption cues preserve the exact dialogue in
the [demo script](demo-script.md), sourced from
`tools/clickthru/out/warm-flow/spoken-dialogue.txt`.

| File | SHA-256 |
| --- | --- |
| `as-i-am-warm.mp4` | `6683eb3c3ab63cc6289c24d2a45402d6d782fccc57115b9901b26b5438ae7a37` |
| `as-i-am-warm-clean.mp4` | `4f6edfcb96c488380a7d4afd628dd88ad5b0cc53082ee46f7d7b8625883ce6fc` |
| `as-i-am-warm.srt` | `1ade4c835644e657b4974f7f422493990cee5d091a2b0315efe284d0bdeb51c8` |
| `as-i-am-warm.vtt` | `e64bf6aa7fdea6a435d1f573956cc98f398216190dbadc68b67653c6ee00c1d1` |

The exact dialogue, timing plan, edit metadata, renderer and source materials remain in
`tools/clickthru/out/warm-flow/`. The captioned file has been uploaded to the link above.
Verify its public playback and captions before submitting that URL.

---

# Historical films

The immediately preceding Alex/Lea candidate was **112 seconds**, with George and Chris sharing
101 spoken words across 15 caption cues. Its `calm-evening` delivery is historical and must not
be selected for submission.

The next preceding local candidate was **122.980 seconds**: a Full HD inclusion-led film with real
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
