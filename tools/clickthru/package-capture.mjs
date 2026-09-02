/** Package a Browser runtime capture with real frame timing, not a guessed frame rate. */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const directory = path.resolve(process.argv[2] || "");
if (!process.argv[2])
  throw new Error("Usage: node package-capture.mjs <take-directory>");
const manifest = JSON.parse(
  await fs.readFile(path.join(directory, "manifest.json"), "utf8"),
);
if (manifest.failure || !manifest.frames.length)
  throw new Error("Incomplete capture");
const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });
const firstMs = manifest.frames[0].at_ms;
const lines = ["ffconcat version 1.0"];
manifest.frames.forEach((frame, index) => {
  if (!/^\d+\.jpg$/.test(frame.file)) throw new Error("Invalid frame filename");
  const nextMs = manifest.frames[index + 1]?.at_ms ?? manifest.total_ms;
  lines.push(
    `file 'frames/${frame.file}'`,
    `duration ${Math.max(0.04, (nextMs - frame.at_ms) / 1000).toFixed(6)}`,
  );
});
lines.push(`file 'frames/${manifest.frames.at(-1).file}'`);
await fs.writeFile(path.join(directory, "timing.ffconcat"), lines.join("\n"));
const movie = path.join(directory, "as-i-am-clickthrough.mp4");
await run("ffmpeg", [
  "-n",
  "-hide_banner",
  "-loglevel",
  "warning",
  "-f",
  "concat",
  "-safe",
  "1",
  "-i",
  path.join(directory, "timing.ffconcat"),
  "-vf",
  "scale=1440:1440:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30",
  "-t",
  String((manifest.total_ms - firstMs) / 1000),
  "-c:v",
  "libx264",
  "-crf",
  "20",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  movie,
]);
const encoded = (await fs.readFile(movie)).toString("base64");
const events = manifest.events.map((event) => ({
  ...event,
  at_ms: Math.max(0, event.at_ms - firstMs),
}));
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>As I Am — Demo</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f8f7f3;color:#273b2c;font:16px/1.5 system-ui,sans-serif;padding:24px}main{max-width:940px;margin:auto}header{display:flex;justify-content:space-between;align-items:baseline;gap:20px}h1{font-size:24px;margin:0}header span,p{font-size:13px;color:#586655}video{display:block;width:100%;max-height:78vh;background:#171b1a;border:1px solid #b7c1b0;border-radius:10px;margin:18px 0}nav{display:flex;flex-wrap:wrap;gap:8px}button{padding:9px 12px;border:1px solid #b7c1b0;border-radius:6px;color:inherit;background:#fffdf7;cursor:pointer}button:focus-visible{outline:3px solid #467542}#caption{min-height:24px}</style>
<main><header><h1>As I Am</h1><span>Real clicks. A simpler night out.</span></header><video id="demo" controls playsinline preload="metadata" aria-label="As I Am click-through demonstration" src="data:video/mp4;base64,${encoded}"></video><p id="caption" aria-live="polite">Press play, or jump to a moment.</p><nav aria-label="Demo chapters" id="chapters"></nav><p>Guided demo · Fallback transport · No real bookings. This capture has no narration.</p></main>
<script>const events=${JSON.stringify(events).replace(/</g, "\\u003c")}; const video=document.getElementById('demo');const caption=document.getElementById('caption');for(const event of events){const button=document.createElement('button');button.textContent=event.caption;button.onclick=()=>{video.currentTime=event.at_ms/1000;video.play()};document.getElementById('chapters').append(button)}video.ontimeupdate=()=>{const event=events.findLast(e=>e.at_ms<=video.currentTime*1000);if(event)caption.textContent=event.caption};</script></html>`;
await fs.writeFile(path.join(directory, "as-i-am-clickthrough.html"), html);
console.log(
  JSON.stringify({
    movie,
    player: path.join(directory, "as-i-am-clickthrough.html"),
    frames: manifest.frame_count,
    seconds: (manifest.total_ms - firstMs) / 1000,
  }),
);
