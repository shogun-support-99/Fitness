import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  MUSCLES,
  MUSCLE_ROLE,
  MUSCLE_COLOURS,
  NEUTRAL,
  CHART_SERIES,
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  meetsAA,
  meetsAALarge,
  muscleColour,
  muscleRole,
  muscleVars,
  chartColour,
  hueOf,
  saturationOf,
  isSignalGold,
} from "../app/js/colour.js";

// The grounds each theme actually ships. If a token changes, these must too, or
// the contrast assertions below quietly stop describing the real UI.
const LIGHT_GROUND = "#ffffff";
const DARK_GROUND = "#171717";

describe("hexToRgb", () => {
  test("parses 6-digit hex", () => {
    assert.deepEqual(hexToRgb("#155e8c"), { r: 0x15, g: 0x5e, b: 0x8c });
  });

  test("parses 3-digit shorthand by doubling each channel", () => {
    assert.deepEqual(hexToRgb("#abc"), { r: 0xaa, g: 0xbb, b: 0xcc });
  });

  test("tolerates a missing hash and surrounding space", () => {
    assert.deepEqual(hexToRgb(" 155e8c "), { r: 0x15, g: 0x5e, b: 0x8c });
  });

  test("returns null rather than throwing on bad input", () => {
    assert.equal(hexToRgb("nope"), null);
    assert.equal(hexToRgb("#12345"), null);
    assert.equal(hexToRgb(""), null);
    assert.equal(hexToRgb(null), null);
    assert.equal(hexToRgb(undefined), null);
    assert.equal(hexToRgb(0x155e8c), null);
  });
});

describe("relativeLuminance", () => {
  test("black is 0 and white is 1", () => {
    assert.equal(relativeLuminance("#000000"), 0);
    assert.equal(relativeLuminance("#ffffff"), 1);
  });

  test("mid grey sits near the WCAG reference value", () => {
    // #808080 is the canonical ~0.2159 example.
    assert.ok(Math.abs(relativeLuminance("#808080") - 0.21586) < 0.001);
  });

  test("weights green above red above blue", () => {
    assert.ok(relativeLuminance("#00ff00") > relativeLuminance("#ff0000"));
    assert.ok(relativeLuminance("#ff0000") > relativeLuminance("#0000ff"));
  });

  test("bad input yields 0 rather than NaN", () => {
    assert.equal(relativeLuminance("junk"), 0);
  });
});

describe("contrastRatio", () => {
  test("white on black is the maximum 21", () => {
    assert.equal(Math.round(contrastRatio("#ffffff", "#000000")), 21);
  });

  test("a colour against itself is 1", () => {
    assert.equal(contrastRatio("#155e8c", "#155e8c"), 1);
  });

  test("order of arguments does not matter", () => {
    assert.equal(contrastRatio("#fff", "#000"), contrastRatio("#000", "#fff"));
  });

  test("bad input degrades to 1 instead of throwing", () => {
    assert.equal(contrastRatio("junk", "#fff"), 1);
    assert.equal(contrastRatio("#fff", null), 1);
  });

  test("meetsAA and meetsAALarge agree with the ratio", () => {
    assert.equal(meetsAA("#767676", "#ffffff"), true); // 4.54:1, the classic floor
    assert.equal(meetsAA("#777777", "#ffffff"), false); // 4.48:1
    assert.equal(meetsAALarge("#949494", "#ffffff"), true); // 3.03:1
    assert.equal(meetsAALarge("#959595", "#ffffff"), false);
  });
});

describe("the muscle set", () => {
  test("covers exactly the twelve values both catalogues use", () => {
    // Closed set, verified against app/data/exercises-index.json and the curated
    // list. A thirteenth would mean the data changed and the palette must follow.
    assert.equal(MUSCLES.length, 12);
    assert.deepEqual(
      [...MUSCLES].sort(),
      [
        "back", "biceps", "calves", "cardio", "chest", "core", "forearms",
        "glutes", "hamstrings", "quads", "shoulders", "triceps",
      ],
    );
  });

  test("every muscle has a palette in both themes", () => {
    for (const m of MUSCLES) {
      assert.ok(MUSCLE_COLOURS[m], `${m} missing`);
      for (const mode of ["light", "dark"]) {
        for (const key of ["ink", "tint", "edge", "sub", "chart"]) {
          assert.match(MUSCLE_COLOURS[m][mode][key], /^#[0-9a-f]{6}$/i, `${m}.${mode}.${key}`);
        }
      }
    }
  });

  test("every muscle has a movement role", () => {
    for (const m of MUSCLES) assert.ok(MUSCLE_ROLE[m], `${m} has no role`);
  });

  test("roles group muscles by movement, not arbitrarily", () => {
    // The palette teaches: hue family means movement role. If a push muscle were
    // recoloured cool, the coding would stop meaning anything.
    const byRole = {};
    for (const m of MUSCLES) (byRole[MUSCLE_ROLE[m]] ??= []).push(m);
    assert.deepEqual(byRole.push.sort(), ["chest", "shoulders", "triceps"]);
    assert.deepEqual(byRole.pull.sort(), ["back", "biceps", "forearms"]);
    assert.deepEqual(byRole.legs.sort(), ["calves", "glutes", "hamstrings", "quads"]);
    assert.deepEqual(byRole.trunk, ["core"]);
    assert.deepEqual(byRole.engine, ["cardio"]);
  });

  test("push hues are warm and pull hues are cool", () => {
    // Red channel dominates on push, blue on pull. This is what makes the coding
    // legible without a legend.
    const warm = (hex) => {
      const { r, b } = hexToRgb(hex);
      return r > b;
    };
    for (const m of ["chest", "shoulders", "triceps"]) {
      assert.ok(warm(MUSCLE_COLOURS[m].light.ink), `${m} should be warm`);
    }
    for (const m of ["back", "biceps", "forearms"]) {
      assert.ok(!warm(MUSCLE_COLOURS[m].light.ink), `${m} should be cool`);
    }
  });

  test("cardio is the only gold - the reserved signal hue", () => {
    // Discriminated by HUE, not by a channel heuristic. A heuristic like
    // "r > b && g > b" calls an olive green yellow, which wrongly flagged calves
    // (hue 77) as borrowing the signal. The reserved band is gold proper: hue
    // 40-62 with enough saturation to actually read as gold.
    assert.ok(isSignalGold(MUSCLE_COLOURS.cardio.light.ink), "cardio must read gold");
    assert.ok(isSignalGold(MUSCLE_COLOURS.cardio.light.chart), "cardio chart must read gold too");
    for (const m of MUSCLES) {
      if (m === "cardio") continue;
      assert.ok(!isSignalGold(MUSCLE_COLOURS[m].light.ink), `${m} borrows the signal hue`);
      assert.ok(!isSignalGold(MUSCLE_COLOURS[m].light.chart), `${m} chart borrows the signal hue`);
    }
  });

  test("the reserved band is not accidentally empty", () => {
    // Guards the guard: if isSignalGold were broken so nothing matched, the test
    // above would pass vacuously.
    assert.ok(isSignalGold("#8a7000"), "a plain gold must be detected");
    assert.ok(!isSignalGold("#1664b2"), "a blue must not be detected");
    assert.ok(!isSignalGold("#506a0d"), "an olive must not be detected");
  });
});

describe("contrast: the craft floor holds for every muscle", () => {
  test("light ink clears 4.5:1 on the white sheet", () => {
    for (const m of MUSCLES) {
      const ratio = contrastRatio(MUSCLE_COLOURS[m].light.ink, LIGHT_GROUND);
      assert.ok(ratio >= 4.5, `${m} light ink ${ratio.toFixed(2)}:1`);
    }
  });

  test("light ink clears 4.5:1 on its own tint", () => {
    // A badge sets its label on the tint, so this pairing is the common one.
    for (const m of MUSCLES) {
      const { ink, tint } = MUSCLE_COLOURS[m].light;
      const ratio = contrastRatio(ink, tint);
      assert.ok(ratio >= 4.5, `${m} ink on tint ${ratio.toFixed(2)}:1`);
    }
  });

  test("secondary text on a tint is tinted from the hue and still clears 4.5:1", () => {
    // "On colored surfaces tint secondary text from that hue; never gray."
    for (const m of MUSCLES) {
      const { sub, tint, ink } = MUSCLE_COLOURS[m].light;
      assert.ok(contrastRatio(sub, tint) >= 4.5, `${m} sub on tint`);
      const grey = hexToRgb(sub);
      const spread = Math.max(grey.r, grey.g, grey.b) - Math.min(grey.r, grey.g, grey.b);
      assert.ok(spread > 12, `${m} sub is grey (channel spread ${spread})`);
      assert.notEqual(sub, ink, `${m} sub should differ from ink`);
    }
  });

  test("dark ink clears 4.5:1 on the dark sheet", () => {
    for (const m of MUSCLES) {
      const ratio = contrastRatio(MUSCLE_COLOURS[m].dark.ink, DARK_GROUND);
      assert.ok(ratio >= 4.5, `${m} dark ink ${ratio.toFixed(2)}:1`);
    }
  });

  test("dark ink clears 4.5:1 on its own tint", () => {
    for (const m of MUSCLES) {
      const { ink, tint } = MUSCLE_COLOURS[m].dark;
      assert.ok(contrastRatio(ink, tint) >= 4.5, `${m} dark ink on tint`);
    }
  });

  test("chart hues clear 3:1 as graphic elements in both themes", () => {
    for (const m of MUSCLES) {
      assert.ok(
        contrastRatio(MUSCLE_COLOURS[m].light.chart, LIGHT_GROUND) >= 3,
        `${m} light chart`,
      );
      assert.ok(
        contrastRatio(MUSCLE_COLOURS[m].dark.chart, DARK_GROUND) >= 3,
        `${m} dark chart`,
      );
    }
  });

  test("an edge is visible against its tint but never louder than the ink", () => {
    for (const m of MUSCLES) {
      for (const mode of ["light", "dark"]) {
        const { edge, tint, ink } = MUSCLE_COLOURS[m][mode];
        const ground = mode === "light" ? LIGHT_GROUND : DARK_GROUND;
        assert.ok(contrastRatio(edge, tint) >= 1.1, `${m} ${mode} edge invisible`);
        assert.ok(
          contrastRatio(edge, ground) < contrastRatio(ink, ground),
          `${m} ${mode} edge louder than ink`,
        );
      }
    }
  });

  test("the neutral fallback also clears 4.5:1 in both themes", () => {
    assert.ok(contrastRatio(NEUTRAL.light.ink, LIGHT_GROUND) >= 4.5);
    assert.ok(contrastRatio(NEUTRAL.light.ink, NEUTRAL.light.tint) >= 4.5);
    assert.ok(contrastRatio(NEUTRAL.light.sub, NEUTRAL.light.tint) >= 4.5);
    assert.ok(contrastRatio(NEUTRAL.dark.ink, DARK_GROUND) >= 4.5);
    assert.ok(contrastRatio(NEUTRAL.dark.ink, NEUTRAL.dark.tint) >= 4.5);
    assert.ok(contrastRatio(NEUTRAL.dark.sub, NEUTRAL.dark.tint) >= 4.5);
  });
});

describe("hue separability", () => {
  test("the twelve light inks are not near-duplicates of one another", () => {
    // Two muscles a reader cannot tell apart would make the coding worse than no
    // coding. Require a real luminance or channel gap between every pair.
    const inks = MUSCLES.map((m) => MUSCLE_COLOURS[m].light.ink);
    for (let i = 0; i < inks.length; i++) {
      for (let j = i + 1; j < inks.length; j++) {
        const a = hexToRgb(inks[i]);
        const b = hexToRgb(inks[j]);
        const channelGap =
          Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
        const lumGap = Math.abs(relativeLuminance(inks[i]) - relativeLuminance(inks[j]));
        assert.ok(
          channelGap > 40 || lumGap > 0.03,
          `${MUSCLES[i]} and ${MUSCLES[j]} are indistinguishable`,
        );
      }
    }
  });

  test("the twelve tints stay pale enough to sit behind text", () => {
    for (const m of MUSCLES) {
      assert.ok(relativeLuminance(MUSCLE_COLOURS[m].light.tint) > 0.6, `${m} light tint too dark`);
      assert.ok(relativeLuminance(MUSCLE_COLOURS[m].dark.tint) < 0.12, `${m} dark tint too light`);
    }
  });
});

describe("muscleColour lookup", () => {
  test("is case and whitespace insensitive", () => {
    assert.deepEqual(muscleColour("Back"), MUSCLE_COLOURS.back.light);
    assert.deepEqual(muscleColour("  CHEST "), MUSCLE_COLOURS.chest.light);
  });

  test("honours the theme argument", () => {
    assert.deepEqual(muscleColour("back", "dark"), MUSCLE_COLOURS.back.dark);
    assert.deepEqual(muscleColour("back", "light"), MUSCLE_COLOURS.back.light);
  });

  test("falls back to the neutral for unknown, missing or malformed muscles", () => {
    // The dataset is generated; a new muscle must degrade gracefully rather than
    // leak "undefined" into a style attribute.
    assert.deepEqual(muscleColour("trapezius"), NEUTRAL.light);
    assert.deepEqual(muscleColour("trapezius", "dark"), NEUTRAL.dark);
    assert.deepEqual(muscleColour(undefined), NEUTRAL.light);
    assert.deepEqual(muscleColour(null), NEUTRAL.light);
    assert.deepEqual(muscleColour(42), NEUTRAL.light);
    assert.deepEqual(muscleColour(""), NEUTRAL.light);
  });

  test("an unknown theme reads as light rather than returning undefined", () => {
    assert.deepEqual(muscleColour("back", "solarised"), MUSCLE_COLOURS.back.light);
  });
});

describe("muscleRole", () => {
  test("maps known muscles and defaults to other", () => {
    assert.equal(muscleRole("chest"), "push");
    assert.equal(muscleRole("back"), "pull");
    assert.equal(muscleRole("quads"), "legs");
    assert.equal(muscleRole("core"), "trunk");
    assert.equal(muscleRole("cardio"), "engine");
    assert.equal(muscleRole("trapezius"), "other");
    assert.equal(muscleRole(null), "other");
  });

  test("is case insensitive like muscleColour", () => {
    assert.equal(muscleRole(" Chest "), "push");
  });
});

describe("muscleVars", () => {
  test("emits all five custom properties the CSS consumes", () => {
    const vars = muscleVars("back");
    for (const name of ["--m-ink", "--m-tint", "--m-edge", "--m-sub", "--m-chart"]) {
      assert.ok(vars.includes(`${name}:`), `missing ${name}`);
    }
  });

  test("carries the actual palette values", () => {
    assert.ok(muscleVars("chest").includes(MUSCLE_COLOURS.chest.light.ink));
    assert.ok(muscleVars("chest", "dark").includes(MUSCLE_COLOURS.chest.dark.ink));
  });

  test("is safe to interpolate into a style attribute", () => {
    const vars = muscleVars("back");
    assert.ok(!vars.includes('"'), "a double quote would break the attribute");
    assert.ok(!vars.includes("<"), "markup would break out of the attribute");
  });

  test("falls back cleanly for an unknown muscle", () => {
    assert.ok(muscleVars("trapezius").includes(NEUTRAL.light.ink));
  });
});

describe("chart series", () => {
  test("is five hues, not twelve - a twelve-hue chart is a rainbow", () => {
    assert.equal(CHART_SERIES.light.length, 5);
    assert.equal(CHART_SERIES.dark.length, 5);
  });

  test("cycles by index without going out of range", () => {
    assert.equal(chartColour(0), CHART_SERIES.light[0]);
    assert.equal(chartColour(5), CHART_SERIES.light[0]);
    assert.equal(chartColour(7), CHART_SERIES.light[2]);
  });

  test("handles negative, fractional and missing indices", () => {
    assert.equal(chartColour(-3), CHART_SERIES.light[3], "negative indices are made positive");
    assert.equal(chartColour(1.9), CHART_SERIES.light[1]);
    assert.equal(chartColour(undefined), CHART_SERIES.light[0]);
    assert.equal(chartColour("nope"), CHART_SERIES.light[0]);
  });

  test("honours the dark theme", () => {
    assert.equal(chartColour(0, "dark"), CHART_SERIES.dark[0]);
  });

  test("every series hue is distinct from its neighbours", () => {
    for (const mode of ["light", "dark"]) {
      const list = CHART_SERIES[mode];
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = hexToRgb(list[i]);
          const b = hexToRgb(list[j]);
          const gap = Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
          assert.ok(gap > 60, `${mode} series ${i} and ${j} too close`);
        }
      }
    }
  });
});
