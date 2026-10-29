"use client";

import { useEffect, useRef } from "react";
import { CHAPTERS, runtime, useStore } from "@/lib/store";
import { scrollToChapter } from "./Nav";

export default function ChapterRail() {
  const chapter = useStore((s) => s.chapter);
  const revealed = useStore((s) => s.revealed);
  const fill = useRef(null);

  useEffect(() => {
    let raf;
    const loop = () => {
      if (fill.current) fill.current.style.transform = `scaleY(${Math.min(1, runtime.chapterSmooth / (CHAPTERS.length - 1))})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <nav className="rail" data-revealed={revealed || undefined} aria-label="Chapters">
      <span className="rail__track">
        <span ref={fill} className="rail__fill" />
      </span>
      <ol>
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              className="rail__item"
              aria-current={chapter === i ? "step" : undefined}
              onClick={() => scrollToChapter(c.id)}
            >
              <span className="rail__index">{String(i).padStart(2, "0")}</span>
              <span className="rail__label">{c.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
