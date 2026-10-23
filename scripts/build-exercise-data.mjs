#!/usr/bin/env node
/**
 * Build IronLog's exercise catalogue from hasaneyldrm/exercises-dataset.
 *
 *   node scripts/build-exercise-data.mjs [--source <path-to-dataset>]
 *
 * WHAT THIS SHIPS, AND WHAT IT DELIBERATELY DOES NOT
 * --------------------------------------------------
 * The upstream repository is dual-licensed (see its LICENSE and NOTICE.md):
 *
 *   - The exercise DATA — names, category, body part, equipment, target,
 *     muscle group, secondary muscles, and the step-by-step instruction text
 *     and its translations — is MIT licensed, (c) 2026 Hasan Emir Yildirim.
 *     That is what this script copies, with attribution retained.
 *
 *   - The exercise MEDIA in images/ and videos/ is (c) Gym Visual and is
 *     explicitly NOT covered by that MIT grant. The upstream LICENSE states
 *     that cloning the repository grants no licence to the media and that you
 *     must obtain your own from Gym Visual.
 *
 * So this script strips every media reference — image, gif_url, media_id and
 * the per-record media attribution field — and refuses to emit them. IronLog
 * ships no Gym Visual media from this source. `--allow-media` does not exist.
 * Separately licensed RepDB stills are handled by build-repdb-data.mjs.
 *
 * OUTPUT
 *   app/data/exercises-index.json   compact metadata for every exercise
 *   app/data/steps.<lang>.json      id -> numbered instruction steps, per
 *                                   language, loaded lazily on demand
 *   app/data/catalogue-meta.json    counts, languages, source provenance
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ── Taxonomy mapping ───────────────────────────────────────────────────────
//
// Upstream uses a 10-value body_part and a 19-value target. IronLog groups by
// the muscle a lifter thinks about, so target wins where it is specific and
// body_part is the fallback.

const TARGET_TO_MUSCLE = {
  pectorals: "chest",
  lats: "back",
  "upper back": "back",
  traps: "back",
  spine: "back",
  "levator scapulae": "back",
  "serratus anterior": "back",
  delts: "shoulders",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearms",
  quads: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  abductors: "glutes",
  adductors: "glutes",
  calves: "calves",
  abs: "core",
  "cardiovascular system": "cardio",
};

const BODY_PART_TO_MUSCLE = {
  chest: "chest",
  back: "back",
  shoulders: "shoulders",
  "upper arms": "biceps",
  "lower arms": "forearms",
  "upper legs": "quads",
  "lower legs": "calves",
  waist: "core",
  cardio: "cardio",
  neck: "neck",
};

/** Fields that reference unlicensed third-party media and must never ship. */
const MEDIA_FIELDS = ["image", "gif_url", "media_id", "attribution"];

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "pl", label: "Polish", native: "Polski" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ko", label: "Korean", native: "한국어" },
];

export function mapMuscle(record) {
  const byTarget = TARGET_TO_MUSCLE[record.target];
  if (byTarget) return byTarget;
  const byBodyPart = BODY_PART_TO_MUSCLE[record.body_part];
  return byBodyPart ?? "other";
}

/** Normalise a name so "Barbell Bench Press" and "barbell bench press" collide. */
export function normaliseName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseArgs(argv) {
  const args = { source: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--source") args.source = argv[++i];
  }
  return args;
}

async function findDataset(explicit) {
  const candidates = explicit
    ? [resolve(explicit)]
    : [
        resolve(ROOT, "../exercises-dataset"),
        resolve(ROOT, "third_party/exercises-dataset"),
        resolve(process.cwd(), "exercises-dataset"),
      ];
  for (const dir of candidates) {
    const file = join(dir, "data/exercises.json");
    if (existsSync(file)) return { dir, file };
  }
  throw new Error(
    `Could not find the dataset. Clone it first, or pass --source:\n` +
      `  git clone https://github.com/hasaneyldrm/exercises-dataset.git\n` +
      `  node scripts/build-exercise-data.mjs --source /path/to/exercises-dataset\n` +
      `Looked in:\n${candidates.map((c) => `  - ${c}`).join("\n")}`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { dir, file } = await findDataset(args.source);

  console.log(`Source dataset : ${dir}`);
  const raw = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("exercises.json is not a non-empty array");
  console.log(`Records read   : ${raw.length}`);

  // Reject anything carrying media references, rather than silently dropping it,
  // so a future upstream field rename cannot smuggle them through.
  const index = [];
  const steps = new Map(LANGUAGES.map((l) => [l.code, {}]));
  const seenNames = new Map();
  const skipped = { dupeName: 0, noId: 0 };
  let mediaFieldsSeen = 0;

  for (const record of raw) {
    for (const field of MEDIA_FIELDS) {
      if (field in record) mediaFieldsSeen += 1;
    }
    if (!record.id || !record.name) {
      skipped.noId += 1;
      continue;
    }

    const key = normaliseName(record.name);
    if (seenNames.has(key)) {
      skipped.dupeName += 1;
      continue;
    }
    seenNames.set(key, record.id);

    index.push({
      id: `ds-${record.id}`,
      name: record.name,
      muscle: mapMuscle(record),
      bodyPart: record.body_part ?? null,
      target: record.target ?? null,
      equipment: record.equipment ?? "other",
      category: record.category ?? null,
      muscleGroup: record.muscle_group ?? null,
      secondaryMuscles: Array.isArray(record.secondary_muscles) ? record.secondary_muscles : [],
      source: "dataset",
    });

    for (const lang of LANGUAGES) {
      const list = record.instruction_steps?.[lang.code];
      if (Array.isArray(list) && list.length > 0) {
        steps.get(lang.code)[record.id] = list.map((s) => String(s).trim()).filter(Boolean);
      }
    }
  }

  // Fail closed: no media field may survive into the emitted artefacts.
  const emitted = JSON.stringify(index);
  for (const banned of ["gif_url", "media_id", "gymvisual", "/images/", "/videos/"]) {
    if (emitted.toLowerCase().includes(banned)) {
      throw new Error(`Refusing to write output: found media reference "${banned}" in the index.`);
    }
  }

  const outDir = join(ROOT, "app/data");
  await mkdir(outDir, { recursive: true });

  await writeFile(join(outDir, "exercises-index.json"), `${JSON.stringify(index)}\n`);

  const languagesWritten = [];
  for (const lang of LANGUAGES) {
    const entries = steps.get(lang.code);
    const ids = Object.keys(entries);
    if (ids.length === 0) continue;
    await writeFile(join(outDir, `steps.${lang.code}.json`), `${JSON.stringify(entries)}\n`);
    languagesWritten.push({
      code: lang.code,
      label: lang.label,
      native: lang.native,
      exercises: ids.length,
      bytes: JSON.stringify(entries).length,
    });
  }

  const upstreamLicense = existsSync(join(dir, "LICENSE"))
    ? await readFile(join(dir, "LICENSE"), "utf8")
    : "";
  const upstreamCommit = await readUpstreamCommit(dir);

  const meta = {
    generatedAt: new Date().toISOString(),
    generator: "scripts/build-exercise-data.mjs",
    source: {
      repository: "https://github.com/hasaneyldrm/exercises-dataset",
      commit: upstreamCommit,
      localPath: dir,
      recordsRead: raw.length,
    },
    counts: {
      exercises: index.length,
      languages: languagesWritten.length,
      skippedDuplicateNames: skipped.dupeName,
      skippedMissingId: skipped.noId,
      mediaFieldsStripped: mediaFieldsSeen,
    },
    languages: languagesWritten,
    licensing: {
      data: {
        license: "MIT",
        copyright: "Copyright (c) 2026 Hasan Emir Yıldırım",
        note: "Exercise names, taxonomy and instruction text/translations are MIT licensed. The copyright notice is retained here and surfaced in the app as MIT requires.",
      },
      media: {
        included: false,
        copyright: "© Gym Visual — https://gymvisual.com/",
        note: "The upstream images/ and videos/ media is NOT covered by the MIT grant; upstream states that cloning grants no media licence. IronLog ships no media and strips image, gif_url, media_id and attribution fields.",
        mediaFieldsStripped: mediaFieldsSeen,
      },
      upstreamLicenseContainsMediaException: upstreamLicense.includes("MEDIA EXCEPTION"),
    },
  };

  await writeFile(join(outDir, "catalogue-meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

  const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
  console.log("");
  console.log(`Exercises kept : ${index.length}  (${kb(emitted.length)} index)`);
  console.log(`Duplicate names: ${skipped.dupeName} skipped`);
  console.log(`Media fields   : ${mediaFieldsSeen} stripped, none emitted`);
  console.log(`Languages      : ${languagesWritten.length}`);
  for (const l of languagesWritten) console.log(`   ${l.code}  ${l.native.padEnd(10)} ${l.exercises} exercises  ${kb(l.bytes)}`);
  console.log("");
  console.log(`Wrote to ${outDir}`);
}

async function readUpstreamCommit(dir) {
  try {
    const { execFileSync } = await import("node:child_process");
    return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

/**
 * Run only when executed directly, so tests can import mapMuscle and
 * normaliseName without triggering a full regeneration.
 */
function isDirectRun() {
  const entry = process.argv[1];
  return Boolean(entry) && resolve(entry) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  main().catch((error) => {
    console.error(`\n${error.message}\n`);
    process.exit(1);
  });
}
