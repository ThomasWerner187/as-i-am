import assert from "node:assert/strict";
import test from "node:test";
import {
  alignStory,
  storyText,
  fitIntervals,
  retimeCapture,
  subtitleFiles,
  wrapCaption,
} from "./continuous-timing.mjs";

const story = [
  { chapter: "Pitch", sourceChapter: null, text: "Your web." },
  { chapter: "Demo", sourceChapter: "Original", text: "Your choice." },
];
const text = storyText(story);
const alignment = {
  characters: [...text],
  character_start_times_seconds: [...text].map((_, i) => i / 10),
  character_end_times_seconds: [...text].map((_, i) => (i + 1) / 10),
};
const manifest = {
  total_ms: 3020,
  events: [{ caption: "Original", at_ms: 10 }],
  frames: [
    { file: "000000.jpg", at_ms: 20 },
    { file: "000001.jpg", at_ms: 120 },
    { file: "000002.jpg", at_ms: 220 },
  ],
};

test("one full script supplies chapter markers and globally aligned captions", () => {
  const plan = alignStory(story, alignment, 3);
  assert.equal(text, "Your web. Your choice.");
  assert.equal(plan.chapters[1].start, 1);
  assert.equal(plan.chapters[0].end, 1);
  assert.equal(plan.duration, 3.6);
  assert.deepEqual(
    plan.cues.map((cue) => cue.text),
    ["Your web.", "Your choice."],
  );
});
test("rejects a changed script, nonmonotonic or nonfinite speech timing", () => {
  assert.throws(() =>
    alignStory([{ ...story[0], text: "Changed" }], alignment, 3),
  );
  assert.throws(() =>
    alignStory(
      story,
      {
        ...alignment,
        character_start_times_seconds: alignment.characters.map(() => NaN),
      },
      3,
    ),
  );
  const starts = [...alignment.character_start_times_seconds];
  starts[3] = 0;
  assert.throws(() =>
    alignStory(
      story,
      { ...alignment, character_start_times_seconds: starts },
      3,
    ),
  );
});
test("shortens static holds, never click motion, to fit the continuous voice", () => {
  const intervals = [
    { file: "a", seconds: 0.1 },
    { file: "b", seconds: 3 },
    { file: "c", seconds: 0.1 },
    { file: "d", seconds: 4 },
  ];
  const result = fitIntervals(intervals, 4);
  assert.equal(result[0].seconds, 0.1);
  assert.equal(result[2].seconds, 0.1);
  assert.ok(
    Math.abs(result.reduce((sum, item) => sum + item.seconds, 0) - 4) < 0.00001,
  );
  assert.deepEqual(
    result.map((item) => item.file),
    intervals.map((item) => item.file),
  );
});
test("refuses to rush motion when a spoken beat is too short", () => {
  assert.throws(() =>
    fitIntervals([{ seconds: 0.1 }, { seconds: 0.1 }, { seconds: 4 }], 0.15),
  );
});
test("preserves every source chapter and adds only an opening hold", () => {
  const plan = alignStory(story, alignment, 3);
  const result = retimeCapture(manifest, plan);
  assert.equal(result.frames[0].seconds, 1);
  assert.deepEqual(
    result.frames.slice(1).map((frame) => frame.file),
    manifest.frames.map((frame) => frame.file),
  );
  assert.ok(
    Math.abs(
      result.frames.reduce((sum, frame) => sum + frame.seconds, 0) -
        plan.duration,
    ) < 0.00001,
  );
});
test("rejects incomplete captures and frame paths outside the capture", () => {
  const plan = alignStory(story, alignment, 3);
  assert.throws(() => retimeCapture({ ...manifest, failure: "failed" }, plan));
  assert.throws(() =>
    retimeCapture(
      { ...manifest, frames: [{ ...manifest.frames[0], file: "../bad.jpg" }] },
      plan,
    ),
  );
  assert.throws(() =>
    retimeCapture(manifest, {
      chapters: [{ sourceChapter: "Missing", start: 0, end: 3 }],
    }),
  );
});
test("writes matching SRT and VTT from global speech times", () => {
  const files = subtitleFiles(alignStory(story, alignment, 3).cues);
  assert.match(files.srt, /00:00:01,000 -->/);
  assert.match(files.vtt, /^WEBVTT/);
  assert.match(files.vtt, /00:00:01\.000 -->/);
});

test("balances caption lines instead of leaving one dangling word", () => {
  const caption = "It keeps its own design and my selection, without";
  const lines = wrapCaption(caption).split("\n");
  assert.equal(lines.length, 2);
  assert.ok(
    lines.every((line) => line.length <= 42 && line.split(" ").length > 1),
  );
  assert.equal(lines.join(" "), caption);
  assert.equal(wrapCaption("The web adapts to you."), "The web adapts to you.");
});
