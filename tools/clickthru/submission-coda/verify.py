"""Check that appending a coda did not change the original picture or audio."""

import argparse
import json
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("original", type=Path)
parser.add_argument("combined", type=Path)
args = parser.parse_args()


def probe_packets(path):
    result = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_packets",
            "-show_data_hash",
            "sha256",
            "-show_entries",
            "packet=stream_index,data_hash",
            "-of",
            "json",
            str(path),
        ]
    )
    packets = json.loads(result)["packets"]
    return {
        i: [p["data_hash"] for p in packets if p["stream_index"] == i] for i in (0, 1)
    }


def decoded_frames(path, count):
    output = subprocess.check_output(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(path),
            "-map",
            "0:v",
            "-frames:v",
            str(count),
            "-f",
            "framemd5",
            "-",
        ]
    ).decode()
    return [
        line.split(",")[-1].strip()
        for line in output.splitlines()
        if line and not line.startswith("#")
    ]


before = probe_packets(args.original)
after = probe_packets(args.combined)
frame_count = len(before[0])
same_picture = decoded_frames(args.original, frame_count) == decoded_frames(
    args.combined, frame_count
)
same_audio = before[1] == after[1][: len(before[1])]
report = {
    "original_frames": frame_count,
    "decoded_original_pixels_unchanged": same_picture,
    "original_audio_packets": len(before[1]),
    "original_audio_packet_payloads_unchanged": same_audio,
    "note": "Concat remux can insert H264 parameter sets; decoded frame hashes test the actual picture.",
}
print(json.dumps(report, indent=2))
if not same_picture or not same_audio:
    raise SystemExit("Original media changed.")
