/** Fit recorded screen holds to one continuous speech track. No TTS calls here. */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { retimeCapture } from "./continuous-timing.mjs";

const [take, destination] = process.argv.slice(2);
if (!take || !destination)
  throw new Error(
    "Usage: node package-continuous.mjs <source-take> <speech-directory>",
  );
const source = path.resolve(take);
const directory = path.resolve(destination);
if (/[\r\n']/.test(source))
  throw new Error("Unsupported characters in capture path.");
const output = path.join(directory, "as-i-am-continuous.mp4");
try {
  await fs.access(output);
  throw new Error(
    "Final video exists. Preserve it before making a new export.",
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const plan = JSON.parse(
  await fs.readFile(path.join(directory, "speech-plan.json"), "utf8"),
);
const manifest = JSON.parse(
  await fs.readFile(path.join(source, "manifest.json"), "utf8"),
);
const master = path.join(directory, "continuous-master.mp3");
if (
  createHash("sha256")
    .update(await fs.readFile(master))
    .digest("hex") !== plan.audioSha256
)
  throw new Error("Speech master changed; its timing cannot be trusted.");
const edit = retimeCapture(manifest, plan);
const total = edit.frames.reduce((sum, frame) => sum + frame.seconds, 0);
if (Math.abs(total - plan.duration) > 0.001)
  throw new Error("Screen timeline does not match the speech.");
const framePath = (frame) => path.join(source, "frames", frame.file);
const concat = [
  "ffconcat version 1.0",
  ...edit.frames.flatMap((frame) => [
    `file '${framePath(frame)}'`,
    `duration ${frame.seconds.toFixed(6)}`,
  ]),
  `file '${framePath(edit.frames.at(-1))}'`,
].join("\n");
const timingFile = path.join(directory, "screen-timing.ffconcat");
await fs.writeFile(timingFile, concat);
await fs.writeFile(
  path.join(directory, "edit-plan.json"),
  JSON.stringify(
    {
      source,
      sourceSeconds: (manifest.total_ms - manifest.frames[0].at_ms) / 1000,
      duration: plan.duration,
      audioSource: "one uninterrupted ElevenLabs performance",
      audioProcessing:
        "global loudness normalization, AAC encoding, 0.6-second end hold only",
      audioSplices: 0,
      audioTimeStretch: false,
      sourceMotionSpeed: 1,
      chapters: edit.reports,
    },
    null,
    2,
  ),
);
const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });
await run("ffmpeg", [
  "-n",
  "-hide_banner",
  "-loglevel",
  "warning",
  "-f",
  "concat",
  "-safe",
  "0",
  "-protocol_whitelist",
  "file",
  "-i",
  timingFile,
  "-i",
  master,
  "-i",
  path.join(directory, "as-i-am-continuous.srt"),
  "-map",
  "0:v",
  "-map",
  "1:a",
  "-map",
  "2:s",
  "-vf",
  "scale=1440:1440:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30",
  "-af",
  "loudnorm=I=-16:TP=-1.5:LRA=11,apad",
  "-c:v",
  "libx264",
  "-crf",
  "20",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-b:a",
  "160k",
  "-c:s",
  "mov_text",
  "-metadata:s:s:0",
  "language=eng",
  "-t",
  String(plan.duration),
  "-movflags",
  "+faststart",
  output,
]);
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const events = plan.chapters.map(({ chapter, start }) => ({ chapter, start }));
const video = (await fs.readFile(output)).toString("base64");
const captions = (
  await fs.readFile(path.join(directory, "as-i-am-continuous.vtt"))
).toString("base64");
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>As I Am — One story</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f8f7f3;color:#273b2c;font:16px/1.5 system-ui,sans-serif;padding:24px}main{max-width:940px;margin:auto}header{display:flex;justify-content:space-between;align-items:baseline;gap:20px}h1{font-size:24px;margin:0}header span,p{font-size:13px;color:#586655}video{display:block;width:100%;max-height:76vh;background:#171b1a;border:1px solid #b7c1b0;border-radius:10px;margin:18px 0}video::cue{font-size:clamp(14px,2vw,24px);color:#fff;background:rgba(23,27,26,.88)}.controls,nav{display:flex;flex-wrap:wrap;gap:8px}button{padding:9px 12px;border:1px solid #b7c1b0;border-radius:6px;color:inherit;background:#fffdf7;cursor:pointer}button:focus-visible{outline:3px solid #467542}#play{background:#384d3c;color:white}#chapter{min-height:24px}</style>
<main><header><h1>As I Am</h1><span>A web that works your way.</span></header>
<video id="demo" controls playsinline preload="metadata" aria-label="As I Am continuous narrated demonstration" src="data:video/mp4;base64,${video}"><track kind="captions" srclang="en" label="English" default src="data:text/vtt;base64,${captions}"></video>
<div class="controls"><button id="play">Play demo</button><button id="restart">Restart</button><button id="captions" aria-pressed="true">Captions on</button></div>
<p id="chapter">The ten-second pitch</p><nav aria-label="Demo chapters" id="chapters"></nav>
<p>Guided demo · Fallback transport · No real bookings. ${escapeHtml(plan.voiceName)} via ElevenLabs (AI-generated). One continuous voice-over; screen holds edited to match.</p></main>
<script>const events=${JSON.stringify(events).replace(/</g, "\\u003c")};const video=document.getElementById('demo');const play=document.getElementById('play');const captionButton=document.getElementById('captions');let captionsOn=true;const syncCaptions=()=>{for(const track of video.textTracks)track.mode=captionsOn?'showing':'disabled'};video.addEventListener('loadedmetadata',syncCaptions);video.textTracks.addEventListener('addtrack',syncCaptions);syncCaptions();play.onclick=()=>video.paused?video.play():video.pause();video.onplay=()=>play.textContent='Pause demo';video.onpause=()=>play.textContent='Play demo';document.getElementById('restart').onclick=()=>{video.currentTime=0;video.play()};captionButton.onclick=()=>{captionsOn=!captionsOn;syncCaptions();captionButton.textContent=captionsOn?'Captions on':'Captions off';captionButton.setAttribute('aria-pressed',String(captionsOn))};for(const event of events){const button=document.createElement('button');button.textContent=event.chapter;button.onclick=()=>{video.currentTime=event.start;video.play()};document.getElementById('chapters').append(button)}video.ontimeupdate=()=>{const event=events.findLast(e=>e.start<=video.currentTime);if(event)document.getElementById('chapter').textContent=event.chapter};</script></html>`;
const player = path.join(directory, "as-i-am-continuous.html");
await fs.writeFile(player, html);
console.log(
  JSON.stringify(
    {
      output,
      player,
      seconds: plan.duration,
      pitchSeconds: plan.chapters[0].end,
      audioSplices: 0,
      audioTimeStretch: false,
      sourceMotionSpeed: 1,
    },
    null,
    2,
  ),
);
