/**
 * IronLog — landing composition and motion.
 *
 * No animation dependency and no intercepted scrolling. Two sticky product
 * scenes read native scroll position in one requestAnimationFrame pass. All
 * content is readable before this module runs; reduced motion keeps the
 * finished, stacked compositions.
 */

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const hero = document.querySelector(".hero-scene");
const showcase = document.querySelector(".showcase-scene");
const scenes = [hero, showcase].filter(Boolean);
let frameRequest = 0;
let scenesLive = false;
let showcaseMetrics = { restX: 80, restY: 70, recordX: 50, recordY: 92 };

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value) => 1 - Math.pow(1 - clamp(value), 3);
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);

function canHoldScenes() {
  return !motionQuery.matches && window.innerHeight >= 620;
}

function measureShowcase() {
  if (!showcase) return;
  const ui = showcase.querySelector(".showcase-ui");
  const rest = showcase.querySelector(".session-rest strong");
  const record = showcase.querySelector(".session-record strong");
  if (!ui || !rest || !record) return;
  const uiRect = ui.getBoundingClientRect();
  const restRect = rest.getBoundingClientRect();
  const recordRect = record.getBoundingClientRect();
  if (uiRect.height === 0) return;
  showcaseMetrics = {
    restX: ((restRect.left + restRect.width / 2 - uiRect.left) / uiRect.width) * 100,
    restY: ((restRect.top + restRect.height / 2 - uiRect.top) / uiRect.height) * 100,
    recordX: ((recordRect.left + recordRect.width / 2 - uiRect.left) / uiRect.width) * 100,
    recordY: ((recordRect.top + recordRect.height / 2 - uiRect.top) / uiRect.height) * 100,
  };
}

function setSceneMode() {
  scenesLive = canHoldScenes();
  for (const scene of scenes) {
    scene.classList.toggle("is-live", scenesLive);
    scene.classList.toggle("is-rest", !scenesLive);
  }

  const frames = [...document.querySelectorAll("[data-hero-frame]")];
  for (const frame of frames) {
    if (scenesLive) {
      const active = Number(frame.dataset.heroFrame) === 0;
      frame.inert = !active;
      frame.setAttribute("aria-hidden", String(!active));
      frame.classList.toggle("is-active", active);
    } else {
      frame.inert = false;
      frame.removeAttribute("aria-hidden");
      frame.classList.add("is-active");
    }
  }

  if (!scenesLive) {
    hero?.style.removeProperty("--reel-y");
    showcase?.style.removeProperty("--showcase-scale");
    showcase?.style.removeProperty("--showcase-origin");
    showcase?.style.removeProperty("--showcase-bottom-o");
    showcase?.style.removeProperty("--showcase-bottom-y");
    showcase?.style.removeProperty("--showcase-caption-o");
    showcase?.style.removeProperty("--showcase-caption-y");
  }
  measureShowcase();
  queueSceneUpdate();
}

function sceneProgress(scene) {
  const rect = scene.getBoundingClientRect();
  const hold = Math.max(1, rect.height - window.innerHeight);
  return clamp(-rect.top / hold);
}

function updateHero() {
  if (!hero) return;
  const progress = sceneProgress(hero);
  const viewport = hero.querySelector("[data-hero-viewport]");
  if (!viewport) return;

  const step = viewport.getBoundingClientRect().height + 24;
  const position = progress * 2;
  hero.style.setProperty("--reel-y", `${(-position * step).toFixed(2)}px`);
  hero.style.setProperty("--p", progress.toFixed(4));

  const activeIndex = Math.round(position);
  hero.dataset.beat = String(activeIndex);
  for (const frame of hero.querySelectorAll("[data-hero-frame]")) {
    const active = Number(frame.dataset.heroFrame) === activeIndex;
    frame.inert = !active;
    frame.setAttribute("aria-hidden", String(!active));
    frame.classList.toggle("is-active", active);
  }
}

function updateShowcase() {
  if (!showcase) return;
  const progress = sceneProgress(showcase);
  let scale;
  let originX;
  let originY;
  // Transform-origin is solved from the timer/value we want centred at each
  // end scale, on both axes. This stays correct when fonts, copy or the
  // viewport change the interface's geometry.
  const originFor = (target, atScale) => (target - 50 / atScale) / (1 - 1 / atScale);
  const restOriginX = originFor(showcaseMetrics.restX, 1.8);
  const restOriginY = originFor(showcaseMetrics.restY, 1.8);
  const recordOriginX = originFor(showcaseMetrics.recordX, 3.2);
  const recordOriginY = originFor(showcaseMetrics.recordY, 3.2);

  if (progress <= 0.5) {
    const local = ease(progress * 2);
    scale = 1 + local * 0.8;
    originX = 50 + local * (restOriginX - 50);
    originY = 50 + local * (restOriginY - 50);
  } else {
    const local = ease((progress - 0.5) * 2);
    scale = 1.8 + local * 1.4;
    originX = restOriginX + local * (recordOriginX - restOriginX);
    originY = restOriginY + local * (recordOriginY - restOriginY);
  }

  const bottomOpacity = clamp((progress - 0.25) / 0.18);
  const captionOpacity = clamp((progress - 0.72) / 0.16);
  showcase.style.setProperty("--showcase-scale", scale.toFixed(4));
  showcase.style.setProperty("--showcase-origin", `${originX.toFixed(2)}% ${originY.toFixed(2)}%`);
  showcase.style.setProperty("--showcase-bottom-o", bottomOpacity.toFixed(3));
  showcase.style.setProperty("--showcase-bottom-y", `${(30 * (1 - bottomOpacity)).toFixed(2)}px`);
  showcase.style.setProperty("--showcase-caption-o", captionOpacity.toFixed(3));
  showcase.style.setProperty("--showcase-caption-y", `${(20 * (1 - captionOpacity)).toFixed(2)}px`);
  showcase.style.setProperty("--p", progress.toFixed(4));
  showcase.dataset.beat = String(Math.min(2, Math.floor(progress * 3)));
}

function updateScenes() {
  frameRequest = 0;
  if (!scenesLive) return;
  updateHero();
  updateShowcase();
}

function queueSceneUpdate() {
  if (!frameRequest && scenesLive) frameRequest = requestAnimationFrame(updateScenes);
}

window.addEventListener("scroll", queueSceneUpdate, { passive: true });
window.addEventListener("resize", queueSceneUpdate, { passive: true });
window.addEventListener("resize", () => {
  measureShowcase();
  // Crossing the short-screen or reduced-motion boundary changes layout, not
  // just coordinates, so rebuild the scene mode before measuring again.
  if (scenesLive !== canHoldScenes()) setSceneMode();
}, { passive: true });

if (typeof motionQuery.addEventListener === "function") {
  motionQuery.addEventListener("change", () => {
    document.documentElement.classList.toggle("motion-ok", !motionQuery.matches);
    setSceneMode();
    initReveals();
    initWordCycle();
  });
}

if (document.fonts?.ready) document.fonts.ready.then(() => {
  measureShowcase();
  queueSceneUpdate();
});
setSceneMode();

// ── The live sample: real arithmetic and a real rest countdown ────────────

const sample = {
  weight: document.querySelector("#sample-weight"),
  reps: document.querySelector("#sample-reps"),
  orm: document.querySelector("[data-sample-orm]"),
  volume: document.querySelector("[data-sample-volume]"),
  restVolume: document.querySelector("[data-rest-volume]"),
  button: document.querySelector("[data-complete-sample]"),
  frame: document.querySelector(".reel-set"),
  announcement: document.querySelector("[data-sample-announcement]"),
  restReadout: document.querySelector("[data-rest-readout]"),
  restFill: document.querySelector("[data-rest-fill]"),
  endsAt: 0,
  interval: 0,
  complete: false,
};

function sampleValues() {
  const weight = clamp(Number(sample.weight?.value) || 85, 1, 500);
  const reps = Math.round(clamp(Number(sample.reps?.value) || 6, 1, 30));
  return { weight, reps, volume: weight * reps, oneRm: weight * (1 + reps / 30) };
}

function renderSample() {
  if (!sample.weight || !sample.reps) return;
  const { volume, oneRm } = sampleValues();
  if (sample.orm) sample.orm.textContent = `${formatNumber(oneRm)} kg`;
  if (sample.volume) sample.volume.textContent = formatNumber(volume);
  if (sample.restVolume) sample.restVolume.textContent = `${formatNumber(volume)} kg`;
}

function resetSampleCompletion() {
  sample.complete = false;
  sample.frame?.classList.remove("is-complete");
  if (sample.button) {
    sample.button.disabled = false;
    const label = sample.button.querySelector("span");
    if (label) label.textContent = "Complete set";
  }
  renderSample();
}

for (const input of [sample.weight, sample.reps]) {
  input?.addEventListener("input", resetSampleCompletion);
}
renderSample();

function updateRest() {
  if (!sample.endsAt) return;
  const left = Math.max(0, Math.ceil((sample.endsAt - Date.now()) / 1000));
  const minutes = String(Math.floor(left / 60)).padStart(2, "0");
  const seconds = String(left % 60).padStart(2, "0");
  if (sample.restReadout) sample.restReadout.textContent = `${minutes}:${seconds}`;
  if (sample.restFill) sample.restFill.style.width = `${(left / 90) * 100}%`;
  if (left === 0) {
    clearInterval(sample.interval);
    sample.interval = 0;
    sample.endsAt = 0;
    if (sample.announcement) sample.announcement.textContent = "Sample rest complete.";
  }
}

function startRest() {
  clearInterval(sample.interval);
  sample.endsAt = Date.now() + 90_000;
  updateRest();
  sample.interval = window.setInterval(updateRest, 1000);
}

sample.button?.addEventListener("click", () => {
  if (sample.complete) return;
  const { volume, oneRm } = sampleValues();
  sample.complete = true;
  sample.frame?.classList.add("is-complete");
  sample.button.disabled = true;
  const label = sample.button.querySelector("span");
  if (label) label.textContent = "Set logged";
  if (sample.announcement) {
    sample.announcement.textContent = `Set complete. ${formatNumber(volume)} kilograms of volume. Estimated one-rep max ${formatNumber(oneRm)} kilograms. Rest started.`;
  }
  startRest();

  // Advancing the reel advances the native scrollbar too, so the two never
  // disagree. Reduced-motion visitors already see every frame and stay put.
  if (scenesLive && hero) {
    window.setTimeout(() => {
      const top = hero.getBoundingClientRect().top + window.scrollY;
      const hold = hero.getBoundingClientRect().height - window.innerHeight;
      window.scrollTo({ top: top + hold * 0.5, behavior: motionQuery.matches ? "auto" : "smooth" });
    }, 850);
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && sample.endsAt) updateRest();
});

// ── Four composition-specific reveals; nothing stays hidden without JS ────

let revealObserver = null;
let counterObserver = null;

function animateCounter(node) {
  if (node.dataset.rolled === "true") return;
  node.dataset.rolled = "true";
  const target = Number(node.dataset.roll);
  if (!Number.isFinite(target) || motionQuery.matches) {
    node.textContent = formatNumber(target);
    return;
  }

  const start = performance.now();
  const duration = 950;
  const tick = (now) => {
    const progress = clamp((now - start) / duration);
    const value = Math.round(target * ease(progress));
    node.textContent = formatNumber(value);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initReveals() {
  revealObserver?.disconnect();
  counterObserver?.disconnect();
  const reveals = [...document.querySelectorAll("[data-reveal]")];
  const counters = [...document.querySelectorAll("[data-roll]")];

  if (motionQuery.matches || !("IntersectionObserver" in window)) {
    for (const node of reveals) node.classList.add("in-view");
    for (const node of counters) animateCounter(node);
    return;
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  counterObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.45 });

  for (const node of reveals) {
    if (!node.classList.contains("in-view")) revealObserver.observe(node);
  }
  for (const node of counters) {
    if (node.dataset.rolled !== "true") counterObserver.observe(node);
  }
}

initReveals();

// ── Privacy statement: one fact lights at a time, only while on screen ────

let wordObserver = null;
let wordTimer = 0;

function initWordCycle() {
  wordObserver?.disconnect();
  clearInterval(wordTimer);
  wordTimer = 0;
  const root = document.querySelector("[data-word-cycle]");
  if (!root) return;
  const words = [...root.children];

  if (motionQuery.matches || !("IntersectionObserver" in window)) {
    for (const word of words) word.classList.add("is-lit");
    return;
  }

  let index = 0;
  const show = () => {
    for (const [i, word] of words.entries()) word.classList.toggle("is-lit", i === index);
    index = (index + 1) % words.length;
  };

  wordObserver = new IntersectionObserver(([entry]) => {
    clearInterval(wordTimer);
    wordTimer = 0;
    if (entry.isIntersecting && !document.hidden) {
      show();
      wordTimer = window.setInterval(show, 900);
    } else {
      for (const word of words) word.classList.remove("is-lit");
    }
  }, { threshold: 0.35 });
  wordObserver.observe(root);
}

initWordCycle();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) initWordCycle();
  else clearInterval(wordTimer);
});
