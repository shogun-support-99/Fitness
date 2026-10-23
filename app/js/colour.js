/**
 * The muscle colour system.
 *
 * IronLog was monochrome: one data blue for everything measurable, and every
 * muscle group named in the same grey badge. This module gives the twelve muscle
 * groups their own hues so that colour carries information rather than
 * decoration - which is the whole point of the app sheet's rule that the chrome
 * stays quiet and "the data carries the chroma".
 *
 * Hue is assigned by MOVEMENT ROLE, not arbitrarily, so the palette teaches
 * something:
 *
 *   push  (chest, shoulders, triceps)  warm - red through orange
 *   pull  (back, biceps, forearms)     cool - blue through teal
 *   legs  (quads, hamstrings, glutes, calves)  green through olive
 *   trunk (core)                       violet
 *   engine (cardio)                    a signal yellow, the one hue nobody else
 *                                      may borrow, because it means "not a lift"
 *
 * Two hard rules from the craft floor shape every value below:
 *
 * 1. Contrast. Ink must clear 4.5:1 on white AND on its own tint, because a
 *    badge sets its label on the tint. Large figures only need 3:1. These are
 *    not eyeballed - `tests/colour.test.js` recomputes every ratio from the hex
 *    values and fails the build if one drifts.
 * 2. On a coloured surface, secondary text is tinted FROM THAT HUE, never grey.
 *    So each entry ships a `sub` as well as an `ink`.
 *
 * Colour is never the only channel. Every muscle keeps its written name beside
 * the swatch, so the system degrades to text for anyone who cannot separate the
 * hues.
 */

/** The closed set of muscle values across both catalogues, in display order. */
export const MUSCLES = [
  "chest",
  "shoulders",
  "triceps",
  "back",
  "biceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "cardio",
];

/** Which movement role each muscle belongs to. Exported so views can group. */
export const MUSCLE_ROLE = {
  chest: "push",
  shoulders: "push",
  triceps: "push",
  back: "pull",
  biceps: "pull",
  forearms: "pull",
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  core: "trunk",
  cardio: "engine",
};

/**
 * Every muscle's palette, light and dark.
 *
 * `ink`   text and icon strokes on a white sheet
 * `tint`  the badge / panel ground
 * `edge`  a 1px rule on the tint, one step darker than the tint itself
 * `sub`   secondary text sitting ON the tint, tinted from the same hue
 * `chart` the series colour, darker than `ink` where needed to hold 3:1 as a
 *         large graphic element against white
 *
 * Dark values are not the light values lightened by a fixed amount: a hue that
 * reads at 4.5:1 on white usually fails on #171717 unless its lightness moves a
 * long way, and moving it that far desaturates it. Each was solved separately.
 */
export const MUSCLE_COLOURS = {
  // ── push: warm - red, orange, raspberry ─────────────────
  chest: {
    light: { ink: "#be2817", tint: "#faf0ee", edge: "#f1dbd9", sub: "#a8463b", chart: "#ce2e1c" },
    dark: { ink: "#dc9188", tint: "#4a2825", edge: "#643b36", sub: "#cf9690", chart: "#d2766c" },
  },
  shoulders: {
    light: { ink: "#9b4e13", tint: "#f9f1ea", edge: "#efdfd2", sub: "#8d5932", chart: "#a95617" },
    dark: { ink: "#dcac88", tint: "#4a3525", edge: "#58412f", sub: "#cda78b", chart: "#d2986c" },
  },
  triceps: {
    light: { ink: "#bd176a", tint: "#faeff5", edge: "#f1d9e5", sub: "#aa3c73", chart: "#ce1c75" },
    dark: { ink: "#e8b2cd", tint: "#4a2538", edge: "#66374f", sub: "#d091b0", chart: "#e19ec0" },
  },

  // ── pull: cool - azure, teal, indigo ────────────────────
  back: {
    light: { ink: "#1664b2", tint: "#ecf3f9", edge: "#d6e3f1", sub: "#36689a", chart: "#1a6ec1" },
    dark: { ink: "#88b1db", tint: "#25384a", edge: "#33485e", sub: "#8daece", chart: "#6c9fd2" },
  },
  biceps: {
    light: { ink: "#0d6a6d", tint: "#e2f6f7", edge: "#c3e9ea", sub: "#286f71", chart: "#107376" },
    dark: { ink: "#52c7cb", tint: "#204042", edge: "#294c4d", sub: "#6dbec1", chart: "#4cc4c8" },
  },
  forearms: {
    light: { ink: "#3a44d7", tint: "#f1f1fb", edge: "#d9daf1", sub: "#3d44ad", chart: "#444ed9" },
    dark: { ink: "#b2b6ec", tint: "#25274a", edge: "#393c69", sub: "#9498d1", chart: "#9ea3e8" },
  },

  // ── legs: green through olive ───────────────────────────
  quads: {
    light: { ink: "#107e13", tint: "#e4f7e5", edge: "#c7ebc8", sub: "#29732b", chart: "#138c17" },
    dark: { ink: "#52cb56", tint: "#214222", edge: "#2a4e2b", sub: "#72c274", chart: "#4cc850" },
  },
  hamstrings: {
    light: { ink: "#205e0c", tint: "#e7f7e2", edge: "#cdeac3", sub: "#3b7228", chart: "#24650e" },
    dark: { ink: "#85d36b", tint: "#284120", edge: "#324d29", sub: "#82c06d", chart: "#6bc84c" },
  },
  glutes: {
    light: { ink: "#0c6240", tint: "#e2f7ee", edge: "#c4eadb", sub: "#287254", chart: "#0e6a45" },
    dark: { ink: "#5bcea0", tint: "#204134", edge: "#294d3f", sub: "#6dc09f", chart: "#4cc896" },
  },
  calves: {
    light: { ink: "#506a0d", tint: "#eef5dd", edge: "#dbe7bb", sub: "#586c26", chart: "#577410" },
    dark: { ink: "#a9cb52", tint: "#363f1f", edge: "#404a28", sub: "#a2bc62", chart: "#a5c84c" },
  },

  // ── trunk ───────────────────────────────────────────────
  core: {
    light: { ink: "#9d21ca", tint: "#f7effa", edge: "#ebd9f1", sub: "#8f3dad", chart: "#ab26dc" },
    dark: { ink: "#d191e8", tint: "#40254a", edge: "#5c3869", sub: "#c092d0", chart: "#c674e4" },
  },

  // ── engine: the reserved signal gold ────────────────────
  cardio: {
    light: { ink: "#5b470b", tint: "#f7f2e3", edge: "#ebe1c5", sub: "#77632a", chart: "#634d0d" },
    dark: { ink: "#d8c27d", tint: "#433a21", edge: "#4f462a", sub: "#c3af74", chart: "#cdb15d" },
  },
};

/** The neutral used when a muscle is unknown, so nothing falls back to raw grey. */
export const NEUTRAL = {
  light: { ink: "#4a4a48", tint: "#f0efec", edge: "#dedcd7", sub: "#5c5b58", chart: "#57564f" },
  dark: { ink: "#c9c7c2", tint: "#262624", edge: "#3a3936", sub: "#b4b2ad", chart: "#bfbdB8" },
};

/** Parse "#rgb" or "#rrggbb" to 0-255 channels. Returns null on bad input. */
export function hexToRgb(hex) {
  if (typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** WCAG relative luminance of a hex colour, 0 (black) to 1 (white). */
export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/**
 * WCAG contrast ratio between two hex colours, 1 to 21.
 *
 * Returns 1 rather than throwing on bad input: a malformed value must never take
 * a render down, and 1 is the honest reading of "no contrast guaranteed".
 */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (!hexToRgb(a) || !hexToRgb(b)) return 1;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** True when the ratio clears the WCAG AA floor for body text. */
export function meetsAA(foreground, background) {
  return contrastRatio(foreground, background) >= 4.5;
}

/** True when it clears the lower floor for large text and graphic elements. */
export function meetsAALarge(foreground, background) {
  return contrastRatio(foreground, background) >= 3;
}

/**
 * Look up a muscle's palette.
 *
 * Accepts any casing and unknown values, because the dataset is generated and a
 * new muscle must degrade to the neutral rather than to `undefined` leaking into
 * a style attribute.
 */
export function muscleColour(muscle, theme = "light") {
  const key = typeof muscle === "string" ? muscle.trim().toLowerCase() : "";
  const entry = MUSCLE_COLOURS[key] ?? null;
  const mode = theme === "dark" ? "dark" : "light";
  return entry ? entry[mode] : NEUTRAL[mode];
}

/** The movement role for a muscle, or "other" when unknown. */
export function muscleRole(muscle) {
  const key = typeof muscle === "string" ? muscle.trim().toLowerCase() : "";
  return MUSCLE_ROLE[key] ?? "other";
}

/**
 * Inline custom properties for an element that should carry a muscle's colour.
 *
 * Returning a string rather than an object keeps views free of colour logic: a
 * badge writes `style="${muscleVars("back")}"` and the CSS does the rest with
 * var(--m-ink) / var(--m-tint) / var(--m-edge) / var(--m-sub).
 */
export function muscleVars(muscle, theme = "light") {
  const c = muscleColour(muscle, theme);
  return `--m-ink:${c.ink};--m-tint:${c.tint};--m-edge:${c.edge};--m-sub:${c.sub};--m-chart:${c.chart}`;
}

/**
 * A categorical series for charts, in a stable order.
 *
 * Deliberately NOT the twelve muscle hues. A chart with twelve near-hues is a
 * rainbow, which reads as decoration and cannot be told apart at bar width; the
 * craft floor bans rainbow charts for exactly that reason. Charts get five
 * well-separated hues and repeat with a pattern change beyond that, while muscle
 * colour stays a badge/label device.
 */
export const CHART_SERIES = {
  light: ["#ce2e1c", "#ce1c75", "#1a6ec1", "#0e6a45", "#577410"],
  dark: ["#d2766c", "#e19ec0", "#6c9fd2", "#4cc896", "#a5c84c"],
};

/** Pick a series colour by index, cycling. Always paired with a text label. */
export function chartColour(index, theme = "light") {
  const list = CHART_SERIES[theme === "dark" ? "dark" : "light"];
  const i = Number.isFinite(index) ? Math.abs(Math.trunc(index)) : 0;
  return list[i % list.length];
}

/**
 * Hue in degrees (0-360) of a hex colour, or 0 on bad input.
 *
 * Exported so tests can assert on hue directly. Discriminating "is this gold?" by
 * channel relationships is unreliable: an olive green satisfies r > b && g > b
 * just as a gold does, and only hue separates them.
 */
export function hueOf(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/** HSL saturation (0-1) of a hex colour, or 0 on bad input. */
export function saturationOf(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return 0;
  return d / (1 - Math.abs(2 * l - 1));
}

/**
 * True when a colour sits in the reserved gold band.
 *
 * Cardio owns hue 40-62 because gold is the app's one signal colour: it means
 * "this is not a lift". Nothing else may borrow it, or the signal stops meaning
 * anything. Saturation is part of the test so a desaturated olive at hue 50 does
 * not count as borrowing a signal it cannot actually send.
 */
export function isSignalGold(hex) {
  if (!hexToRgb(hex)) return false;
  const h = hueOf(hex);
  return h >= 40 && h <= 62 && saturationOf(hex) > 0.45;
}
