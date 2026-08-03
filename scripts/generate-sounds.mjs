/**
 * Generate quiz sound effect MP3 files using Web Audio API rendered to WAV,
 * then stored as ready-to-use files in public/sounds/.
 *
 * Run: node generate-sounds.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "sounds");

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

/* ── Tiny WAV encoder ─────────────────────────────────── */
function encodeWav(samples, sampleRate = 22050) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeStr = (offset, str) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);       // PCM
    view.setUint16(22, 1, true);       // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return Buffer.from(buffer);
}

/* ── Sound Generators ─────────────────────────────────── */
const SR = 22050;

function generateTone(freq, duration, envelope = "decay", harmonics = []) {
    const len = Math.floor(SR * duration);
    const samples = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        const t = i / SR;
        let env;
        if (envelope === "decay") env = Math.exp(-t * 6);
        else if (envelope === "soft") env = Math.exp(-t * 3);
        else if (envelope === "pluck") env = Math.exp(-t * 10);
        else env = Math.exp(-t * 4);

        let val = Math.sin(2 * Math.PI * freq * t);
        for (const h of harmonics) {
            val += h.amp * Math.sin(2 * Math.PI * freq * h.ratio * t);
        }
        samples[i] = val * env * 0.4;
    }
    return samples;
}

function mixSounds(...arrays) {
    const maxLen = Math.max(...arrays.map(a => a.length));
    const result = new Float32Array(maxLen);
    for (const arr of arrays) {
        for (let i = 0; i < arr.length; i++) result[i] += arr[i];
    }
    return result;
}

function delaySound(samples, delaySecs) {
    const delaySamples = Math.floor(SR * delaySecs);
    const result = new Float32Array(samples.length + delaySamples);
    for (let i = 0; i < samples.length; i++) result[i + delaySamples] = samples[i];
    return result;
}

/* ── Define Each Sound ────────────────────────────────── */

// select.mp3 — a soft click/pop
const selectSamples = generateTone(880, 0.08, "pluck", [{ ratio: 2, amp: 0.3 }]);

// next.mp3 — ascending two-note chime
const nextSamples = mixSounds(
    generateTone(523, 0.12, "decay", [{ ratio: 2, amp: 0.2 }]),
    delaySound(generateTone(659, 0.15, "decay", [{ ratio: 2, amp: 0.2 }]), 0.08)
);

// flag.mp3 — short alert blip
const flagSamples = generateTone(440, 0.15, "soft", [{ ratio: 1.5, amp: 0.3 }, { ratio: 3, amp: 0.1 }]);

// hint.mp3 — gentle bell
const hintSamples = generateTone(1047, 0.2, "soft", [{ ratio: 2.5, amp: 0.15 }, { ratio: 4, amp: 0.05 }]);

// tick.mp3 — very short tick
const tickSamples = generateTone(1200, 0.04, "pluck");

// submit.mp3 — triumphant ascending chord
const submitSamples = mixSounds(
    generateTone(523, 0.3, "soft", [{ ratio: 2, amp: 0.15 }]),
    delaySound(generateTone(659, 0.25, "soft", [{ ratio: 2, amp: 0.15 }]), 0.1),
    delaySound(generateTone(784, 0.35, "soft", [{ ratio: 2, amp: 0.15 }]), 0.2)
);

/* ── Write Files ──────────────────────────────────────── */
const sounds = {
    "select.wav": selectSamples,
    "next.wav": nextSamples,
    "flag.wav": flagSamples,
    "hint.wav": hintSamples,
    "tick.wav": tickSamples,
    "submit.wav": submitSamples,
};

for (const [name, samples] of Object.entries(sounds)) {
    const wav = encodeWav(samples, SR);
    const outPath = join(outDir, name);
    writeFileSync(outPath, wav);
    console.log(`✓ Generated ${outPath} (${wav.length} bytes)`);
}

console.log("\nDone! All sound effects generated in public/sounds/");
