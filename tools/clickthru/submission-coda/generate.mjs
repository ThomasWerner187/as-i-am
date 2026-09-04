import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const [destination, voiceId] = process.argv.slice(2);
if (!destination || !/^[A-Za-z0-9]{20}$/.test(voiceId ?? "")) {
  throw new Error("Usage: node generate.mjs <output-directory> <existing-voice-id>");
}
const directory = path.resolve(destination);
await fs.mkdir(directory, { recursive: true });

const text = "[warmly] As I Am is a working prototype for a web that adapts to you. [short pause] Web M C P lets an agent call tools registered by each website — to calm the interface, find seats, and plan dinner. [short pause] You stay in control.";
const request = {
  text,
  model_id: "eleven_v3",
  language_code: "en",
  voice_settings: { stability: 0.5 },
};
const fingerprint = createHash("sha256")
  .update(JSON.stringify({ voiceId, request }))
  .digest("hex");
const responsePath = path.join(directory, "voice-response.json");
let result;

try {
  const cached = JSON.parse(await fs.readFile(responsePath, "utf8"));
  if (cached.fingerprint !== fingerprint) {
    throw new Error("Preserve this performance and choose a fresh output directory.");
  }
  result = cached.result;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }
  // Keep this marker if the request fails: a retry may incur another charge.
  await fs.writeFile(
    path.join(directory, "voice-request.json"),
    JSON.stringify({ fingerprint, voiceId, request }),
    { flag: "wx" },
  );
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(90000),
    },
  );
  if (!response.ok) {
    throw new Error(`Generation failed: HTTP ${response.status}. No automatic retry.`);
  }
  result = await response.json();
  if (!result.audio_base64 || !result.alignment) {
    throw new Error("Incomplete response; request marker retained.");
  }
  await fs.writeFile(responsePath, JSON.stringify({ fingerprint, result }), {
    flag: "wx",
  });
}

await fs.writeFile(
  path.join(directory, "voice.mp3"),
  Buffer.from(result.audio_base64, "base64"),
);
await fs.writeFile(path.join(directory, "script.txt"), text + "\n");
await fs.writeFile(
  path.join(directory, "alignment.json"),
  JSON.stringify(result.normalized_alignment ?? result.alignment, null, 2),
);
console.log("Saved one continuous coda performance with character timestamps.");
