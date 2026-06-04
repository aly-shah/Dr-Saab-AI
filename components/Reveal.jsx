"use client";

import { useEffect } from "react";

// Adds `.is-visible` to every `.reveal` element as it scrolls into view.
export default function Reveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            // gentle stagger for grouped items
            el.style.transitionDelay = `${Math.min(i * 60, 180)}ms`;
            el.classList.add("is-visible");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
