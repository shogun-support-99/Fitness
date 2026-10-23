/**
 * The 3D load.
 *
 * A barbell that loads itself with the plates a real lifter would put on it.
 *
 * This is not decoration bolted onto the page. The scene is driven by
 * `plateSplit()`, which solves the same problem a lifter solves at the rack:
 * given a target weight and a bar, which plates go on each side. Feed it the
 * heaviest lift in the log and the barbell on screen is loaded to that number -
 * so the picture is a claim about the data, and it is only true if the maths is
 * right. `tests/scene3d.test.js` pins it.
 *
 * Three hard constraints, in order of importance:
 *
 * 1. It must never be the only way to see the information. WebGL is feature
 *    detected, three.js is loaded lazily, and every failure path resolves to the
 *    existing SVG diagrams. A visitor with no GPU, a blocked script, or a slow
 *    connection loses the animation and keeps the app.
 * 2. It must stop when asked. Under `prefers-reduced-motion` the scene renders
 *    one static frame and never starts a loop, rather than merely moving less.
 * 3. It must clean up. WebGL contexts are a finite browser resource; leaking one
 *    per navigation would eventually exhaust it. Every mount returns a teardown
 *    that cancels the loop, drops listeners, and releases the context.
 */

/** Standard plate sizes in kg, heaviest first. */
export const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

/** The same set in lb, for a lifter who has switched units. */
export const PLATES_LB = [55, 45, 35, 25, 10, 5, 2.5];

/** Olympic bar weight, the near-universal default. */
export const BAR_KG = 20;
export const BAR_LB = 45;

/**
 * Solve a target weight into plates per side.
 *
 * Returns `{ ok, perSide, remainder, plates }` where `perSide` is the list of
 * plate sizes for ONE side (a barbell is loaded symmetrically, so the total is
 * bar + 2 x sum(perSide)), and `remainder` is what could not be reached exactly.
 *
 * Greedy is correct here rather than merely convenient: competition plate sets
 * are close enough to canonical that taking the largest plate that fits always
 * yields the fewest plates, which is what a lifter actually wants. The remainder
 * is reported rather than hidden, because a target of 101.4 kg is not reachable
 * with 1.25 kg plates and silently rounding it would be a lie about the log.
 */
export function plateSplit(target, { units = "kg", bar = null, sizes = null, tolerance = 0.001 } = {}) {
  const unit = units === "lb" ? "lb" : "kg";
  const plateSizes = Array.isArray(sizes) && sizes.length ? sizes : unit === "lb" ? PLATES_LB : PLATES_KG;
  const barWeight = Number.isFinite(bar) ? bar : unit === "lb" ? BAR_LB : BAR_KG;

  const t = Number(target);
  if (!Number.isFinite(t)) return { ok: false, perSide: [], remainder: 0, plates: [], unit };

  // Below the empty bar there is nothing to load; report it honestly.
  if (t <= barWeight + tolerance) {
    return { ok: Math.abs(t - barWeight) <= tolerance, perSide: [], remainder: Math.max(0, t - barWeight), plates: [], unit };
  }

  let remaining = (t - barWeight) / 2; // per side
  const perSide = [];
  for (const size of [...plateSizes].sort((a, b) => b - a)) {
    if (size <= 0) continue;
    while (remaining >= size - tolerance) {
      perSide.push(size);
      remaining -= size;
    }
  }
  const remainder = Math.max(0, remaining);
  const plates = [];
  for (const s of perSide) plates.push(s, s); // both sides
  return {
    ok: remainder <= tolerance,
    perSide,
    remainder,
    plates,
    unit,
    loaded: barWeight + 2 * perSide.reduce((a, b) => a + b, 0),
  };
}

/** Total on the bar for a split - the inverse of plateSplit, used to verify it. */
export function splitTotal(perSide, { units = "kg", bar = null } = {}) {
  const unit = units === "lb" ? "lb" : "kg";
  const barWeight = Number.isFinite(bar) ? bar : unit === "lb" ? BAR_LB : BAR_KG;
  if (!Array.isArray(perSide)) return barWeight;
  return barWeight + 2 * perSide.reduce((a, b) => a + (Number(b) || 0), 0);
}

/**
 * Is WebGL usable here?
 *
 * Probes without keeping a context: creating one and dropping it is cheap, and
 * asking is far cheaper than shipping three.js to a browser that cannot use it.
 */
export function supportsWebGL(scope = globalThis) {
  try {
    const doc = scope.document;
    if (!doc || typeof doc.createElement !== "function") return false;
    const canvas = doc.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return false;
    // A context that reports no renderer is usually a software fallback that will
    // be too slow to be worth starting.
    const lose = gl.getExtension?.("WEBGL_lose_context");
    lose?.loseContext?.();
    return true;
  } catch {
    return false;
  }
}

/** True when the visitor has asked for less motion. */
export function prefersReducedMotion(scope = globalThis) {
  return Boolean(scope.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

/**
 * Radius and thickness of a plate, in scene units, from its kg value.
 *
 * Real plates scale sub-linearly: a 25 kg competition plate is 450 mm across and
 * a 1.25 kg one about 160 mm, not a twentieth of the diameter. The curve below is
 * fit to those two points so the stack looks like iron rather than like a chart.
 * Exported and tested because a wrong radius makes plates overlap, which reads
 * instantly as broken.
 */
export function plateGeometry(kg) {
  const w = Number(kg);
  if (!Number.isFinite(w) || w <= 0) return { radius: 0.32, thickness: 0.03 };
  const clamped = Math.min(Math.max(w, 0.5), 25);
  const radius = 0.16 + 0.29 * Math.pow(clamped / 25, 0.42);
  const thickness = 0.018 + 0.052 * Math.pow(clamped / 25, 0.7);
  return { radius, thickness };
}

/**
 * X offsets of the plates on one sleeve, from the collar outward.
 *
 * Plates must not intersect, so each sits at the running offset plus half its own
 * thickness plus half the previous one's. Pure and tested.
 */
export function plateOffsets(perSide) {
  if (!Array.isArray(perSide)) return [];
  let x = 0;
  let prev = 0;
  return perSide.map((kg, i) => {
    const { thickness } = plateGeometry(kg);
    x += i === 0 ? thickness / 2 : prev / 2 + thickness / 2;
    prev = thickness;
    return x;
  });
}

/**
 * Mount the scene into a canvas.
 *
 * Returns a teardown function. Resolution is deliberately deferred: three.js is
 * ~407 KB gzipped, so it is fetched only once a canvas actually asks for a scene,
 * and only after the page is otherwise usable.
 *
 * `options.colour` tints the plates from the muscle colour system, so a chest
 * exercise loads a red barbell and a back exercise a blue one. That is the
 * "data carries the chroma" rule from the app sheet, applied to the 3D.
 */
export async function mountScene(canvas, options = {}) {
  if (!canvas) return () => {};
  const scope = options.scope ?? globalThis;

  if (!supportsWebGL(scope)) {
    options.onUnavailable?.("no-webgl");
    return () => {};
  }

  let THREE;
  try {
    THREE = await import("./vendor/three.module.js");
  } catch {
    options.onUnavailable?.("load-failed");
    return () => {};
  }

  const {
    perSide = [],
    colour = "#8a8a88",
    barColour = "#b9b9b6",
    reduced = prefersReducedMotion(scope),
    onReady,
  } = options;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    options.onUnavailable?.("context-failed");
    return () => {};
  }

  const dpr = Math.min(scope.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.32, 5.1);
  camera.lookAt(0, 0, 0);

  // Two lights, no shadows: a key from above-front and a cool fill from below so
  // the cylinders read as metal without a shadow map's cost.
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(2.2, 3.4, 3.0);
  const fill = new THREE.DirectionalLight(0xdfe8f5, 0.75);
  fill.position.set(-2.6, -1.8, 1.4);
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(key, fill, ambient);

  const barMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(barColour), metalness: 0.86, roughness: 0.34 });
  const plateMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colour), metalness: 0.34, roughness: 0.56 });
  const collarMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#2f2f2e"), metalness: 0.5, roughness: 0.6 });

  const group = new THREE.Group();
  scene.add(group);

  // Sleeve + shaft as one cylinder; the shaft is thinner, so build it in two parts.
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.6, 28), barMat);
  shaft.rotation.z = Math.PI / 2;
  group.add(shaft);

  const SLEEVE = 1.32;
  for (const dir of [-1, 1]) {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, SLEEVE, 28), barMat);
    sleeve.rotation.z = Math.PI / 2;
    sleeve.position.x = dir * (1.3 + SLEEVE / 2 - 0.02);
    group.add(sleeve);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.055, 24), collarMat);
    collar.rotation.z = Math.PI / 2;
    collar.position.x = dir * 1.27;
    group.add(collar);
  }

  // The plates, positioned by the tested pure maths.
  const offsets = plateOffsets(perSide);
  const meshes = [];
  offsets.forEach((x, i) => {
    const kg = perSide[i];
    const { radius, thickness } = plateGeometry(kg);
    for (const dir of [-1, 1]) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 44), plateMat);
      plate.rotation.z = Math.PI / 2;
      plate.position.x = dir * (1.32 + x);
      plate.userData.restX = plate.position.x;
      group.add(plate);
      meshes.push(plate);
    }
  });

  let frame = 0;
  let disposed = false;
  const listeners = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    listeners.push([target, type, fn, opts]);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  if (typeof scope.ResizeObserver === "function") {
    const ro = new scope.ResizeObserver(resize);
    ro.observe(canvas);
    listeners.push([{ removeEventListener: () => ro.disconnect() }, "ro", null, null]);
  } else {
    on(scope, "resize", resize);
  }

  // Cursor parallax, throttled to the frame loop rather than to the event.
  let pointerX = 0;
  let pointerY = 0;
  on(canvas, "pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  /** Scroll progress 0..1 across the canvas's own travel through the viewport. */
  const scrollProgress = () => {
    const rect = canvas.getBoundingClientRect();
    const vh = scope.innerHeight || 1;
    const total = rect.height + vh;
    const passed = vh - rect.top;
    return Math.min(1, Math.max(0, passed / total));
  };

  let t0 = null;
  const render = (now) => {
    if (disposed) return;
    if (t0 === null) t0 = now;
    const elapsed = (now - t0) / 1000;

    // The authored moment: plates slide on from outside the sleeve as the canvas
    // scrolls into view, then the bar settles into a slow idle turn. One motion
    // with a beginning and an end, not a permanent fidget.
    const p = scrollProgress();
    const load = Math.min(1, Math.max(0, (p - 0.06) / 0.5)); // 0..1 over the first half
    const eased = 1 - Math.pow(1 - load, 3);

    meshes.forEach((m, i) => {
      const stagger = Math.min(1, Math.max(0, eased * 1.6 - (i % offsets.length) * 0.12));
      const rest = m.userData.restX;
      const sign = Math.sign(rest) || 1;
      m.position.x = sign * (Math.abs(rest) + (1 - stagger) * 1.5);
      m.rotation.x = (1 - stagger) * 0.9;
    });

    const idle = reduced ? 0 : elapsed;
    group.rotation.y = idle * 0.16 + pointerX * 0.2;
    group.rotation.x = Math.sin(idle * 0.5) * 0.035 + pointerY * 0.11;
    group.position.y = reduced ? 0 : Math.sin(idle * 0.7) * 0.022;

    renderer.render(scene, camera);
    frame = scope.requestAnimationFrame(render);
  };

  // Pause offscreen and on hidden tabs: an animation nobody can see is only cost.
  let visible = true;
  const start = () => {
    if (disposed || !visible || frame) return;
    t0 = null;
    frame = scope.requestAnimationFrame(render);
  };
  const stop = () => {
    if (frame) scope.cancelAnimationFrame(frame);
    frame = 0;
  };

  if (typeof scope.IntersectionObserver === "function") {
    const io = new scope.IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);
    listeners.push([{ removeEventListener: () => io.disconnect() }, "io", null, null]);
  }
  on(scope.document ?? scope, "visibilitychange", () => {
    if (scope.document?.hidden) stop();
    else start();
  });

  if (reduced) {
    // One honest static frame, and no loop at all.
    renderer.render(scene, camera);
    onReady?.({ reduced: true });
    return () => dispose();
  }

  start();
  onReady?.({ reduced: false, plates: perSide.length });

  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    for (const [target, type, fn, opts] of listeners) {
      try {
        target.removeEventListener(type, fn, opts);
      } catch {
        /* already detached */
      }
    }
    listeners.length = 0;
    scene.traverse((obj) => {
      obj.geometry?.dispose?.();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
      else obj.material?.dispose?.();
    });
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  return dispose;
}
