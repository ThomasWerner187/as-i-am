/** Add an explicitly selected, existing ElevenLabs voice to the recorded take. */
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { groupCaptionWords } from "./caption-groups.mjs";

const [take, voiceId, voiceName = "Selected voice"] = process.argv.slice(2);
if (!take || !/^[A-Za-z0-9]{20}$/.test(voiceId ?? ""))
  throw new Error(
    "Usage: node narrate-elevenlabs.mjs <take-directory> <voice-id> [voice-name]",
  );
if (!process.env.ELEVENLABS_API_KEY)
  throw new Error("ELEVENLABS_API_KEY is not configured");
const directory = path.resolve(take);
const stem = "as-i-am-elevenlabs";
const output = path.join(directory, `${stem}.mp4`);
try {
  await fs.access(output);
  throw new Error(
    "The ElevenLabs video already exists; preserve it and use another take directory.",
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const run = (command, args, capture = false) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    });
    let stdout = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`${command} exited ${code}`)),
    );
  });
const probe = async (filename) =>
  Number(
    await run(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filename,
      ],
      true,
    ),
  );
const manifest = JSON.parse(
  await fs.readFile(path.join(directory, "manifest.json"), "utf8"),
);
if (manifest.failure || !manifest.frames?.length)
  throw new Error("Incomplete capture");
const narration = JSON.parse(
  await fs.readFile(new URL("./narration.json", import.meta.url), "utf8"),
);
const silent = path.join(directory, "as-i-am-clickthrough.mp4");
const duration = await probe(silent);
const firstMs = manifest.frames[0].at_ms;
const tracks = [];
const cues = [];
const chapterReports = [];

for (const [index, part] of narration.entries()) {
  const eventIndex = manifest.events.findIndex(
    (event) => event.caption === part.chapter,
  );
  if (eventIndex < 0) throw new Error(`Missing chapter: ${part.chapter}`);
  const start = Math.max(0, manifest.events[eventIndex].at_ms - firstMs) + 180;
  const next = manifest.events[eventIndex + 1];
  const available =
    ((next ? next.at_ms - firstMs : duration * 1000) - start - 220) / 1000;
  const request = {
    text: part.text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.8,
      style: 0.15,
      use_speaker_boost: true,
    },
    previous_text: narration[index - 1]?.text,
    next_text: narration[index + 1]?.text,
  };
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ voiceId, request }))
    .digest("hex");
  const cacheFile = path.join(directory, `elevenlabs-${index + 1}.json`);
  let cached;
  try {
    cached = JSON.parse(await fs.readFile(cacheFile, "utf8"));
    if (cached.fingerprint !== fingerprint)
      throw new Error(
        `Changed request for cached chapter ${index + 1}; use a fresh take directory.`,
      );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    // No automatic paid retries. Saved responses permit a local packaging retry without new charges.
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(55000),
      },
    );
    if (!response.ok)
      throw new Error(
        `ElevenLabs chapter ${index + 1} failed: HTTP ${response.status}. No automatic retry.`,
      );
    const result = await response.json();
    if (
      typeof result.audio_base64 !== "string" ||
      !result.alignment?.characters?.length
    )
      throw new Error(
        `ElevenLabs returned no audio or alignment for chapter ${index + 1}`,
      );
    cached = { fingerprint, result };
    await fs.writeFile(cacheFile, JSON.stringify(cached), { flag: "wx" });
  }
  const filename = path.join(directory, `elevenlabs-${index + 1}.mp3`);
  try {
    await fs.writeFile(
      filename,
      Buffer.from(cached.result.audio_base64, "base64"),
      { flag: "wx" },
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  const seconds = await probe(filename);
  if (!Number.isFinite(seconds) || seconds <= 0 || available <= 0)
    throw new Error("Invalid audio timing");
  const tempo = Math.max(1, seconds / available);
  if (tempo > 1.12)
    throw new Error(
      `Chapter ${index + 1} needs more screen time; do not rush the voice (${tempo.toFixed(2)}x). Audio is saved.`,
    );
  tracks.push({ filename, start, tempo });
  chapterReports.push({
    chapter: part.chapter,
    start_ms: start,
    audio_seconds: seconds,
    tempo,
  });
  const alignment = cached.result.alignment;
  const text = alignment.characters.join("");
  const words = [...text.matchAll(/\S+/g)];
  for (const group of groupCaptionWords(words)) {
    const first = group[0].index;
    const last = group.at(-1).index + group.at(-1)[0].length - 1;
    const begin =
      start + (alignment.character_start_times_seconds[first] * 1000) / tempo;
    const end =
      start + (alignment.character_end_times_seconds[last] * 1000) / tempo;
    if (
      !Number.isFinite(begin) ||
      !Number.isFinite(end) ||
      end <= begin ||
      end > duration * 1000
    )
      throw new Error("Invalid caption timing");
    cues.push({
      start: begin,
      end,
      text: group
        .map((word) => word[0])
        .join(" ")
        .replace("Web M C P", "WebMCP"),
    });
  }
  console.log(JSON.stringify(chapterReports.at(-1)));
}

const timestamp = (ms) =>
  new Date(Math.round(ms)).toISOString().slice(11, 23).replace(".", ",");
const subtitles = cues
  .map(
    (cue, index) =>
      `${index + 1}\n${timestamp(cue.start)} --> ${timestamp(cue.end)}\n${cue.text.replace(/(.{1,42})(?:\s+|$)/g, "$1\n").trim()}\n`,
  )
  .join("\n");
const vtt =
  "WEBVTT\n\n" + subtitles.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
const srtFile = path.join(directory, `${stem}.srt`);
await fs.writeFile(srtFile, subtitles);
await fs.writeFile(path.join(directory, `${stem}.vtt`), vtt);
const filters = tracks.map(
  (track, index) =>
    `[${index + 1}:a]atempo=${track.tempo},adelay=${Math.round(track.start)}:all=1[a${index}]`,
);
filters.push(
  `${tracks.map((_, index) => `[a${index}]`).join("")}amix=inputs=${tracks.length}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,apad[voice]`,
);
await run("ffmpeg", [
  "-n",
  "-hide_banner",
  "-loglevel",
  "warning",
  "-i",
  silent,
  ...tracks.flatMap((track) => ["-i", track.filename]),
  "-i",
  srtFile,
  "-filter_complex",
  filters.join(";"),
  "-map",
  "0:v",
  "-map",
  "[voice]",
  "-map",
  `${tracks.length + 1}:s`,
  "-c:v",
  "copy",
  "-c:a",
  "aac",
  "-b:a",
  "160k",
  "-c:s",
  "mov_text",
  "-metadata:s:s:0",
  "language=eng",
  "-t",
  String(duration),
  "-movflags",
  "+faststart",
  output,
]);
let html = await fs.readFile(
  path.join(directory, "as-i-am-clickthrough.html"),
  "utf8",
);
html = html.replace(
  /src="data:video\/mp4;base64,[^"]+"/,
  `src="data:video/mp4;base64,${(await fs.readFile(output)).toString("base64")}"`,
);
html = html.replace(
  "</video>",
  `<track kind="captions" srclang="en" label="English" src="data:text/vtt;base64,${Buffer.from(vtt).toString("base64")}"></video>`,
);
const safeName = voiceName.replace(
  /[&<>"']/g,
  (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
      character
    ],
);
html = html.replace(
  "This capture has no narration.",
  `English narration: ${safeName} via ElevenLabs (AI-generated). Captions available.`,
);
await fs.writeFile(path.join(directory, `${stem}.html`), html);
await fs.writeFile(
  path.join(directory, `${stem}-provenance.json`),
  JSON.stringify(
    {
      provider: "ElevenLabs",
      voice_name: voiceName,
      voice_id: voiceId,
      model: "eleven_multilingual_v2",
      generated_at: new Date().toISOString(),
      chapters: chapterReports,
      captions: cues.length,
      duration,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ output, duration, captions: cues.length, voice: voiceName }),
);
