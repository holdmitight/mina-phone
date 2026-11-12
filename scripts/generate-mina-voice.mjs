/**
 * Render the final fictional call using VoiceStudio's local TTS API.
 * Never put API credentials in the published client.
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(root, "src/skins/MinaFinalCall.tsx"), "utf8");
const lines = [...source.matchAll(/\{\s*ja:\s*"([^"]+)"\s*,\s*zh:/gu)]
  .slice(0, 7).map((match) => match[1]);
if (lines.length !== 7) throw Error("Could not find all 7 final-call lines.");

const outcomes = {};
for (const choice of ["meet", "decline"]) {
  const pattern = new RegExp(choice + ':\\s*\\{\\s*ja:\\s*"([^"]+)"', "u");
  const match = source.match(pattern);
  if (!match) throw Error("Could not find outcome " + choice);
  outcomes[choice] = match[1];
}

if (process.argv.includes("--check")) {
  console.log("VoiceStudio script checked: 7 call lines and 2 outcomes.");
  process.exit(0);
}

const base = new URL(process.env.VOICESTUDIO_URL || "http://127.0.0.1:3900");
if (!["http:", "https:"].includes(base.protocol)) throw Error("VoiceStudio URL must use HTTP(S)");
if (base.protocol === "http:" && !["localhost", "127.0.0.1", "::1", "[::1]"].includes(base.hostname)) {
  throw Error("Use HTTPS for a non-local VoiceStudio server to protect API credentials");
}
const key = process.env.OMNIVOICE_API_KEY || "";
const voice = process.env.VOICESTUDIO_VOICE || "alloy";
const model = process.env.VOICESTUDIO_MODEL || "tts-1";
const sampleOnly = process.argv.includes("--sample");
const outputDir = path.join(root, sampleOnly ? "voice-preview" : "public/mina-voice");
await mkdir(outputDir, { recursive: true });

const entries = [
  ...lines.map((input, index) => ({
    input,
    filename: "line-" + String(index + 1).padStart(2, "0") + ".wav",
    kind: "line",
  })),
  ...Object.entries(outcomes).map(([choice, input]) => ({
    input,
    filename: "outcome-" + choice + ".wav",
    choice,
    kind: "outcome",
  })),
];

const manifest = { lines: [], outcomes: {} };
const toGenerate = sampleOnly ? entries.slice(0, 1) : entries;
for (const [index, entry] of toGenerate.entries()) {
  const response = await fetch(new URL("/v1/audio/speech", base), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: "Bearer " + key } : {}),
    },
    body: JSON.stringify({
      model, voice, input: entry.input, response_format: "wav",
    }),
    signal: AbortSignal.timeout(180000),
  });
  if (!response.ok) {
    throw Error("VoiceStudio TTS failed (" + response.status + "): " + (await response.text()).slice(0, 500));
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 44 || bytes.toString("ascii", 0, 4) !== "RIFF" ||
      bytes.toString("ascii", 8, 12) !== "WAVE") {
    throw Error("VoiceStudio returned invalid WAV audio for " + entry.filename);
  }
  await writeFile(path.join(outputDir, entry.filename), bytes);
  if (entry.kind === "line") manifest.lines.push(entry.filename);
  else manifest.outcomes[entry.choice] = entry.filename;
  console.log("Generated " + (index + 1) + "/" + toGenerate.length + ": " + entry.filename);
}
if (sampleOnly) {
  console.log("Preview ready: voice-preview/line-01.wav (not published to the game).");
  process.exit(0);
}
await writeFile(path.join(root, "src/skins/minaVoiceAssets.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("Done. Commit public/mina-voice/*.wav and src/skins/minaVoiceAssets.json to publish AI voices.");
