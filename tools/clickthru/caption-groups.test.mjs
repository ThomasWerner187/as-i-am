import assert from "node:assert/strict";
import test from "node:test";
import { groupCaptionWords } from "./caption-groups.mjs";

const words = (text) => [...text.matchAll(/\S+/g)];
const text = (group) => group.map((word) => word[0]).join(" ");

test("keeps short sentences separate", () => {
  assert.deepEqual(
    groupCaptionWords(words("Same cinema. Same seats.")).map(text),
    ["Same cinema.", "Same seats."],
  );
});

test("balances the longer narration sentence without a dangling last word", () => {
  const source = words(
    "Shopping, travel, everyday forms: the same idea, wherever websites support it.",
  );
  const groups = groupCaptionWords(source);
  assert.equal(groups.length, 2);
  assert.ok(
    groups.every((group) => group.length > 1 && text(group).length <= 76),
  );
  assert.deepEqual(groups.flat(), source);
  assert.ok(text(groups.at(-1)).endsWith("support it."));
});

test("preserves every original word and alignment index in a long sentence", () => {
  const source = words(
    "A longer sentence about personal preferences and supported website adaptations that should remain readable, preserve the original speech alignment, and never lose a single word while being divided into shorter cues.",
  );
  const groups = groupCaptionWords(source);
  assert.ok(groups.length > 2);
  assert.ok(groups.every((group) => text(group).length <= 76));
  assert.deepEqual(groups.flat(), source);
  for (let index = 0; index < source.length; index++)
    assert.equal(groups.flat()[index], source[index]);
});

test("accepts empty and unpunctuated narration", () => {
  assert.deepEqual(groupCaptionWords([]), []);
  assert.deepEqual(groupCaptionWords(words("Your web")).map(text), [
    "Your web",
  ]);
});
