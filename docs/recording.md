# As I Am — selected inclusion recording

The selected local candidate is **117 seconds** and shows both help modes, the dinner plan
from confirmed cinema tickets, the full/focused restaurant menu, and both human confirmations.
It replaces the earlier 93-second submission candidate. All earlier recordings are preserved.

## Selected files and checks

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
