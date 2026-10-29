"use client";

import { useEffect, useRef } from "react";
import { runtime, useStore } from "@/lib/store";

/** Dot + trailing ring; the ring announces "Drag" over the car. */
export default function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const chapter = useStore((s) => s.chapter);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    const pos = { x: -100, y: -100 };
    const lag = { x: -100, y: -100 };
    let raf;
    const move = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const interactive = e.target.closest("a, button, label, input, [role='switch']");
      ring.current?.classList.toggle("cursor__ring--hover", Boolean(interactive));
    };
    const loop = () => {
      lag.x += (pos.x - lag.x) * 0.16;
      lag.y += (pos.y - lag.y) * 0.16;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`;
        ring.current.classList.toggle("cursor__ring--drag", runtime.drag.active);
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <span ref={dot} className="cursor__dot" />
      <span ref={ring} className="cursor__ring" data-mode={chapter === 5 ? "drag" : undefined}>
        <span className="cursor__text">Drag</span>
      </span>
    </div>
  );
}
