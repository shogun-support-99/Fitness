/**
 * IronLog — landing page behaviour.
 *
 * The page's authored moment is the hero log sheet writing itself: rows wiped in
 * down the page, ticks drawing their own checks, the PR mark stamped, totals
 * rolled last. That is all in CSS, keyed off markup, so it runs whether or not
 * this script loads.
 *
 * What lives here is the part CSS cannot do on its own:
 *   - reveals that need to fire on SCROLL rather than on load
 *   - counters that roll to a real value once they are in view
 *   - the cursor tilt on the hero sheet, and its opt-outs
 *   - the footer curtain and the masthead nav spy
 *
 * Every effect degrades to a fully visible, fully correct page if this script
 * never runs: the animated state is the DEFAULT and the keyframes run from an
 * offset, so no content is ever hidden waiting on JS. No analytics, no
 * third-party requests, nothing that phones home.
 */

const motionQuery = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
const prefersReducedMotion = () => Boolean(motionQuery?.matches);
const canObserve = "IntersectionObserver" in globalThis;
/** Touch devices get no tilt and no hover-dependent motion. */
const hasHover = globalThis.matchMedia?.("(hover: hover)").matches ?? false;

/* ------------------------------------------------------------------------- *
 * Scroll reveals
 * ------------------------------------------------------------------------- */

/**
 * Assign each reveal a variant by ROLE so the page never repeats one identical
 * entrance down its length: headings rise, rows are written, rules draw, marks
 * stamp. Deterministic from the element's own tag and classes.
 */
function revealVariant(el) {
  const explicit = el.getAttribute("data-reveal");
  if (explicit && explicit !== "auto") return explicit;
  const cls = String(el.className || "");
  const tag = el.tagName.toLowerCase();
  if (/record-mark|pr-|stamp/.test(cls)) return "stamp";
  if (/menu|ledger-list|faq|library-grid|cardstub/.test(cls)) return "write";
  if (/logsheet-foot|rule|leader/.test(cls)) return "rule";
  if (/^h[1-6]$/.test(tag) || /lede|proof-line/.test(cls)) return "rise";
  return "write";
}

/**
 * Reveal on scroll. Without JS, without IntersectionObserver, or under reduced
 * motion, every element is simply left in its final state and nothing is
 * observed - the CSS defaults are already the visible ones.
 */
function initReveals() {
  const els = [...document.querySelectorAll("[data-reveal]")];
  if (els.length === 0) return;

  if (prefersReducedMotion() || !canObserve) {
    for (const el of els) el.classList.add("is-revealed");
    return;
  }

  for (const el of els) el.setAttribute("data-reveal", revealVariant(el));

  const observer = new IntersectionObserver(
    (entries) => {
      // Stagger by order of appearance in this batch, not by DOM index, so a
      // long list never leaves its last item waiting seconds.
      const batch = entries.filter((e) => e.isIntersecting);
      batch.forEach((entry, i) => {
        entry.target.style.setProperty("--reveal-delay", `${i * 70}ms`);
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
  );

  for (const el of els) observer.observe(el);
}

/* ------------------------------------------------------------------------- *
 * Counters
 * ------------------------------------------------------------------------- */

/**
 * Roll the digits of a figure to its real value.
 *
 * Only ever called on elements carrying data-count-to, and the true value is
 * already in the markup, so this can only ever animate toward a number the page
 * was already telling the truth about. Tabular mono makes the columns line up
 * while the digits move.
 */
/**
 * Format a count the way the page already writes it, thousands separators
 * included. Without this, rolling data-count-to="1388" would replace the
 * markup's "1,388" with "1388" - a real regression hiding inside an animation.
 */
function formatCount(value, decimals) {
  try {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(value));
  } catch {
    return Number(value).toFixed(decimals);
  }
}

function odometerMarkup(value, decimals) {
  return formatCount(value, decimals)
    .split("")
    .map((ch) => {
      if (!/[0-9]/.test(ch)) return `<span class="odo-static">${ch}</span>`;
      const strip = Array.from({ length: 10 }, (_, d) => `<i>${d}</i>`).join("");
      return `<span class="odo-digit"><span class="odo-strip" style="--to:${ch}">${strip}</span></span>`;
    })
    .join("");
}

function initCounters() {
  const els = [...document.querySelectorAll("[data-count-to]")];
  if (els.length === 0) return;

  const settle = (el) => {
    const to = Number(el.getAttribute("data-count-to"));
    const decimals = Number(el.getAttribute("data-count-decimals")) || 0;
    if (!Number.isFinite(to)) return;
    const text = formatCount(to, decimals);
    el.setAttribute("data-value", text);
    if (prefersReducedMotion()) {
      el.textContent = text;
      return;
    }
    el.innerHTML = odometerMarkup(to, decimals);
    void el.offsetWidth; // flush so the transition runs from the 0 position
  };

  if (prefersReducedMotion() || !canObserve) {
    for (const el of els) settle(el);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        settle(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.5 },
  );

  for (const el of els) observer.observe(el);
}

/* ------------------------------------------------------------------------- *
 * Cursor tilt on the hero sheet
 * ------------------------------------------------------------------------- */

/**
 * The one object on the page that answers the cursor.
 *
 * Kept under 5deg, rAF-throttled, and disabled on touch, under reduced motion,
 * and when the sheet has scrolled out of view - a transform running on an
 * offscreen element is wasted work on a laptop battery.
 */
function initTilt() {
  const sheet = document.querySelector("[data-tilt]");
  if (!sheet) return;
  if (prefersReducedMotion() || !hasHover) return;

  const MAX = 4.2;
  let frame = 0;
  let inView = true;

  const onMove = (event) => {
    if (!inView) return;
    const rect = sheet.getBoundingClientRect();
    const px = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
    const py = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      sheet.style.setProperty("--tilt-x", `${(-py * MAX).toFixed(2)}deg`);
      sheet.style.setProperty("--tilt-y", `${(px * MAX).toFixed(2)}deg`);
    });
  };

  const onLeave = () => {
    if (frame) cancelAnimationFrame(frame);
    sheet.style.setProperty("--tilt-x", "0deg");
    sheet.style.setProperty("--tilt-y", "0deg");
  };

  sheet.addEventListener("pointermove", onMove, { passive: true });
  sheet.addEventListener("pointerleave", onLeave, { passive: true });

  if (canObserve) {
    const io = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        if (!inView) onLeave();
      },
      { threshold: 0.05 },
    );
    io.observe(sheet);
  }
}

/* ------------------------------------------------------------------------- *
 * Footer curtain
 * ------------------------------------------------------------------------- */

/**
 * The footer rises as a curtain.
 *
 * The hidden state is applied only once this script has run (via `.js-reveal`
 * on the document element), so a browser without JS, without
 * IntersectionObserver, or with reduced motion never loses the content.
 */
function initCurtainFooter() {
  const inner = document.querySelector(".foot-inner");
  if (!inner) return;

  if (prefersReducedMotion() || !canObserve) return;

  document.documentElement.classList.add("js-reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -32px 0px" },
  );

  observer.observe(inner);
}

/* ------------------------------------------------------------------------- *
 * Nav spy
 * ------------------------------------------------------------------------- */

/** Mark the section the reader is in, in the masthead nav. */
function initNavSpy() {
  const links = [...document.querySelectorAll(".masthead-nav a[href^='#']")];
  if (links.length === 0 || !canObserve) return;

  const byId = new Map(links.map((link) => [link.getAttribute("href").slice(1), link]));

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = byId.get(entry.target.id);
        if (!link) continue;
        // A class rather than an inline colour, so the palette stays in CSS.
        link.classList.toggle("is-current", entry.isIntersecting);
        if (entry.isIntersecting) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
    },
    { threshold: 0.28, rootMargin: "-64px 0px -45% 0px" },
  );

  for (const id of byId.keys()) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }
}

/* ------------------------------------------------------------------------- *
 * Menu leaders
 * ------------------------------------------------------------------------- */

/** Index the capabilities menu so its leaders draw one after another. */
function initMenuIndex() {
  const items = document.querySelectorAll(".menu dt, .menu dd");
  items.forEach((el, i) => el.style.setProperty("--i", String(Math.floor(i / 2))));
}

/**
 * Release the masked headline.
 *
 * The class is what starts the animation, so a page with no JavaScript simply
 * shows the headline where it belongs: the CSS default is the final state and the
 * keyframes run FROM an offset. Under reduced motion the class is still added -
 * the CSS override resolves it to the final state immediately, which keeps the
 * code path single rather than branching here and there.
 */
function initMaskedHeadline() {
  const headline = document.querySelector("[data-masked]");
  if (!headline) return;
  const copy = headline.closest(".sheet-hero-copy");
  // Two frames, not one: the browser has to commit the masked layout before the
  // animation starts, or the reveal can be skipped entirely on a cold load.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    headline.classList.add("is-written");
    copy?.classList.add("is-written");
  }));
}

/**
 * The masthead load.
 *
 * A barbell loaded with the plates this page's own sample session actually calls
 * for, so the biggest image on the page is a claim the arithmetic supports rather
 * than a stock photograph. It is the last thing to start: the page has to read
 * correctly before anything is fetched for it, and three.js is 407 KB gzipped.
 *
 * Every failure path is silent. No WebGL, a blocked script, a hidden canvas or
 * reduced motion all leave the masthead exactly as it was - the CSS band and the
 * headline carry the screen without it.
 */
async function initMastheadScene() {
  const canvas = document.querySelector("[data-scene-canvas]");
  if (!canvas) return;
  const host = canvas.closest(".scene-band");
  if (!host) return;

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  try {
    // Two directories up: this file is served from /assets/js/ and the scene
    // module lives with the app at /app/js/. A wrong specifier here fails only at
    // runtime, inside a dynamic import, which is why the catch below is not
    // optional - but it must still point at the real path.
    const { mountScene, plateSplit } = await import("../../app/js/scene3d.js");
    if (!mountScene) return;

    // 100 kg on a 20 kg bar: two 25s and a 15 per side. Drawn from the same
    // sample session the log sheet below spells out, so the two agree.
    const split = plateSplit(Number(host.dataset.sceneWeight ?? 100), { units: "kg" });
    const readout = host.querySelector('[data-role="scene-readout"]');
    if (readout) {
      readout.textContent = split.ok
        ? `${split.loaded} kg on the bar · ${split.perSide.join(" + ") || "empty"} a side`
        : `Loaded ${split.loaded} kg of ${host.dataset.sceneWeight} kg`;
    }

    await mountScene(canvas, {
      perSide: split.perSide,
      colour: getComputedStyle(document.documentElement).getPropertyValue("--scene-plate").trim() || "#8a8a88",
      reduced: reduce,
      scope: window,
      onUnavailable: () => {
        host.hidden = true;
      },
    });
  } catch {
    // A missing module or a refused context must never take the masthead with it.
    host.hidden = true;
  }
}

initMenuIndex();
initReveals();
initCounters();
initTilt();
initCurtainFooter();
initNavSpy();
initMaskedHeadline();

// Idle first, then the 3D. The headline and the sheet are the page; the barbell
// is an enhancement on top of them and must not compete with them for the first
// frames after load.
if ("requestIdleCallback" in window) {
  requestIdleCallback(() => initMastheadScene(), { timeout: 2400 });
} else {
  setTimeout(() => initMastheadScene(), 900);
}
