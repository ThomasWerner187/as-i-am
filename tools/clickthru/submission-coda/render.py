from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
import subprocess
import math
import hashlib
import shutil
import sys

if len(sys.argv) != 3:
    raise SystemExit(
        "Usage: python render.py <warm-flow-directory> <coda-output-directory>"
    )
SOURCE = Path(sys.argv[1]).resolve()
ROOT = Path(sys.argv[2]).resolve()
ROOT.mkdir(parents=True, exist_ok=True)
DEL = ROOT / "delivery"
PLATES = ROOT / "plates"
DEL.mkdir(exist_ok=True)
PLATES.mkdir(exist_ok=True)
W, H, FPS = 1920, 1080, 30
BG = "#f6efe2"
PAPER = "#fffaf0"
INK = "#20372e"
GREEN = "#406c59"
GOLD = "#d8a658"
MUTED = "#607268"
LINE = "#d8cbb9"
FONTS = {
    "sans": "/System/Library/Fonts/Supplemental/Arial.ttf",
    "bold": "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "serif": "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "serifb": "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "mono": "/System/Library/Fonts/Menlo.ttc",
}


def font(n, k="sans"):
    return ImageFont.truetype(FONTS[k], n)


a = json.loads((ROOT / "alignment.json").read_text())
text = "".join(a["characters"])
OFFSET = 0.6
DURATION = math.ceil((a["character_end_times_seconds"][-1] + OFFSET + 1.6) * FPS) / FPS
ORIGINAL = float(
    subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(SOURCE / "delivery/as-i-am-warm.mp4"),
        ]
    )
)
if not (ROOT / "original-ending.jpg").exists():
    subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-ss",
            str(ORIGINAL - 0.1),
            "-i",
            str(SOURCE / "delivery/as-i-am-warm.mp4"),
            "-frames:v",
            "1",
            str(ROOT / "original-ending.jpg"),
        ],
        check=True,
    )


def start(s):
    i = text.index(s)
    return OFFSET + a["character_start_times_seconds"][i]


def end(s):
    i = text.index(s)
    return OFFSET + a["character_end_times_seconds"][i + len(s) - 1]


parts = [
    ("As I Am is a working prototype", "As I Am is a working prototype"),
    ("for a web that adapts to you.", "for a web that adapts to you."),
    ("Web M C P lets an agent call tools", "WebMCP lets an agent call tools"),
    ("registered by each website —", "registered by each website —"),
    ("to calm the interface,", "to calm the interface,"),
    ("find seats, and plan dinner.", "find seats, and plan dinner."),
    ("You stay in control.", "You stay in control."),
]
cues = [
    {"start": start(raw), "end": end(raw), "text": display} for raw, display in parts
]


def stamp(t, sep=","):
    ms = round(t * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02}{sep}{ms:03}"


old_srt = (SOURCE / "delivery/as-i-am-warm.srt").read_text()
first_index = max(int(line) for line in old_srt.splitlines() if line.isdigit()) + 1
srt = (
    "\n\n".join(
        f"{i + first_index}\n{stamp(ORIGINAL + c['start'])} --> {stamp(ORIGINAL + c['end'])}\n{c['text']}"
        for i, c in enumerate(cues)
    )
    + "\n"
)
(DEL / "as-i-am-submission.srt").write_text(
    (SOURCE / "delivery/as-i-am-warm.srt").read_text().rstrip() + "\n\n" + srt
)
vtt = (
    "\n\n".join(
        f"{stamp(ORIGINAL + c['start'], '.')} --> {stamp(ORIGINAL + c['end'], '.')}\n{c['text']}"
        for c in cues
    )
    + "\n"
)
(DEL / "as-i-am-submission.vtt").write_text(
    (SOURCE / "delivery/as-i-am-warm.vtt").read_text().rstrip() + "\n\n" + vtt
)


def center(d, xy, text, f, fill):
    d.text((xy[0] - f.getlength(text) / 2, xy[1]), text, font=f, fill=fill)


def base(active=-1, final=False):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((88, 70), "As I Am.", font=font(34, "serifb"), fill=INK)
    center(d, (960, 202), "Built with WebMCP.", font(76, "serifb"), INK)
    center(d, (960, 310), "Website-registered tools", font(26, "bold"), MUTED)
    labels = [
        ("A calmer view", "apply_adaptation_profile"),
        ("Seats that fit", "get_available_seat_pairs"),
        ("Time for dinner", "get_dinner_plan"),
    ]
    for i, (label, tool) in enumerate(labels):
        x = 135 + i * 555
        c = x + 260
        highlighted = active == i
        d.rounded_rectangle(
            (x, 415, x + 520, 754),
            radius=24,
            fill=PAPER,
            outline=GREEN if highlighted else LINE,
            width=4 if highlighted else 2,
        )
        ink = GREEN
        if i == 0:
            d.rounded_rectangle((c - 88, 470, c + 88, 566), radius=14, fill=INK)
            d.line((c - 58, 498, c - 8, 498), fill=GOLD, width=5)
            d.line((c - 58, 522, c + 48, 522), fill="#b5c5b9", width=5)
            d.line((c - 58, 546, c + 25, 546), fill="#b5c5b9", width=5)
            d.ellipse((c + 31, 483, c + 70, 522), fill=GOLD)
            d.ellipse((c + 43, 476, c + 75, 508), fill=INK)
        elif i == 1:
            for dx in [-50, 40]:
                d.rounded_rectangle(
                    (c + dx - 30, 471, c + dx + 30, 541),
                    radius=13,
                    fill=GREEN if dx < 0 else GOLD,
                )
                d.rounded_rectangle(
                    (c + dx - 38, 537, c + dx + 38, 557),
                    radius=7,
                    fill=GREEN if dx < 0 else GOLD,
                )
                d.line((c + dx - 22, 557, c + dx - 22, 571), fill=ink, width=7)
                d.line((c + dx + 22, 557, c + dx + 22, 571), fill=ink, width=7)
            d.line((c - 103, 479, c - 103, 562), fill=LINE, width=4)
        else:
            d.ellipse((c - 55, 464, c + 55, 574), outline=GREEN, width=7)
            d.line((c, 486, c, 519, c + 34, 535), fill=GREEN, width=7)
            d.ellipse((c - 6, 513, c + 6, 525), fill=GOLD)
        center(d, (c, 603), label, font(31, "serifb"), INK)
        center(d, (c, 669), tool, font(23, "mono"), MUTED)
    if final:
        center(d, (960, 806), "You stay in control.", font(34, "serifb"), GREEN)
    center(
        d,
        (960, 877),
        "Preset walkthrough · Native tools available to external agents",
        font(24),
        MUTED,
    )
    return im


def caption(im, cue):
    if not cue:
        return im
    im = im.copy()
    d = ImageDraw.Draw(im)
    f = font(35, "bold")
    tw = f.getlength(cue["text"])
    x = (W - tw - 56) / 2
    y = 940
    d.rounded_rectangle(
        (x, y, x + tw + 56, y + 76), radius=15, fill=PAPER, outline="#ccbda7", width=2
    )
    d.text((x + 28, y + 18), cue["text"], font=f, fill=INK)
    return im


opening = Image.open(ROOT / "original-ending.jpg").convert("RGB")
cache = {}
keys = []
for n in range(round(DURATION * FPS)):
    t = n / FPS
    active = (
        0
        if start("calm the interface") <= t < start("find seats")
        else 1
        if start("find seats") <= t < start("plan dinner")
        else 2
        if start("plan dinner") <= t < start("You stay in control.")
        else -1
    )
    final = t >= start("You stay in control.")
    ci = next((i for i, c in enumerate(cues) if c["start"] <= t < c["end"]), -1)
    fade = min(1, max(0, (t - 0.15) / 0.65))
    step = round(fade * 20)
    key = (active, final, ci, step)
    if key not in cache:
        im = base(active, final)
        if step < 20:
            cream = Image.new("RGB", (W, H), BG)
            im = (
                Image.blend(opening, cream, step / 10)
                if step < 10
                else Image.blend(cream, im, (step - 10) / 10)
            )
        im = caption(im, cues[ci] if ci >= 0 else None)
        p = PLATES / (hashlib.sha256(repr(key).encode()).hexdigest()[:18] + ".png")
        im.save(p)
        cache[key] = p
    keys.append(key)
runs = []
for key in keys:
    if runs and runs[-1][0] == key:
        runs[-1][1] += 1
    else:
        runs.append([key, 1])
lines = ["ffconcat version 1.0"]
for key, count in runs:
    lines.extend([f"file '{cache[key]}'", f"duration {count / FPS:.9f}"])
lines.append(f"file '{cache[runs[-1][0]]}'")
(ROOT / "coda.ffconcat").write_text("\n".join(lines) + "\n")
audiofilter = f"[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay=600|600,apad=pad_dur=3[voice];[1:a]aresample=48000,atrim=0:{DURATION},highpass=f=170:p=2,equalizer=f=350:t=q:w=1.2:g=-8,highshelf=f=1000:g=3,afade=t=in:st=0:d=1.4,afade=t=out:st={DURATION - 3}:d=3,volume=0.16[music];[voice][music]amix=inputs=2:duration=longest:normalize=0,volume=-0.4dB,atrim=0:{DURATION}[mix]"
subprocess.run(
    [
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-i",
        str(ROOT / "voice.mp3"),
        "-i",
        str(SOURCE / "warm-score.mp3"),
        "-filter_complex",
        audiofilter,
        "-map",
        "[mix]",
        "-ar",
        "48000",
        str(ROOT / "coda-mix.wav"),
    ],
    check=True,
)
subprocess.run(
    [
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(ROOT / "coda.ffconcat"),
        "-i",
        str(ROOT / "coda-mix.wav"),
        "-map",
        "0:v",
        "-map",
        "1:a",
        "-vf",
        "fps=30,scale=in_range=full:out_range=full:out_color_matrix=bt601,format=yuvj420p",
        "-color_range",
        "pc",
        "-colorspace",
        "bt470bg",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-t",
        str(DURATION),
        "-movflags",
        "+faststart",
        str(ROOT / "coda.mp4"),
    ],
    check=True,
)
(ROOT / "combine.ffconcat").write_text(
    f"ffconcat version 1.0\nfile '{SOURCE / 'delivery/as-i-am-warm.mp4'}'\nduration {ORIGINAL:.6f}\nfile '{ROOT / 'coda.mp4'}'\n"
)
subprocess.run(
    [
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(ROOT / "combine.ffconcat"),
        "-map",
        "0:v",
        "-map",
        "0:a",
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        str(DEL / "as-i-am-submission.mp4"),
    ],
    check=True,
)
shutil.copy2(SOURCE / "delivery/poster.jpg", DEL / "poster.jpg")
base(-1, True).save(DEL / "coda-overview.png")
(ROOT / "render-report.json").write_text(
    json.dumps(
        {
            "original_seconds": ORIGINAL,
            "coda_seconds": DURATION,
            "voice_seconds": a["character_end_times_seconds"][-1],
            "original_preservation": "stream copy without re-encoding, voice cuts or time stretch",
            "coda_voice": "Jessica, one complete ElevenLabs performance",
            "subtitles": "Original 32 cues unchanged + 7 coda cues; WebMCP caption normalized from spoken letters",
            "visuals": "Explanatory diagram with real tool names from src/adaptive-contract/tools.ts and src/evening/tools.ts; not a recording of live tool execution",
            "coda_cues": cues,
        },
        indent=2,
    )
)
print(DEL / "as-i-am-submission.mp4")
