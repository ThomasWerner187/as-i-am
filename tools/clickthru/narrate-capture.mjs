/** Optional macOS guide voice. Uses no voice cloning or external speech service. */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

if (!process.argv[2])
  throw new Error("Usage: node narrate-capture.mjs <take-directory>");
const directory = path.resolve(process.argv[2]);
const run = (command, args, output = false) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: output ? ["ignore", "pipe", "inherit"] : "inherit",
    });
    let text = "";
    child.stdout?.on("data", (chunk) => {
      text += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(text)
        : reject(new Error(`${command} exited ${code}`)),
    );
  });
const manifest = JSON.parse(
  await fs.readFile(path.join(directory, "manifest.json"), "utf8"),
);
const narration = JSON.parse(
  await fs.readFile(new URL("./narration.json", import.meta.url), "utf8"),
);
const duration = (manifest.total_ms - manifest.frames[0].at_ms) / 1000;
const audio = [];
const cues = [];
const captionTime = (ms) => {
  const time = new Date(Math.max(0, Math.round(ms))).toISOString();
  return time.slice(11, 23).replace(".", ",");
};
const wrap = (text) => text.replace(/(.{1,54})(?:\s+|$)/g, "$1\n").trim();
for (const [index, part] of narration.entries()) {
  const event = manifest.events.find((event) => event.caption === part.chapter);
  if (!event) throw new Error(`Missing recorded chapter: ${part.chapter}`);
  const filename = path.join(directory, `guide-${index + 1}.aiff`);
  // Exclusive outputs: do not silently overwrite an earlier approved narration.
  try {
    await fs.access(filename);
    throw new Error(`Already exists: ${filename}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await run("/usr/bin/say", [
    "-v",
    "Daniel",
    "-r",
    "175",
    "-o",
    filename,
    part.text,
  ]);
  const seconds = Number(
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
  const start = Math.max(0, event.at_ms - manifest.frames[0].at_ms) + 180;
  const end = start + seconds * 1000;
  const next = manifest.events[index + 1]?.at_ms ?? manifest.total_ms;
  if (end > next - manifest.frames[0].at_ms + 100)
    throw new Error(`Narration exceeds chapter: ${part.chapter}`);
  audio.push({ filename, start });
  cues.push(
    `${index + 1}\n${captionTime(start)} --> ${captionTime(end)}\n${wrap(part.text.replace("Web M C P", "WebMCP"))}\n`,
  );
}
const subtitles = cues.join("\n");
await fs.writeFile(path.join(directory, "as-i-am-demo.srt"), subtitles);
const vtt =
  "WEBVTT\n\n" + subtitles.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
await fs.writeFile(path.join(directory, "as-i-am-demo.vtt"), vtt);
const filters = audio.map(
  (track, index) =>
    `[${index + 1}:a]adelay=${Math.round(track.start)}:all=1[a${index}]`,
);
filters.push(
  `${audio.map((_, index) => `[a${index}]`).join("")}amix=inputs=${audio.length}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[voice]`,
);
const output = path.join(directory, "as-i-am-demo.mp4");
await run("ffmpeg", [
  "-n",
  "-hide_banner",
  "-loglevel",
  "warning",
  "-i",
  path.join(directory, "as-i-am-clickthrough.mp4"),
  ...audio.flatMap((track) => ["-i", track.filename]),
  "-i",
  path.join(directory, "as-i-am-demo.srt"),
  "-filter_complex",
  filters.join(";"),
  "-map",
  "0:v",
  "-map",
  "[voice]",
  "-map",
  `${audio.length + 1}:s`,
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
html = html.replace(
  "This capture has no narration.",
  "English guide voice: Daniel (synthetic). Captions available.",
);
await fs.writeFile(path.join(directory, "as-i-am-demo.html"), html);
console.log(
  JSON.stringify({
    output,
    duration,
    narration: "macOS Daniel, synthetic guide voice",
    captions: "as-i-am-demo.srt",
  }),
);
