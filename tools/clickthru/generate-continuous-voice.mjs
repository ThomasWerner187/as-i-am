/** Generate one complete performance. Rendering later never calls ElevenLabs. */
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { alignStory, storyText, subtitleFiles } from "./continuous-timing.mjs";

const [destination, voiceId, voiceName = "Selected voice"] =
  process.argv.slice(2);
if (!destination || !/^[A-Za-z0-9]{20}$/.test(voiceId ?? ""))
  throw new Error(
    "Usage: node generate-continuous-voice.mjs <output-directory> <voice-id> [voice-name]",
  );
const directory = path.resolve(destination);
await fs.mkdir(directory, { recursive: true });
const story = JSON.parse(
  await fs.readFile(
    new URL("./continuous-story.json", import.meta.url),
    "utf8",
  ),
);
const request = {
  text: storyText(story),
  model_id: "eleven_multilingual_v2",
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.1,
    use_speaker_boost: true,
    speed: 0.9,
  },
};
const fingerprint = createHash("sha256")
  .update(JSON.stringify({ voiceId, request }))
  .digest("hex");
const cacheFile = path.join(directory, "continuous-response.json");
let cached;
try {
  cached = JSON.parse(await fs.readFile(cacheFile, "utf8"));
  if (cached.fingerprint !== fingerprint)
    throw new Error(
      "Script or voice changed; preserve this take and use a new directory.",
    );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  if (!process.env.ELEVENLABS_API_KEY)
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  // An uncertain request cannot silently charge the account again on rerun.
  await fs.writeFile(
    path.join(directory, "continuous-request.json"),
    JSON.stringify({ fingerprint, voiceId, request }),
    { flag: "wx" },
  );
  console.log(
    `Generating one continuous performance: ${request.text.split(/\s+/).length} words.`,
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
  if (!response.ok)
    throw new Error(
      `ElevenLabs failed: HTTP ${response.status}. No automatic retry; request marker retained.`,
    );
  const result = await response.json();
  if (
    typeof result.audio_base64 !== "string" ||
    !result.alignment?.characters?.length
  )
    throw new Error(
      "No complete audio/alignment returned. Request marker retained; no paid retry.",
    );
  cached = { fingerprint, result };
  await fs.writeFile(cacheFile, JSON.stringify(cached), { flag: "wx" });
}
const master = path.join(directory, "continuous-master.mp3");
const bytes = Buffer.from(cached.result.audio_base64, "base64");
try {
  await fs.writeFile(master, bytes, { flag: "wx" });
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  if (!(await fs.readFile(master)).equals(bytes))
    throw new Error("Existing master differs from saved speech.");
}
const seconds = Number(
  execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      master,
    ],
    { encoding: "utf8" },
  ),
);
const plan = alignStory(story, cached.result.alignment, seconds);
await fs.writeFile(
  path.join(directory, "speech-plan.json"),
  JSON.stringify(
    {
      ...plan,
      voiceName,
      provider: "ElevenLabs",
      fingerprint,
      audioSha256: createHash("sha256").update(bytes).digest("hex"),
      requestCount: 1,
      audioEdits: [],
    },
    null,
    2,
  ),
);
const subtitles = subtitleFiles(plan.cues);
await fs.writeFile(
  path.join(directory, "as-i-am-continuous.srt"),
  subtitles.srt,
);
await fs.writeFile(
  path.join(directory, "as-i-am-continuous.vtt"),
  subtitles.vtt,
);
await fs.writeFile(
  path.join(directory, "spoken-script.txt"),
  request.text + "\n",
);
console.log(
  JSON.stringify(
    {
      master,
      seconds,
      pitchSeconds: plan.chapters[0].end,
      chapters: plan.chapters.map(({ chapter, start, end }) => ({
        chapter,
        start,
        end,
      })),
    },
    null,
    2,
  ),
);
