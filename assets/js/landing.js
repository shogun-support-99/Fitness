/**
 * IronLog — landing page behaviour.
 *
 * Deliberately tiny, and deliberately one moment. The craft floor asks for a
 * single authored motion rather than an identical entrance on every section, so
 * the only thing that animates on this page is the footer's curtain; sections
 * are simply there. No analytics, no third-party requests, and every effect
 * degrades to a fully visible page if this script never runs.
 */

const prefersReducedMotion =
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const canObserve = "IntersectionObserver" in globalThis;

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

  if (prefersReducedMotion || !canObserve) return;

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

initCurtainFooter();
initNavSpy();
