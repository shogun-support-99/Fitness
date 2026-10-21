/**
 * IronLog — landing page behaviour.
 *
 * Deliberately tiny: scroll reveal, count-up proof numbers, and a live clock
 * inside the phone mock. No analytics, no third-party requests.
 */

const prefersReducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** Fade sections in as they scroll into view. */
function initReveal() {
  const targets = document.querySelectorAll(".feature, .step, .privacy-list li, .section-head, .cta-band");
  if (targets.length === 0) return;

  targets.forEach((el) => el.classList.add("reveal"));

  if (prefersReducedMotion || !("IntersectionObserver" in globalThis)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  targets.forEach((el) => observer.observe(el));
}

/** Count the hero proof numbers up once they are on screen. */
function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length === 0) return;

  const run = (el) => {
    const target = Number(el.dataset.target) || 0;
    if (prefersReducedMotion) {
      el.textContent = String(target);
      return;
    }
    const duration = 1100;
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      // Ease-out cubic so the number settles instead of stopping abruptly.
      const eased = 1 - (1 - progress) ** 3;
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!("IntersectionObserver" in globalThis)) {
    counters.forEach(run);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        run(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.6 },
  );

  counters.forEach((el) => observer.observe(el));
}

/**
 * Keep the phone mock honest: show a real running clock rather than a frozen
 * one, so the screenshot-like illustration reflects the live app.
 */
function initMockClock() {
  const clock = document.querySelector(".mock-clock");
  if (!clock) return;
  const startedAt = Date.now();
  const render = () => {
    const total = Math.floor((Date.now() - startedAt) / 1000) + 24 * 60 + 31;
    const minutes = String(Math.floor(total / 60)).padStart(2, "0");
    const seconds = String(total % 60).padStart(2, "0");
    clock.textContent = `${minutes}:${seconds}`;
  };
  render();
  setInterval(render, 1000);
}

/** Mark the current section in the header nav while scrolling. */
function initNavSpy() {
  const links = [...document.querySelectorAll(".head-nav a[href^='#']")];
  if (links.length === 0 || !("IntersectionObserver" in globalThis)) return;

  const byId = new Map(
    links.map((link) => [link.getAttribute("href").slice(1), link]),
  );

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = byId.get(entry.target.id);
        if (!link) continue;
        link.style.color = entry.isIntersecting ? "var(--accent)" : "";
      }
    },
    { threshold: 0.35 },
  );

  for (const id of byId.keys()) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }
}

initReveal();
initCounters();
initMockClock();
initNavSpy();
