/**
 * IronLog — external exercise catalogue loader.
 *
 * IronLog ships a curated starter library inline (exercises.js) plus two
 * fetched catalogues: MIT-licensed data from hasaneyldrm/exercises-dataset and
 * illustrated records from RepDB's attribution-required free tier. Fetching
 * rather than importing keeps the indexes off the critical first-paint path,
 * and the curated library still works if either request fails.
 *
 * Instruction text is split by source and language and loaded only when an
 * exercise detail is opened. Eleven languages are available across the two
 * sources without downloading every pack up front.
 *
 * LICENSING: Gym Visual media from the MIT data source remains excluded.
 * RepDB's free 512px WebP stills are separately licensed for in-app use with
 * visible attribution; premium evaluation animations are never included.
 */

const INDEX_PATH = "data/exercises-index.json";
const META_PATH = "data/catalogue-meta.json";
const REPDB_INDEX_PATH = "data/repdb-index.json";
const REPDB_META_PATH = "data/repdb-meta.json";
const stepsPath = (lang, provider = "dataset") =>
  provider === "repdb" ? `data/repdb-steps.${lang}.json` : `data/steps.${lang}.json`;
const SOURCE_LANGUAGES = {
  dataset: ["en", "es", "fr", "it", "pl", "ru", "tr", "zh", "hi", "ko"],
  repdb: ["en", "de", "es"],
};

/** Strip the "ds-" prefix the generator adds, to key into a step pack. */
export function rawDatasetId(id) {
  return String(id ?? "").replace(/^ds-/, "");
}

export function normaliseName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Merge the curated starter library with the external catalogue.
 *
 * The curated entry wins an exact normalised-name collision: its display name
 * is cleaner, it carries the barbell flag used for plate maths, and existing
 * saved workouts keep resolving to a stable id. Everything else is appended.
 *
 * A collision is not a dead end though. The losing catalogue record still owns
 * step-by-step instructions the curated entry does not have, so the winner is
 * linked to it via `stepsId` and those instructions remain reachable. The link
 * points at data only — never at media.
 *
 * Collided entries are shallow-copied rather than mutated, because the curated
 * array is a module-level constant shared by every caller.
 *
 * @param {object[]} curated
 * @param {object[]} dataset
 * @returns {{exercises: object[], collisions: number, linked: number}}
 */
export function mergeCatalogues(curated = [], dataset = []) {
  const byName = new Map();
  curated.forEach((e, i) => {
    const key = normaliseName(e.name);
    if (key) byName.set(key, i);
  });

  const merged = curated.slice();
  let collisions = 0;
  let linked = 0;

  for (const e of dataset ?? []) {
    if (!e || typeof e.id !== "string" || !e.name) continue;
    const key = normaliseName(e.name);
    const curatedPosition = byName.get(key);

    if (curatedPosition !== undefined) {
      collisions += 1;
      const winner = merged[curatedPosition];
      let enriched = winner;
      let changed = false;

      // Only curated/custom-shaped records need an instruction link. Catalogue
      // records already resolve through their own ids, and existing ids must
      // stay stable for workouts saved before a second source was added.
      if (!winner.stepsId && winner.source !== "dataset" && winner.source !== "repdb") {
        enriched = { ...enriched, stepsId: e.id };
        linked += 1;
        changed = true;
      }

      // A name collision should not throw away RepDB's licensed illustration.
      // Enrich the winning record without changing its id or instruction link.
      if (e.media && !winner.media) {
        if (!changed) enriched = { ...winner };
        enriched.media = e.media;
        changed = true;
      }

      if (changed) merged[curatedPosition] = enriched;
      continue;
    }

    byName.set(key, merged.length);
    merged.push(e);
  }

  return { exercises: merged, collisions, linked };
}

/**
 * Fetch and parse JSON, returning null rather than throwing so a missing or
 * malformed file degrades to "curated library only" instead of a blank app.
 */
async function fetchJson(path, { timeoutMs = 15000 } = {}) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetch(path, { signal: controller?.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Load the external catalogue.
 *
 * @param {string} [base] directory the data files live in, relative to the page
 * @returns {Promise<{exercises: object[], meta: object|null, available: boolean}>}
 */
export async function loadCatalogue(base = "") {
  const prefix = base ? `${base.replace(/\/+$/, "")}/` : "";
  const [index, meta, repdbIndex, repdbMeta] = await Promise.all([
    fetchJson(`${prefix}${INDEX_PATH}`),
    fetchJson(`${prefix}${META_PATH}`),
    fetchJson(`${prefix}${REPDB_INDEX_PATH}`),
    fetchJson(`${prefix}${REPDB_META_PATH}`),
  ]);

  const baseAvailable = Array.isArray(index) && index.length > 0;
  const repdbAvailable = Array.isArray(repdbIndex) && repdbIndex.length > 0;
  if (!baseAvailable && !repdbAvailable) {
    return { exercises: [], meta: null, available: false };
  }

  // Preserve the original result shape when RepDB is unavailable so a partial
  // deployment degrades exactly as before.
  if (!repdbAvailable) return { exercises: index, meta, available: true };

  const exercises = [...(baseAvailable ? index : []), ...repdbIndex];
  const languageMap = new Map();
  for (const lang of [...(meta?.languages ?? []), ...(repdbMeta?.languages ?? [])]) {
    if (lang?.code) languageMap.set(lang.code, { ...languageMap.get(lang.code), ...lang });
  }
  const languages = [...languageMap.values()];
  const combinedMeta = {
    ...(meta ?? {}),
    counts: {
      ...(meta?.counts ?? {}),
      exercises: exercises.length,
      languages: languages.length,
      repdbExercises: repdbIndex.length,
      repdbImages: repdbMeta?.counts?.images ?? 0,
    },
    languages,
    sources: {
      dataset: meta?.source ?? null,
      repdb: repdbMeta?.source ?? null,
    },
    repdb: repdbMeta ?? null,
  };

  return { exercises, meta: combinedMeta, available: true };
}

/**
 * Load one language's instruction pack, memoised per language so reopening
 * details never refetches.
 *
 * @type {Map<string, Promise<Object<string, string[]>|null>>}
 */
const stepCache = new Map();

export function loadSteps(lang = "en", base = "", provider = "dataset") {
  const prefix = base ? `${base.replace(/\/+$/, "")}/` : "";
  const key = `${prefix}${provider}:${lang}`;
  if (!stepCache.has(key)) {
    stepCache.set(
      key,
      fetchJson(`${prefix}${stepsPath(lang, provider)}`).then((pack) =>
        pack && typeof pack === "object" ? pack : null,
      ),
    );
  }
  return stepCache.get(key);
}

/** Clear the memo, used when the user switches language or in tests. */
export function clearStepsCache() {
  stepCache.clear();
}

/**
 * Whether an exercise has catalogue instructions to show. True for catalogue
 * entries, and for a curated entry that won a name collision and was therefore
 * linked to the losing record's instructions via stepsId.
 */
export function hasInstructions(exercise) {
  return Boolean(exercise) &&
    (exercise.source === "dataset" || exercise.source === "repdb" || Boolean(exercise.stepsId));
}

/** The catalogue id whose instructions apply to this exercise, if any. */
export function stepsKey(exercise) {
  if (!exercise) return null;
  if (exercise.stepsId) return exercise.stepsId;
  return exercise.source === "dataset" || exercise.source === "repdb" ? exercise.id : null;
}

/**
 * Resolve the instruction steps for one exercise in one language.
 * Returns { steps, language, fellBack } — falls back to English when the
 * requested pack is missing or has no entry for that exercise.
 *
 * Accepts either an id string or an exercise object, so a linked curated entry
 * transparently resolves through its stepsId.
 */
export async function stepsFor(exerciseOrId, lang = "en", base = "") {
  const exerciseId =
    typeof exerciseOrId === "string" ? exerciseOrId : (stepsKey(exerciseOrId) ?? exerciseOrId?.id);
  const raw = rawDatasetId(exerciseId);
  const provider =
    (typeof exerciseOrId === "object" && exerciseOrId?.source === "repdb") ||
    String(exerciseId ?? "").startsWith("repdb-")
      ? "repdb"
      : "dataset";

  // Language availability is source-specific. Do not issue a known-404 request
  // for German on the original source (or French on RepDB) just to discover
  // that English is the appropriate fallback.
  if (lang !== "en" && !SOURCE_LANGUAGES[provider].includes(lang)) {
    const fallback = await loadSteps("en", base, provider);
    const enSteps = fallback?.[raw];
    return {
      steps: Array.isArray(enSteps) ? enSteps : [],
      language: "en",
      fellBack: true,
    };
  }

  const requested = await loadSteps(lang, base, provider);
  const steps = requested?.[raw];
  if (Array.isArray(steps) && steps.length > 0) {
    return { steps, language: lang, fellBack: false };
  }
  if (lang === "en") return { steps: [], language: "en", fellBack: false };

  const fallback = await loadSteps("en", base, provider);
  const enSteps = fallback?.[raw];
  if (Array.isArray(enSteps) && enSteps.length > 0) {
    return { steps: enSteps, language: "en", fellBack: true };
  }
  return { steps: [], language: lang, fellBack: false };
}

/**
 * Language names, in English and in the language itself.
 *
 * Held here rather than in the generated metadata so the picker does not depend
 * on a regeneration, and because a flag is not a language: emoji flags are both
 * an icon system standing on a glyph and wrong for most speakers (Spanish is
 * not only Spain, English is not only Britain). The native name carries the
 * choice instead.
 */
export const LANGUAGE_NAMES = {
  en: { label: "English", native: "English" },
  es: { label: "Spanish", native: "Español" },
  de: { label: "German", native: "Deutsch" },
  fr: { label: "French", native: "Français" },
  it: { label: "Italian", native: "Italiano" },
  pl: { label: "Polish", native: "Polski" },
  ru: { label: "Russian", native: "Русский" },
  tr: { label: "Turkish", native: "Türkçe" },
  zh: { label: "Chinese", native: "中文" },
  hi: { label: "Hindi", native: "हिन्दी" },
  ko: { label: "Korean", native: "한국어" },
};

/** Languages present in the generated metadata, for the settings picker. */
export function availableLanguages(meta) {
  const list = meta?.languages;
  if (!Array.isArray(list) || list.length === 0) {
    return [{ code: "en", ...LANGUAGE_NAMES.en }];
  }
  return list.map((l) => {
    const names = LANGUAGE_NAMES[l.code] ?? { label: l.label ?? l.code, native: l.label ?? l.code };
    return { code: l.code, label: names.label, native: names.native };
  });
}
