# As I Am — recording status

**A new recording is required for the inclusion, dinner-planning and menu experience.** The
previous 93-second cinema-to-dinner cut is superseded as a submission candidate. It does not
show the two help modes, source-backed dinner proposal or six-dish menu.

## New narration and capture

The authoritative [continuous-story.json](../tools/clickthru/continuous-story.json) contains
**304 English words**. It opens with “Let my agent help. Let me stay in charge.” The 24-word
opening is intended for about ten seconds. Target a natural continuous performance below
three minutes; final duration must be measured after generation.

The [demo script](demo-script.md) and [beat sheet](video-beat-sheet.md) map the story to exact
capture markers. The two modes are **Help me choose** and **Prepare for me**. Show the full
menu as well as focused choices, the editable fictional request, source-backed 18:00 table
proposal and both visible human confirmations. Keep the distinction between the functional
receipt and the separate film-time planning input readable.

The guide uses preset requests, with a visible native/demo transport label. It is not an
embedded autonomous LLM. Native external-agent calls must be demonstrated or verified separately;
do not present guided clicks as autonomous native execution.

Record the integrated app in a new ignored output directory. Generate the full narration in
one request, preserve the performance, and let its timestamps control the edit. Retime static
holds while preserving click-motion speed. Rendering alone must not make another paid speech
request. Never overwrite the old footage or audio to make it look like the new version.

## New candidate record — pending capture

| Item | Status |
| --- | --- |
| Integrated-flow capture | Not yet recorded in this document |
| Continuous narration | Script prepared; new generated performance pending |
| MP4 and standalone player | Pending |
| Runtime, dimensions and codecs | Must be measured from the new export |
| English captions | Must be aligned to the new performance |
| SHA-256 | Must be computed for the selected new file |
| Watch/listen review | Pending |
| Public YouTube link | Not yet recorded |

When the new files exist, replace these statuses with observed evidence. Check that the video
matches the released app and that the public upload has finished processing. Existing test or
playback results for an older cut do not verify the replacement.

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
