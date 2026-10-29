"use client";

import { CHAPTERS, useStore } from "@/lib/store";
import DayNightSwitch from "./DayNightSwitch";

export function scrollToChapter(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = id === "yours" ? el.offsetHeight * 0.18 : 0;
  window.__lenis?.scrollTo(el.offsetTop + offset, { duration: 2.2 });
}

export default function Nav() {
  const chapter = useStore((s) => s.chapter);
  const revealed = useStore((s) => s.revealed);

  return (
    <header className="nav" data-revealed={revealed || undefined}>
      <a
        href="#hero"
        className="nav__brand"
        aria-label="Back to start"
        onClick={(e) => {
          e.preventDefault();
          scrollToChapter("hero");
        }}
      >
        TESLA
      </a>

      <div className="nav__chapter" aria-live="polite">
        <span className="nav__index">{String(chapter).padStart(2, "0")}</span>
        <span className="nav__rule" />
        <span key={chapter} className="nav__label">
          {CHAPTERS[chapter].label}
        </span>
      </div>

      <div className="nav__actions">
        <DayNightSwitch />
        <a
          href="#yours"
          className="btn btn--solid nav__cta"
          onClick={(e) => {
            e.preventDefault();
            scrollToChapter("yours");
          }}
        >
          Configure
        </a>
      </div>
    </header>
  );
}
