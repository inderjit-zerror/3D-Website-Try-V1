"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { CHAPTERS, runtime, useStore } from "@/lib/store";
import Preloader from "./ui/Preloader";
import Nav from "./ui/Nav";
import Story from "./ui/Story";
import ColorDock from "./ui/ColorDock";
import ChapterRail from "./ui/ChapterRail";
import Cursor from "./ui/Cursor";

const Scene = dynamic(() => import("./canvas/Scene"), { ssr: false });

const INTERACTIVE = "a, button, input, label, select, textarea, [data-no-drag]";

export default function Experience() {
  const loaded = useStore((s) => s.loaded);

  // smooth scroll + chapter tracking
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
    window.__lenis = lenis;
    if (process.env.NODE_ENV !== "production") window.__runtime = runtime;
    lenis.stop();

    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    let spans = [];
    const measure = () => {
      spans = [...document.querySelectorAll("[data-chapter]")].map((el) => ({
        top: el.offsetTop,
        height: el.offsetHeight,
      }));
    };
    const track = () => {
      const y = window.scrollY;
      let f = 0;
      spans.forEach((s, i) => {
        if (y >= s.top) f = i + Math.min(1, (y - s.top) / s.height);
      });
      runtime.chapter = f;
      const index = Math.min(CHAPTERS.length - 1, Math.max(0, Math.floor(f + 0.3)));
      if (index !== useStore.getState().chapter) useStore.getState().setChapter(index);
    };
    lenis.on("scroll", ScrollTrigger.update);
    lenis.on("scroll", track);
    const onResize = () => {
      measure();
      track();
    };
    measure();
    window.addEventListener("resize", onResize);
    ScrollTrigger.addEventListener("refresh", onResize);

    return () => {
      gsap.ticker.remove(raf);
      window.removeEventListener("resize", onResize);
      ScrollTrigger.removeEventListener("refresh", onResize);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  useEffect(() => {
    if (loaded) window.__lenis?.start();
  }, [loaded]);

  // pointer parallax + drag-to-rotate
  useEffect(() => {
    const drag = runtime.drag;
    let lastX = 0;
    const move = (e) => {
      runtime.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      runtime.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!drag.active) return;
      drag.target += (e.clientX - lastX) * 0.0075;
      lastX = e.clientX;
    };
    const down = (e) => {
      if (e.button !== 0 || e.target.closest(INTERACTIVE) || runtime.story.exterior < 0.5) return;
      drag.active = true;
      lastX = e.clientX;
      document.documentElement.classList.add("is-dragging");
    };
    const up = () => {
      drag.active = false;
      document.documentElement.classList.remove("is-dragging");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  // floating controls step aside once the footer takes over
  useEffect(() => {
    const footer = document.querySelector(".footer");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) document.documentElement.dataset.footer = "";
        else delete document.documentElement.dataset.footer;
      },
      { threshold: 0.25 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // day / night theme for the DOM layer
  useEffect(
    () =>
      useStore.subscribe((state) => {
        const theme = state.timeOfDay > 0.5 ? "night" : "day";
        if (document.documentElement.dataset.theme !== theme) document.documentElement.dataset.theme = theme;
      }),
    []
  );

  return (
    <>
      <div className="stage" aria-hidden="true">
        <Scene />
      </div>
      <Preloader />
      <Nav />
      <ChapterRail />
      <ColorDock />
      <Story />
      <Cursor />
    </>
  );
}
