"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { runtime, useStore } from "@/lib/store";

const MIN_TIME = 2.2;

/** "Charging" preloader: fills while shaders compile, then lifts away. */
export default function Preloader() {
  const loaded = useStore((s) => s.loaded);
  const setRevealed = useStore((s) => s.setRevealed);
  const root = useRef(null);
  const count = useRef(null);
  const bar = useRef(null);
  const progress = useRef({ value: 0 });
  const started = useRef(0);
  const [gone, setGone] = useState(false);

  const render = () => {
    const v = progress.current.value;
    if (count.current) count.current.textContent = String(Math.round(v)).padStart(3, "0");
    if (bar.current) bar.current.style.transform = `scaleX(${v / 100})`;
  };

  useEffect(() => {
    started.current = performance.now();
    const tween = gsap.to(progress.current, { value: 84, duration: 3, ease: "power2.out", onUpdate: render });
    return () => tween.kill();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const wait = Math.max(0, MIN_TIME - (performance.now() - started.current) / 1000);
    const tl = gsap.timeline({ delay: wait });
    tl.to(progress.current, { value: 100, duration: 0.7, ease: "power3.inOut", onUpdate: render })
      .to(".preloader__inner > *", { yPercent: -120, opacity: 0, duration: 0.7, stagger: 0.05, ease: "power3.in" }, "+=0.15")
      .add(() => {
        setRevealed(true);
        gsap.to(runtime, { intro: 1, duration: 3.6, ease: "power2.out" });
      }, "-=0.2")
      .to(root.current, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.25")
      .add(() => setGone(true));
    return () => tl.kill();
  }, [loaded, setRevealed]);

  if (gone) return null;

  return (
    <div ref={root} className="preloader" role="status" aria-live="polite" aria-label="Loading experience">
      <div className="preloader__inner">
        <p className="preloader__mark">Model S <em>Plaid</em></p>
        <div className="preloader__battery">
          <span ref={bar} className="preloader__fill" />
        </div>
        <p className="preloader__meta">
          <span>Charging</span>
          <span>
            <span ref={count}>000</span>%
          </span>
        </p>
      </div>
      <p className="preloader__foot">
        <span>An interactive story in six chapters</span>
        <span>Concept experience</span>
      </p>
    </div>
  );
}
