import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  PLATES_KG,
  PLATES_LB,
  BAR_KG,
  BAR_LB,
  plateSplit,
  splitTotal,
  plateGeometry,
  plateOffsets,
  supportsWebGL,
  prefersReducedMotion,
} from "../app/js/scene3d.js";

describe("plate sets", () => {
  test("kg plates are the standard competition set, heaviest first", () => {
    assert.deepEqual(PLATES_KG, [25, 20, 15, 10, 5, 2.5, 1.25]);
  });

  test("lb plates are the standard set, heaviest first", () => {
    assert.deepEqual(PLATES_LB, [55, 45, 35, 25, 10, 5, 2.5]);
  });

  test("bars are the near-universal olympic weights", () => {
    assert.equal(BAR_KG, 20);
    assert.equal(BAR_LB, 45);
  });
});

describe("plateSplit", () => {
  test("loads a round target exactly", () => {
    const r = plateSplit(100);
    assert.deepEqual(r.perSide, [25, 15]);
    assert.equal(r.loaded, 100);
    assert.equal(r.ok, true);
    assert.equal(r.remainder, 0);
    assert.equal(r.unit, "kg");
  });

  test("mirrors every plate onto both sides", () => {
    // A barbell is loaded symmetrically; plates is the full set, perSide one side.
    const r = plateSplit(85);
    assert.deepEqual(r.perSide, [25, 5, 2.5]);
    assert.deepEqual(r.plates, [25, 25, 5, 5, 2.5, 2.5]);
    assert.equal(r.plates.length, r.perSide.length * 2);
  });

  test("uses the fewest plates, heaviest first", () => {
    // 60 kg could be 20+10+... per side but one 20 per side is correct.
    assert.deepEqual(plateSplit(60).perSide, [20]);
    assert.deepEqual(plateSplit(140).perSide, [25, 25, 10]);
  });

  test("reaches half-plate and quarter-plate targets", () => {
    assert.deepEqual(plateSplit(22.5).perSide, [1.25]);
    assert.equal(plateSplit(22.5).ok, true);
    assert.deepEqual(plateSplit(25).perSide, [2.5]);
  });

  test("reports an unreachable target honestly instead of rounding it silently", () => {
    // 101.4 cannot be built from 1.25 kg plates. Claiming it loaded would be a lie
    // about the log, so ok is false and the shortfall is reported.
    const r = plateSplit(101.4);
    assert.equal(r.ok, false);
    assert.equal(r.loaded, 100);
    assert.ok(Math.abs(r.remainder - 0.7) < 1e-9);
  });

  test("an empty bar loads nothing and reports ok", () => {
    const r = plateSplit(20);
    assert.deepEqual(r.perSide, []);
    assert.equal(r.ok, true);
  });

  test("below the empty bar cannot be loaded", () => {
    assert.equal(plateSplit(18.5).ok, false);
    assert.deepEqual(plateSplit(18.5).perSide, []);
    assert.equal(plateSplit(0).ok, false);
    assert.equal(plateSplit(-5).ok, false);
  });

  test("handles non-finite input without throwing", () => {
    // A numeric string is deliberately accepted: weights arrive from JSON and
    // localStorage, where "100" is a plausible shape. Only genuinely non-finite
    // values are rejected.
    for (const bad of [NaN, Infinity, -Infinity, null, undefined, {}, [], "abc"]) {
      const r = plateSplit(bad);
      assert.equal(r.ok, false, `expected ${String(bad)} to be rejected`);
      assert.deepEqual(r.perSide, []);
      assert.equal(typeof r.remainder, "number");
    }
  });

  test("honours lb units with the lb plate set and bar", () => {
    const r = plateSplit(135, { units: "lb" });
    assert.deepEqual(r.perSide, [45]);
    assert.equal(r.loaded, 135);
    assert.equal(r.unit, "lb");
    assert.equal(r.ok, true);
  });

  test("lb uses the lb bar, not the kg one", () => {
    assert.deepEqual(plateSplit(45, { units: "lb" }).perSide, []);
    assert.equal(plateSplit(45, { units: "lb" }).ok, true);
  });

  test("accepts a custom bar and plate set", () => {
    const r = plateSplit(50, { bar: 10, sizes: [10, 5] });
    // (50 - 10) / 2 = 20 per side, and 20 is two 10s.
    assert.deepEqual(r.perSide, [10, 10]);
    assert.equal(r.loaded, 50);
    assert.equal(r.ok, true);
  });

  test("an unknown unit reads as kg rather than failing", () => {
    assert.deepEqual(plateSplit(100, { units: "stone" }).perSide, plateSplit(100).perSide);
  });

  test("never produces a negative or fractional plate count", () => {
    for (let t = 20; t <= 250; t += 1.25) {
      const r = plateSplit(t);
      for (const p of r.perSide) {
        assert.ok(PLATES_KG.includes(p), `${p} is not a real plate (target ${t})`);
      }
    }
  });
});

describe("splitTotal", () => {
  test("is the inverse of plateSplit for every reachable target", () => {
    // Reachable means 20 + 2.5k: the smallest plate is 1.25 and it goes on both
    // sides, so the step is 2.5. A target like 21.25 cannot be built at all, and
    // plateSplit says so via ok=false rather than pretending.
    let reachable = 0;
    for (let t = 20; t <= 220; t += 1.25) {
      const r = plateSplit(t);
      if (!r.ok) {
        assert.equal(Math.abs(r.remainder) > 0 || t === 20, true, `${t} rejected without a reason`);
        continue;
      }
      reachable++;
      assert.ok(Math.abs(splitTotal(r.perSide) - t) < 1e-9, `round trip failed at ${t}`);
    }
    assert.ok(reachable > 70, `only ${reachable} reachable targets sampled`);
  });

  test("targets between plate increments are reported unreachable, not fudged", () => {
    const r = plateSplit(21.25);
    assert.equal(r.ok, false);
    assert.deepEqual(r.perSide, []);
    assert.ok(r.remainder > 0, "the shortfall must be reported");
    assert.equal(splitTotal(r.perSide), BAR_KG, "nothing was loaded but the bar");
  });

  test("an empty bar totals the bar", () => {
    assert.equal(splitTotal([]), BAR_KG);
    assert.equal(splitTotal([], { units: "lb" }), BAR_LB);
  });

  test("handles malformed input", () => {
    assert.equal(splitTotal(null), BAR_KG);
    assert.equal(splitTotal(undefined), BAR_KG);
    assert.equal(splitTotal([10, "x", null]), BAR_KG + 20);
  });
});

describe("plateGeometry", () => {
  test("a heavier plate is always wider", () => {
    let prev = 0;
    for (const kg of [...PLATES_KG].reverse()) {
      const { radius } = plateGeometry(kg);
      assert.ok(radius > prev, `${kg} kg is not wider than the plate below it`);
      prev = radius;
    }
  });

  test("a heavier plate is always thicker", () => {
    let prev = 0;
    for (const kg of [...PLATES_KG].reverse()) {
      const { thickness } = plateGeometry(kg);
      assert.ok(thickness > prev, `${kg} kg is not thicker`);
      prev = thickness;
    }
  });

  test("scales sub-linearly, like real iron", () => {
    // A 1.25 kg plate is not a twentieth of a 25 kg plate's diameter.
    const big = plateGeometry(25).radius;
    const small = plateGeometry(1.25).radius;
    assert.ok(small / big > 0.3, "small plate collapsed to nothing");
    assert.ok(small / big < 0.75, "small plate is not sub-linear");
  });

  test("clamps absurd weights instead of producing absurd geometry", () => {
    const huge = plateGeometry(10000);
    const max = plateGeometry(25);
    assert.equal(huge.radius, max.radius);
    const tiny = plateGeometry(0.001);
    const min = plateGeometry(0.5);
    assert.equal(tiny.radius, min.radius);
  });

  test("bad input returns a usable default rather than NaN", () => {
    for (const bad of [-1, 0, NaN, "x", null, undefined]) {
      const g = plateGeometry(bad);
      assert.ok(Number.isFinite(g.radius) && g.radius > 0, `${String(bad)} gave ${g.radius}`);
      assert.ok(Number.isFinite(g.thickness) && g.thickness > 0);
    }
  });
});

describe("plateOffsets", () => {
  test("plates never intersect", () => {
    // The failure mode that reads instantly as broken: two cylinders occupying the
    // same space. Each gap must be at least the two half-thicknesses.
    for (const target of [60, 85, 100, 140, 180, 220, 25, 22.5]) {
      const perSide = plateSplit(target).perSide;
      const off = plateOffsets(perSide);
      for (let i = 1; i < off.length; i++) {
        const a = plateGeometry(perSide[i - 1]).thickness;
        const b = plateGeometry(perSide[i]).thickness;
        assert.ok(
          off[i] - off[i - 1] >= (a + b) / 2 - 1e-9,
          `${perSide[i - 1]} and ${perSide[i]} overlap at target ${target}`,
        );
      }
    }
  });

  test("offsets increase outward from the collar", () => {
    const off = plateOffsets(plateSplit(180).perSide);
    assert.ok(off.every((v, i) => i === 0 || v > off[i - 1]), "offsets must be strictly increasing");
    assert.ok(off[0] > 0, "the first plate must clear the collar");
  });

  test("an empty side has no offsets", () => {
    assert.deepEqual(plateOffsets([]), []);
    assert.deepEqual(plateOffsets(plateSplit(20).perSide), []);
  });

  test("handles malformed input", () => {
    assert.deepEqual(plateOffsets(null), []);
    assert.deepEqual(plateOffsets(undefined), []);
    assert.deepEqual(plateOffsets("nope"), []);
  });

  test("the whole stack fits inside a real sleeve", () => {
    // A 220 kg load must not run off the end of the sleeve in the scene.
    const off = plateOffsets(plateSplit(220).perSide);
    const last = off[off.length - 1] + plateGeometry(25).thickness / 2;
    assert.ok(last < 1.1, `stack reaches ${last.toFixed(3)} scene units, past the sleeve`);
  });
});

describe("capability probes", () => {
  test("supportsWebGL is false without a DOM rather than throwing", () => {
    assert.equal(supportsWebGL({}), false);
    assert.equal(supportsWebGL({ document: null }), false);
    assert.equal(supportsWebGL({ document: {} }), false);
  });

  test("supportsWebGL is false when the context cannot be created", () => {
    const fakeDoc = { createElement: () => ({ getContext: () => null }) };
    assert.equal(supportsWebGL({ document: fakeDoc }), false);
  });

  test("supportsWebGL is true for a usable context and releases it", () => {
    let lost = false;
    const gl = { getExtension: (n) => (n === "WEBGL_lose_context" ? { loseContext: () => { lost = true; } } : null) };
    const fakeDoc = { createElement: () => ({ getContext: (kind) => (kind === "webgl2" ? gl : null) }) };
    assert.equal(supportsWebGL({ document: fakeDoc }), true);
    assert.equal(lost, true, "the probe must not keep a context alive");
  });

  test("supportsWebGL survives a throwing getContext", () => {
    const fakeDoc = {
      createElement: () => ({
        getContext: () => {
          throw new Error("blocked");
        },
      }),
    };
    assert.equal(supportsWebGL({ document: fakeDoc }), false);
  });

  test("prefersReducedMotion is false without matchMedia", () => {
    assert.equal(prefersReducedMotion({}), false);
  });

  test("prefersReducedMotion reads the media query", () => {
    assert.equal(prefersReducedMotion({ matchMedia: () => ({ matches: true }) }), true);
    assert.equal(prefersReducedMotion({ matchMedia: () => ({ matches: false }) }), false);
  });
});
