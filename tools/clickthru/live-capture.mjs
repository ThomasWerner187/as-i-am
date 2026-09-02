/** Capture the selected Browser runtime tab; no second browser or hidden app-state calls. */
import fs from "node:fs/promises";
import path from "node:path";

const CURSOR_ID = "as-i-am-recording-cursor";
function installCursor() {
  document.getElementById("as-i-am-recording-cursor")?.remove();
  const cursor = document.createElement("div");
  cursor.id = "as-i-am-recording-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.style.cssText =
    "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(40px,40px);filter:drop-shadow(0 2px 3px #0008)";
  cursor.innerHTML =
    '<svg width="28" height="32" viewBox="0 0 28 32"><path d="M4 2v24l6-6 5 10 5-3-5-9h10z" fill="#fff" stroke="#172019" stroke-width="2" stroke-linejoin="round"/></svg>';
  document.documentElement.append(cursor);
}

export async function startLiveCapture(cdp, baseDirectory) {
  await fs.mkdir(baseDirectory, { recursive: true });
  const directory = await fs.mkdtemp(path.join(baseDirectory, "take-"));
  await fs.mkdir(path.join(directory, "frames"));
  await cdp.send("Runtime.evaluate", {
    expression: `(${installCursor.toString()})()`,
  });
  const beginning = await cdp.readEvents({ methods: ["Page.screencastFrame"] });
  const capture = {
    directory,
    started: Date.now(),
    frames: [],
    events: [],
    running: true,
    failure: null,
  };
  let cursor = beginning.cursor;
  let lastTimestamp = -Infinity;
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 78,
    maxWidth: 1440,
    maxHeight: 1440,
    everyNthFrame: 1,
  });
  capture.pump = (async () => {
    try {
      while (capture.running && Date.now() - capture.started < 180000) {
        const batch = await cdp.readEvents({
          afterSequence: cursor,
          methods: ["Page.screencastFrame"],
          timeoutMs: 300,
          limit: 100,
        });
        cursor = batch.cursor;
        if (batch.truncated)
          throw new Error(
            "Capture event buffer overflowed; do not use this take.",
          );
        for (const event of batch.events) {
          const frame = event.params;
          await cdp.send("Page.screencastFrameAck", {
            sessionId: frame.sessionId,
          });
          const timestamp = frame.metadata.timestamp;
          if (timestamp - lastTimestamp < 1 / 12) continue;
          lastTimestamp = timestamp;
          const file = `${String(capture.frames.length).padStart(6, "0")}.jpg`;
          await fs.writeFile(
            path.join(directory, "frames", file),
            Buffer.from(frame.data, "base64"),
          );
          capture.frames.push({
            file,
            ts: timestamp,
            at_ms: Math.max(0, timestamp * 1000 - capture.started),
          });
          capture.viewport = {
            width: frame.metadata.deviceWidth,
            height: frame.metadata.deviceHeight,
          };
        }
      }
    } catch (error) {
      capture.failure = error.message;
      capture.running = false;
    }
  })();
  capture.mark = (caption) =>
    capture.events.push({ at_ms: Date.now() - capture.started, caption });
  capture.stop = async () => {
    capture.running = false;
    await cdp.send("Page.stopScreencast");
    await capture.pump;
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById(${JSON.stringify(CURSOR_ID)})?.remove()`,
    });
    const manifest = {
      name: "As I Am",
      url: "http://localhost:5273/",
      recorded_at: new Date().toISOString(),
      total_ms: Date.now() - capture.started,
      viewport: capture.viewport,
      frame_count: capture.frames.length,
      frames: capture.frames,
      events: capture.events,
      failure: capture.failure,
      transport:
        "Guided demo using the validated fallback; not native agent execution.",
    };
    await fs.writeFile(
      path.join(directory, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    if (capture.failure || !capture.frames.length)
      throw new Error(capture.failure || "No frames captured");
    return manifest;
  };
  return capture;
}

const attributes = (node) =>
  Object.fromEntries(
    (node.attributes ?? []).reduce(
      (pairs, value, index, list) =>
        index % 2 ? pairs : [...pairs, [value, list[index + 1]]],
      [],
    ),
  );
const textOf = (node) =>
  node.nodeName === "#text"
    ? node.nodeValue
    : (node.children ?? []).map(textOf).join(" ").replace(/\s+/g, " ").trim();

/** Locate only rendered DOM text, scoped to the known site frame. */
export async function clickRecordedControl(cdp, label, site = "shell") {
  const { root } = await cdp.send("DOM.getDocument", {
    depth: -1,
    pierce: true,
  });
  const candidates = [];
  function visit(node, scope = "shell") {
    const attrs = attributes(node);
    if (
      ["BUTTON", "SUMMARY"].includes(node.nodeName) &&
      scope === site &&
      (attrs["aria-label"] || textOf(node)).startsWith(label)
    )
      candidates.push({ node, attrs });
    for (const child of node.children ?? []) visit(child, scope);
    if (node.contentDocument) visit(node.contentDocument, attrs.title || scope);
  }
  visit(root);
  if (candidates.length !== 1)
    throw new Error(
      `Expected one ${site} control '${label}', found ${candidates.length}`,
    );
  const { node, attrs } = candidates[0];
  if ("disabled" in attrs) throw new Error(`Control '${label}' is disabled`);
  await cdp.send("DOM.scrollIntoViewIfNeeded", { nodeId: node.nodeId });
  const { model } = await cdp.send("DOM.getBoxModel", { nodeId: node.nodeId });
  const x = (model.border[0] + model.border[2]) / 2;
  const y = (model.border[1] + model.border[5]) / 2;
  await cdp.send("Runtime.evaluate", {
    expression: `(async () => { const c = document.getElementById(${JSON.stringify(CURSOR_ID)}); if (!c) throw Error('Recording cursor missing'); const start = getComputedStyle(c).transform; const end = 'translate(${x}px,${y}px)'; await c.animate([{transform:start},{transform:end}],{duration:550,easing:'ease-in-out',fill:'forwards'}).finished; c.style.transform=end; c.getAnimations().forEach(a=>a.cancel()); c.animate([{opacity:1},{opacity:.4},{opacity:1}],{duration:260}); })()`,
    awaitPromise: true,
  });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  return { label, site, x, y };
}
