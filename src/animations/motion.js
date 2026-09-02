/**
 * src/animations/motion.js
 * ---------------------------------------------------------------
 * Panshobh global motion language (built on Anime.js v4).
 *
 * Philosophy: animation is part of the product experience — it
 * communicates the journey SET GOALS → BUILD HABITS → REFLECT →
 * UNDERSTAND → IMPROVE. Motion here is calm, springy, purposeful.
 *
 * Conventions:
 *  - [data-motion]        element participates in page entrance stagger
 *  - [data-scroll-reveal] revealed when scrolled into view
 *  - [data-count-up]      numeric text revealed with a count-up
 *  - [data-progress-fill] width animated from 0 -> data-progress%
 *
 * All helpers are no-ops when the user prefers reduced motion.
 * ---------------------------------------------------------------
 */
import { animate, createTimeline, stagger, utils } from "animejs";

/** True when the OS requests reduced motion (also disables ambient loops). */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Force-stop an Anime.js animation and clear its inline transforms. */
export function stopAnim(anim) {
  if (!anim) return;
  try {
    anim.pause();
    anim.revert?.();
  } catch {
    /* instance already gone */
  }
}

/* ------------------------------------------------------------------ */
/* ENTRANCE — page opening                                             */
/* ------------------------------------------------------------------ */

/**
 * Coordinated page entrance: staggered rise + scale + opacity with a
 * soft spring feel. Used by PageTransition on every navigation so the
 * whole app shares one opening language.
 * Returns the timeline (caller may cancel on unmount).
 */
export function pageEntrance(rootEl, { maxY = 16, duration = 620 } = {}) {
  if (!rootEl) return null;
  const targets = rootEl.querySelectorAll("[data-motion]");
  if (!targets.length) return null;

  if (prefersReducedMotion()) {
    utils.set(targets, { opacity: 1, transform: "none" });
    return null;
  }

  utils.set(targets, { opacity: 0, translateY: maxY, scale: 0.985 });

  return createTimeline().add(targets, {
    opacity: [0, 1],
    translateY: [maxY, 0],
    scale: [0.985, 1],
    ease: "outBack(1.4)",
    duration,
    delay: stagger(70, { start: 40 }),
  });
}

/**
 * Reveal a specific list of elements with stagger (e.g. freshly loaded
 * cards). Callers guard with refs so it runs once per data load.
 */
export function staggerReveal(targets, { y = 14, duration = 480, staggerMs = 60 } = {}) {
  if (!targets || (targets.length !== undefined && targets.length === 0)) return null;
  if (prefersReducedMotion()) {
    utils.set(targets, { opacity: 1, transform: "none" });
    return null;
  }
  utils.set(targets, { opacity: 0, translateY: y });
  return animate(targets, {
    opacity: [0, 1],
    translateY: [y, 0],
    ease: "outBack(1.2)",
    duration,
    delay: stagger(staggerMs),
  });
}

/* ------------------------------------------------------------------ */
/* INTERACTION — tactile micro-feedback                                */
/* ------------------------------------------------------------------ */

/** Small press-and-release spring for buttons/cards. */
export function pressPop(el) {
  if (!el || prefersReducedMotion()) return;
  animate(el, {
    scale: [
      { to: 0.96, duration: 90, ease: "out(2)" },
      { to: 1, duration: 260, ease: "outBack(2.2)" },
    ],
  });
}

/** Emphasis pop for icons/emojis (one-shot). */
export function popIn(el, { scale = 1.25, rotate = 0 } = {}) {
  if (!el || prefersReducedMotion()) return;
  animate(el, {
    scale: [
      { to: scale, duration: 140, ease: "out(3)" },
      { to: 1, duration: 320, ease: "outBack(2)" },
    ],
    ...(rotate
      ? { rotate: [{ to: rotate, duration: 140 }, { to: 0, duration: 320, ease: "outBack(2)" }] }
      : {}),
  });
}


/* ------------------------------------------------------------------ */
/* DATA REVEAL — numbers & progress                                    */
/* ------------------------------------------------------------------ */

/**
 * Count up every [data-count-up] element inside root.
 * Element text must parse as a number (non-numeric values are skipped).
 */
export function animateCountUp(rootEl) {
  if (!rootEl) return [];
  const els = rootEl.querySelectorAll("[data-count-up]");
  const anims = [];
  els.forEach((el, i) => {
    const target = Number(el.textContent);
    if (!Number.isFinite(target)) return;
    if (prefersReducedMotion() || target === 0) {
      el.textContent = String(target);
      return;
    }
    const obj = { v: 0 };
    anims.push(
      animate(obj, {
        v: target,
        duration: 900,
        ease: "out(3)",
        delay: 120 + i * 90,
        onUpdate: () => {
          el.textContent = String(Math.round(obj.v));
        },
      })
    );
  });
  return anims;
}

/** Animate [data-progress-fill] widths from 0 to data-progress%. */
export function animateProgressFills(rootEl) {
  if (!rootEl) return [];
  const els = rootEl.querySelectorAll("[data-progress-fill]");
  if (!els.length) return [];
  if (prefersReducedMotion()) {
    els.forEach((el) => (el.style.width = `${el.dataset.progress || 0}%`));
    return [];
  }
  return Array.from(els).map((el, i) =>
    animate(el, {
      width: [0, `${el.dataset.progress || 0}%`],
      duration: 850,
      ease: "out(3)",
      delay: 200 + i * 110,
    })
  );
}

/* ------------------------------------------------------------------ */
/* SCROLL — reveals that add value only                                */
/* ------------------------------------------------------------------ */

/** Attach once-only reveals to [data-scroll-reveal] inside root. */
export function attachScrollReveals(rootEl) {
  if (!rootEl) return () => {};
  const els = rootEl.querySelectorAll("[data-scroll-reveal]");
  if (!els.length) return () => {};

  if (prefersReducedMotion()) {
    utils.set(els, { opacity: 1, transform: "none" });
    return () => {};
  }

  utils.set(els, { opacity: 0, translateY: 20 });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        animate(el, {
          opacity: [0, 1],
          translateY: [20, 0],
          ease: "out(3)",
          duration: 560,
        });
      });
    },
    { rootMargin: "0px 0px -60px 0px", threshold: 0.1 }
  );

  els.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}

/* ------------------------------------------------------------------ */
/* CELEBRATION — "Growth Particles" (global wow, used sparingly)       */
/* ------------------------------------------------------------------ */

/**
 * Spawn a small burst of abstract "growth" dots from an element.
 * Represents: goal completed / habit checked / insight unlocked.
 * Particles are self-cleaning (removed when the animation completes).
 * Counts scale down on small screens; no-op with reduced motion.
 * The nearest [data-particle-scope] ancestor (or parent) must be
 * position:relative — pages add that on their root container.
 */
export function spawnGrowthParticles(anchorEl, { count } = {}) {
  if (!anchorEl || prefersReducedMotion()) return;

  const container = anchorEl.closest("[data-particle-scope]") || anchorEl.parentElement;
  if (!container) return;

  const isSmall = window.innerWidth < 640;
  const n = count ?? (isSmall ? 6 : 10);
  const rect = anchorEl.getBoundingClientRect();
  const scopeRect = container.getBoundingClientRect();
  const originX = rect.left - scopeRect.left + rect.width / 2;
  const originY = rect.top - scopeRect.top + rect.height / 2;

  const dots = Array.from({ length: n }, () => {
    const dot = document.createElement("span");
    dot.setAttribute("aria-hidden", "true");
    dot.style.cssText = `position:absolute;left:${originX}px;top:${originY}px;width:${
      4 + Math.random() * 4
    }px;height:${4 + Math.random() * 4}px;border-radius:9999px;background:${
      Math.random() > 0.5 ? "#6366f1" : "#a78bfa"
    };pointer-events:none;z-index:30;`;
    container.appendChild(dot);
    return dot;
  });

  animate(dots, {
    translateX: () => (Math.random() - 0.5) * 120,
    translateY: () => -30 - Math.random() * 70,
    opacity: [{ from: 1, to: 0.9, duration: 1 }, { to: 0, duration: 620, ease: "inQuad" }],
    scale: { from: 1, to: 0.4 },
    duration: 720,
    ease: "out(3)",
    onComplete: () => dots.forEach((d) => d.remove()),
  });
}

/* ------------------------------------------------------------------ */
/* AMBIENT — extremely subtle idle motion (Level 3, used sparingly)    */
/* ------------------------------------------------------------------ */

/** Gentle float loop for an empty-state icon. Returns a stop function. */
export function floatLoop(el) {
  if (!el || prefersReducedMotion()) return () => {};
  const anim = animate(el, {
    translateY: [-3, 3],
    duration: 2600,
    ease: "inOut(2)",
    alternate: true,
    loop: true,
  });
  return () => stopAnim(anim);
}

/* ------------------------------------------------------------------ */
/* GLOBAL TACTILITY — every button responds                            */
/* ------------------------------------------------------------------ */

/**
 * Delegated listeners making ALL buttons/links tactile app-wide:
 * press = tiny compression, release = spring back, primary buttons
 * lift slightly on hover. One listener pair for the whole app.
 * Returns a cleanup function.
 */
export function attachButtonMotion(rootEl) {
  if (!rootEl || prefersReducedMotion()) return () => {};

  const onPointerDown = (e) => {
    const btn = e.target.closest?.("button, a, [role='button']");
    if (btn && !btn.disabled) pressPop(btn);
  };
  const onPointerEnter = (e) => {
    const btn = e.target.closest?.(".primary-button");
    if (!btn || btn.disabled) return;
    animate(btn, { scale: 1.035, translateY: -1, duration: 180, ease: "out(3)" });
  };
  const onPointerLeave = (e) => {
    const btn = e.target.closest?.(".primary-button");
    if (!btn || btn.disabled) return;
    animate(btn, { scale: 1, translateY: 0, duration: 260, ease: "outBack(2)" });
  };

  rootEl.addEventListener("pointerdown", onPointerDown, { passive: true });
  rootEl.addEventListener("pointerenter", onPointerEnter, true);
  rootEl.addEventListener("pointerleave", onPointerLeave, true);
  return () => {
    rootEl.removeEventListener("pointerdown", onPointerDown);
    rootEl.removeEventListener("pointerenter", onPointerEnter, true);
    rootEl.removeEventListener("pointerleave", onPointerLeave, true);
  };
}

/* ------------------------------------------------------------------ */
/* PROGRESS RINGS — animate SVG stroke from empty to value             */
/* ------------------------------------------------------------------ */

/**
 * Animate every [data-ring] circle inside root from a fully-drawn state
 * (empty ring) to its natural stroke-dashoffset. Call after mount/data.
 */
export function animateProgressRings(rootEl) {
  if (!rootEl) return [];
  const rings = rootEl.querySelectorAll("[data-ring]");
  if (!rings.length) return [];
  return Array.from(rings).map((ring, i) => {
    const target = Number(ring.getAttribute("stroke-dashoffset")) || 0;
    if (prefersReducedMotion()) return null;
    return animate(ring, {
      strokeDashoffset: [ring.dataset.circumference || target, target],
      duration: 1100,
      delay: 250 + i * 150,
      ease: "out(3)",
    });
  });
}
