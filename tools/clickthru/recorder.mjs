#!/usr/bin/env node
/**
 * clickthru — record a website click-through with an animated cursor and
 * package it as a self-contained, playable browser-mockup HTML (plus
 * optional MP4 via ffmpeg).
 *
 * Usage:
 *   node tools/clickthru/recorder.mjs <script.json> [outdir]
 *
 * Script format: see tools/clickthru/README.md and scripts/asia-demo.json.
 *
 * How it works:
 *   1. Playwright (Chromium, headless) opens the URL at the given viewport.
 *   2. A cursor overlay is injected into the page; the runner glides it
 *      between action points with eased rAF animation.
 *   3. Frames are captured via CDP Page.startScreencast (only on change).
 *   4. Output: frames/ + manifest.json + <name>.html (player embedded,
 *      base64 JPEG frames — single file, works offline) + optional MP4.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } = await import("@playwright/test"));
}

/* ------------------------------------------------------------------ */
/* CLI                                                                */
/* ------------------------------------------------------------------ */

const scriptPath = process.argv[2];
const outArg = process.argv[3];
if (!scriptPath) {
  console.error("usage: node recorder.mjs <script.json> [outdir]");
  process.exit(1);
}
const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));
const name = script.name ?? path.basename(scriptPath, ".json");
const outDir = path.resolve(outArg ?? path.join(ROOT, "out", name));
fs.mkdirSync(path.join(outDir, "frames"), { recursive: true });

const VIEW = { width: script.viewport?.width ?? 1360, height: script.viewport?.height ?? 900 };
const BASE_URL = process.env.CLICKTHRU_BASE_URL ?? script.base_url ?? "http://localhost:5173";
const FPS_TARGET = script.fps ?? 15;
const FRAME_MS = Math.round(1000 / FPS_TARGET);

/* ------------------------------------------------------------------ */
/* Cursor overlay (injected into the page)                            */
/* ------------------------------------------------------------------ */

const CURSOR_JS = `
(() => {
function __ctBoot() {
  if (window.__cursor || !document.documentElement) return;
  const host = document.createElement("div");
  host.id = "clickthru-cursor-host";
  host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
  host.innerHTML = \`
    <div id="ct-cursor" style="position:absolute;left:0;top:0;will-change:transform;">
      <svg width="30" height="30" viewBox="0 0 30 30" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">
        <path d="M6 3 L6 23 L11.4 17.8 L15 25.4 L18.6 23.8 L15 16.4 L22.4 16.4 Z"
              fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
      </svg>
    </div>
    <div id="ct-ripple" style="position:absolute;left:0;top:0;opacity:0;"></div>\`;
  document.documentElement.appendChild(host);
  const cur = host.querySelector("#ct-cursor");
  const ripple = host.querySelector("#ct-ripple");
  let x = -60, y = -60;
  const set = () => { cur.style.transform = \`translate(\${x}px, \${y}px)\`; };
  set();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function move(nx, ny, dur = 600) {
    const sx = x, sy = y, t0 = performance.now();
    await new Promise((res) => {
      function frame(t) {
        const p = Math.min(1, (t - t0) / dur);
        x = sx + (nx - sx) * ease(p);
        y = sy + (ny - sy) * ease(p);
        set();
        if (p < 1) requestAnimationFrame(frame); else res();
      }
      requestAnimationFrame(frame);
    });
  }
  function click() {
    ripple.style.left = x - 4 + "px";
    ripple.style.top = y - 4 + "px";
    ripple.innerHTML = '<svg width="38" height="38" viewBox="0 0 38 38"><circle cx="19" cy="19" r="8" fill="none" stroke="#111" stroke-width="2.5" opacity="0.9"/><circle cx="19" cy="19" r="14" fill="none" stroke="#111" stroke-width="1.5" opacity="0.4"/></svg>';
    ripple.animate(
      [{ opacity: 1, transform: "scale(0.6)" }, { opacity: 0, transform: "scale(1.6)" }],
      { duration: 520, easing: "cubic-bezier(0.2,0.7,0.2,1)" }
    );
  }
  window.__cursor = { move, click, sleep,
    showTag: (text) => {
      let tag = host.querySelector("#ct-tag");
      if (!text) { tag?.remove(); return; }
      if (!tag) {
        tag = document.createElement("div");
        tag.id = "ct-tag";
        tag.style.cssText = "position:absolute;padding:7px 12px;border-radius:10px;background:#111;color:#fff;font:600 13px/1.2 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.3);max-width:280px;transform:translate(18px,22px);opacity:0;transition:opacity .25s;";
        host.appendChild(tag);
      }
      tag.textContent = text;
      tag.style.left = x + "px"; tag.style.top = y + "px";
      requestAnimationFrame(() => (tag.style.opacity = 1));
    },
  };
}
if (document.documentElement) __ctBoot();
else addEventListener("DOMContentLoaded", __ctBoot, { once: true });
})();
`;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Re-run the overlay bootstrap (no-op when the cursor already exists). */
const ensureCursor = (page) => page.evaluate(CURSOR_JS);

/** Re-run the overlay bootstrap (no-op when the cursor already exists). */

async function resolvePoint(page, step) {
  if (step.selector) {
    const loc = page.locator(step.selector).first();
    await loc.waitFor({ state: "visible", timeout: step.timeout ?? 8000 });
    const box = await loc.boundingBox();
    if (!box) throw new Error(`no box for ${step.selector}`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  return { x: step.x, y: step.y };
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEW,
  deviceScaleFactor: script.scale ?? 1,
  reducedMotion: script.reduced_motion ? "reduce" : "no-preference",
});
const page = await context.newPage();
page.on("framenavigated", (f) => console.warn(`clickthru: NAVIGATED → ${f.url()}`));
page.on("crash", () => console.warn("clickthru: PAGE CRASHED"));
page.on("pageerror", (e) => console.warn(`clickthru: pageerror: ${String(e).slice(0, 200)}`));

const framesDir = path.join(outDir, "frames");
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

// CDP screencast
const cdp = await context.newCDPSession(page);
let frameIndex = 0;
let writing = Promise.resolve();
const frameTimes = []; // seconds (monotonic), aligned with frame index
const t0 = Date.now();
const events = []; // { at_ms, kind, caption }

cdp.on("Page.screencastFrame", async (ev) => {
  const idx = String(frameIndex++).padStart(6, "0");
  const file = path.join(framesDir, `${idx}.jpg`);
  const ts = ev.metadata?.timestamp ?? (Date.now() - t0) / 1000;
  writing = writing.then(async () => {
    await fs.promises.writeFile(file, Buffer.from(ev.data, "base64"));
    frameTimes.push({ file: `${idx}.jpg`, ts });
  }).catch(() => {});
  try { await cdp.send("Page.screencastFrameAck", { sessionId: ev.sessionId }); } catch {}
});
await cdp.send("Page.startScreencast", {
  format: "jpeg",
  quality: script.quality ?? 62,
  maxWidth: VIEW.width,
  maxHeight: VIEW.height,
  everyNthFrame: 1,
});

const log = (kind, caption) => {
  events.push({ at_ms: Date.now() - t0, kind, caption: caption ?? "" });
  console.log(`  [${String(events.length).padStart(2, "0")}] ${kind}${caption ? " — " + caption : ""}`);
};

await page.addInitScript(CURSOR_JS);

console.log(`clickthru: recording "${name}" → ${outDir}`);
const url = script.url.startsWith("http") ? script.url : BASE_URL + script.url;
await page.goto(url, { waitUntil: "networkidle" });
await sleep(1200);

for (const [i, step] of (script.steps ?? []).entries()) {
  const kind = step.act;
  try {
    if (kind === "caption") {
      log("caption", step.text);
      await ensureCursor(page);
      await page.evaluate((t) => window.__cursor.showTag(t), step.text ?? null);
      await sleep(step.ms ?? 1400);
    } else if (kind === "hide_tag") {
      await ensureCursor(page);
      await page.evaluate(() => window.__cursor.showTag(null));
    } else if (kind === "wait") {
      await sleep(step.ms ?? 800);
    } else if (kind === "move") {
      const p = await resolvePoint(page, step);
      log("move", step.note);
      await ensureCursor(page);
      await page.evaluate(({ x, y, dur }) => window.__cursor.move(x, y, dur), { ...p, dur: step.dur ?? 650 });
      await sleep(120);
    } else if (kind === "click") {
      const p = await resolvePoint(page, step);
      log("click", step.note ?? step.selector);
      await ensureCursor(page);
      await page.evaluate(({ x, y, dur }) => window.__cursor.move(x, y, dur), { ...p, dur: step.dur ?? 600 });
      await page.evaluate(() => window.__cursor.click());
      await sleep(90);
      if (step.selector) await page.locator(step.selector).first().click({ force: true, timeout: step.timeout ?? 8000 });
      else await page.mouse.click(p.x, p.y);
      if (step.note) log("caption", step.note);
      await sleep(step.settle ?? 900);
    } else if (kind === "type") {
      const p = await resolvePoint(page, step);
      await ensureCursor(page);
      await page.evaluate(({ x, y, dur }) => window.__cursor.move(x, y, dur), { ...p, dur: 500 });
      await page.evaluate(() => window.__cursor.click());
      if (step.selector) await page.locator(step.selector).first().click();
      log("type", step.note ?? step.text);
      await page.keyboard.type(step.text, { delay: step.delay ?? 30 });
      await sleep(step.settle ?? 600);
    } else if (kind === "press") {
      await page.keyboard.press(step.key);
      log("press", step.key);
      await sleep(step.settle ?? 500);
    } else if (kind === "scroll") {
      log("scroll", step.note);
      await page.mouse.wheel(0, step.y ?? 600);
      await sleep(step.settle ?? 900);
    } else if (kind === "hold") {
      const p = await resolvePoint(page, step);
      log("hold", step.note ?? "press and hold");
      await ensureCursor(page);
      await page.evaluate(({ x, y, dur }) => window.__cursor.move(x, y, dur), { ...p, dur: step.dur ?? 600 });
      await page.evaluate(() => window.__cursor.click());
      if (step.selector) {
        const loc = page.locator(step.selector).first();
        const box = await loc.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await sleep(step.ms ?? 1600);
        await page.mouse.up();
      }
      await sleep(step.settle ?? 1000);
    } else if (kind === "screenshot_note") {
      log("note", step.text);
    } else {
      throw new Error(`unknown act: ${kind}`);
    }
  } catch (e) {
    console.warn(`step ${i} (${kind}) failed: ${e.message}`);
  }
}

await sleep(1500);
await cdp.send("Page.stopScreencast");
await writing;
await browser.close();

/* ------------------------------------------------------------------ */
/* Manifest + player + mp4                                            */
/* ------------------------------------------------------------------ */

const totalMs = Date.now() - t0;

// Decimate to the target fps (screencast emits on every paint; we keep
// ~1 frame per 1/fps bucket so the single-file player stays lean).
const keepMs = 1000 / FPS_TARGET;
const kept = [];
let lastKeptTs = -Infinity;
for (const f of frameTimes) {
  if (f.ts - lastKeptTs >= keepMs / 1000 - 1e-6 || kept.length === 0) {
    kept.push(f);
    lastKeptTs = f.ts;
  }
}
for (const f of frameTimes) {
  if (!kept.includes(f)) fs.rmSync(path.join(framesDir, f.file), { force: true });
}
// Renumber sequentially so ffmpeg's %06d pattern sees no gaps.
let seq = 0;
const renumbered = [];
for (const f of kept) {
  const newName = `${String(seq).padStart(6, "0")}.jpg`;
  if (newName !== f.file) fs.renameSync(path.join(framesDir, f.file), path.join(framesDir, newName));
  renumbered.push({ file: newName, ts: f.ts });
  seq++;
}
frameTimes.length = 0;
frameTimes.push(...renumbered);
console.log(`clickthru: kept ${frameTimes.length} frames (~${FPS_TARGET} fps)`);

const frameFiles = fs.readdirSync(framesDir).filter((f) => f.endsWith(".jpg")).sort();
const manifest = {
  name,
  url,
  viewport: VIEW,
  recorded_at: new Date().toISOString(),
  total_ms: totalMs,
  frame_count: frameFiles.length,
  events,
  frames: frameTimes,
};
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

// Build player HTML (single file, base64 frames)
console.log("clickthru: building player …");
const b64Frames = [];
for (const f of frameFiles) {
  b64Frames.push("data:image/jpeg;base64," + fs.readFileSync(path.join(framesDir, f)).toString("base64"));
}
const playerTemplate = fs.readFileSync(path.join(ROOT, "player-template.html"), "utf8");
const payload = JSON.stringify({ manifest, frames: b64Frames });
const html = playerTemplate
  .replace("__PAYLOAD__", () => payload)
  .replace("__TITLE__", () => name);
fs.writeFileSync(path.join(outDir, `${name}.html`), html);
console.log(`clickthru: ${path.join(outDir, name + ".html")} (${frameFiles.length} frames, ${(totalMs / 1000).toFixed(1)}s)`);

// Optional MP4 via ffmpeg
if (script.mp4 !== false) {
  const mp4 = path.join(outDir, `${name}.mp4`);
  console.log("clickthru: encoding mp4 …");
  await new Promise((res) => {
    const p = spawn("ffmpeg", [
      "-y", "-framerate", String(FPS_TARGET),
      "-i", path.join(framesDir, "%06d.jpg"),
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23", "-movflags", "+faststart",
      mp4,
    ], { stdio: "ignore" });
    p.on("close", res);
    p.on("error", () => res());
  });
  console.log(`clickthru: ${mp4}`);
}
console.log("clickthru: done.");
