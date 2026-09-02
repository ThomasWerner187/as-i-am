import assert from "node:assert/strict";
import test from "node:test";
import { voiceRequest } from "./voice-request.mjs";

test("preserves the original v2 request and cache fingerprint inputs", () => {
  assert.deepEqual(voiceRequest("One complete story."), {
    text: "One complete story.",
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.1,
      use_speaker_boost: true,
      speed: 0.9,
    },
  });
});
test("uses v3 natural stability without unsupported speed or speaker boost", () => {
  const request = voiceRequest("One complete story.", "eleven_v3");
  assert.equal(request.model_id, "eleven_v3");
  assert.equal(request.voice_settings.stability, 0.5);
  assert.ok(!("speed" in request.voice_settings));
  assert.ok(!("use_speaker_boost" in request.voice_settings));
});
test("rejects unknown models before a paid request", () => {
  assert.throws(
    () => voiceRequest("Story", "unknown"),
    /Supported narration models/,
  );
});
