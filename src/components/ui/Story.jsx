"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useStore } from "@/lib/store";
import Configurator from "./Configurator";
import { scrollToChapter } from "./Nav";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

function Stat({ value, decimals = 0, prefix = "", unit, label }) {
  return (
    <li className="stat">
      <span className="stat__value">
        {prefix}
        <span data-count={value} data-decimals={decimals}>
          {Number(value).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        </span>
        {unit && <span className="stat__unit">{unit}</span>}
      </span>
      <span className="stat__label">{label}</span>
    </li>
  );
}

function Eyebrow({ index, children }) {
  return (
    <p className="eyebrow" data-fade>
      <span className="eyebrow__index">{index}</span>
      <span className="eyebrow__rule" />
      {children}
    </p>
  );
}

export default function Story() {
  const root = useRef(null);
  const revealed = useStore((s) => s.revealed);

  useGSAP(
    () => {
      if (!revealed) return;
      const chapters = gsap.utils.toArray(".chapter");

      chapters.forEach((section, i) => {
        const pin = section.querySelector(".pin");
        const splits = [...section.querySelectorAll("[data-split]")].map((el) =>
          SplitText.create(el, { type: "lines", mask: "lines", linesClass: "line" })
        );
        const lines = splits.flatMap((s) => s.lines);
        const fades = section.querySelectorAll("[data-fade]");
        const counters = section.querySelectorAll("[data-count]");

        const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
        tl.fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: 1.4, stagger: 0.08 }, 0)
          .fromTo(fades, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.07 }, 0.25);
        counters.forEach((el) => {
          const target = parseFloat(el.dataset.count);
          const decimals = parseInt(el.dataset.decimals, 10);
          const counter = { v: 0 };
          tl.fromTo(
            counter,
            { v: 0 },
            {
              v: target,
              duration: 2,
              ease: "power3.out",
              onUpdate: () => {
                el.textContent = counter.v.toLocaleString("en-US", {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                });
              },
            },
            0.35
          );
        });

        if (i === 0) {
          tl.play();
        } else {
          ScrollTrigger.create({
            trigger: section,
            start: "top 55%",
            onEnter: () => tl.play(),
            onLeaveBack: () => tl.reverse(),
          });
        }

        // hand over: the panel drifts up and dims as the next chapter arrives
        gsap.fromTo(
          pin,
          { opacity: 1, y: 0 },
          {
            opacity: 0,
            y: -80,
            ease: "none",
            scrollTrigger: { trigger: section, start: "52% top", end: "85% top", scrub: true },
          }
        );
      });
    },
    { scope: root, dependencies: [revealed] }
  );

  return (
    <main ref={root} className="story" data-revealed={revealed || undefined}>
      {/* 00 — Prologue */}
      <section className="chapter chapter--hero" id="hero" data-chapter="0">
        <div className="pin">
          <div className="hero__meta" data-fade>
            <span>N° 001 — Concept</span>
            <span>Tri-motor · All-wheel drive</span>
          </div>
          <h1 className="hero__title" data-split>
            Beyond <em>ludicrous.</em>
          </h1>
          <div className="hero__side">
            <p className="lede" data-fade>
              Three motors. One thousand and twenty horses. Not a sound. Scroll to take the Model S Plaid apart — and
              build it back up as yours.
            </p>
            <button type="button" className="scroll-cue" data-fade onClick={() => scrollToChapter("form")}>
              <span className="scroll-cue__line" />
              Begin the story
            </button>
          </div>
        </div>
      </section>

      {/* 01 — Form */}
      <section className="chapter chapter--form" id="form" data-chapter="1">
        <div className="pin">
          <div className="copy">
            <Eyebrow index="01">Form</Eyebrow>
            <h2 className="title" data-split>
              Sculpted by <em>the wind.</em>
            </h2>
            <p className="lede" data-fade>
              Before a single panel was pressed, the air had its say. Flush handles, a sealed underbody, wheels shaped
              like turbines — every surface negotiated until drag all but disappears.
            </p>
          </div>
          <ul className="stats" data-fade>
            <Stat value={0.208} decimals={3} label="Drag coefficient" />
            <Stat value={21} unit="″" label="Aero-forged wheels" />
            <Stat value={0} label="Exposed door handles" />
          </ul>
        </div>
      </section>

      {/* 02 — Power */}
      <section className="chapter chapter--power" id="power" data-chapter="2">
        <div className="pin">
          <div className="copy">
            <Eyebrow index="02">Power</Eyebrow>
            <h2 className="title" data-split>
              Gravity, <em>renegotiated.</em>
            </h2>
            <p className="lede" data-fade>
              Three carbon-sleeved motors deliver every newton-metre the instant you ask. No gears to hunt, no turbos to
              spool — just a silent, relentless shove that rearranges your sense of time.
            </p>
          </div>
          <ul className="stats stats--big" data-fade>
            <Stat value={1.99} decimals={2} unit="s" label="0–60 mph*" />
            <Stat value={1020} unit="hp" label="Peak power" />
            <Stat value={200} unit="mph" label="Top speed" />
          </ul>
        </div>
      </section>

      {/* 03 — Energy */}
      <section className="chapter chapter--energy" id="energy" data-chapter="3">
        <div className="pin">
          <div className="copy">
            <Eyebrow index="03">Energy</Eyebrow>
            <h2 className="title" data-split>
              Range without <em>anxiety.</em>
            </h2>
            <p className="lede" data-fade>
              Beneath the floor lies the heart of the machine: thousands of cells, held to within a degree of their
              ideal temperature. Plug in, and you are back on the road before your coffee cools.
            </p>
          </div>
          <ul className="stats stats--column" data-fade>
            <Stat value={390} unit="mi" label="Estimated range" />
            <Stat value={15} unit="min" label="For up to 200 mi of Supercharging" />
            <Stat value={250} unit="kW" label="Peak charge rate" />
          </ul>
        </div>
      </section>

      {/* 04 — Sanctuary */}
      <section className="chapter chapter--sanctuary" id="sanctuary" data-chapter="4">
        <div className="pin">
          <div className="copy copy--glass">
            <Eyebrow index="04">Sanctuary</Eyebrow>
            <h2 className="title" data-split>
              A cabin that <em>listens.</em>
            </h2>
            <p className="lede" data-fade>
              Step inside and the noise of the world falls away. A yoke that turns the horizon into an instrument, a
              cinematic display, and the calm of a gallery — with the reflexes of a cockpit.
            </p>
            <ul className="stats stats--inline" data-fade>
              <Stat value={17} unit="″" label="Cinematic display" />
              <Stat value={22} label="Speakers · 960 W" />
              <Stat value={3} label="Climate zones" />
            </ul>
          </div>
        </div>
      </section>

      {/* 05 — Yours */}
      <section className="chapter chapter--yours" id="yours" data-chapter="5">
        <div className="pin">
          <div className="copy">
            <Eyebrow index="05">Yours</Eyebrow>
            <h2 className="title" data-split>
              Make it <em>yours.</em>
            </h2>
            <p className="lede" data-fade>
              Choose a colour and watch it flow over the body. Drag anywhere to turn the car — the studio is yours.
            </p>
            <p className="hint" data-fade>
              <span className="hint__icon" aria-hidden="true">⟷</span> Drag to rotate
            </p>
          </div>
          <div data-fade className="config-wrap">
            <Configurator />
          </div>
        </div>
      </section>

      {/* 06 — Horizon */}
      <section className="chapter chapter--horizon" id="horizon" data-chapter="6">
        <div className="pin">
          <div className="copy copy--center">
            <Eyebrow index="06">Horizon</Eyebrow>
            <h2 className="title title--xl" data-split>
              The road ahead <br />
              is <em>electric.</em>
            </h2>
            <div className="cta-row" data-fade>
              <button type="button" className="btn btn--solid" onClick={() => scrollToChapter("yours")}>
                Configure yours
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => scrollToChapter("hero")}>
                Watch again
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p className="footer__word" aria-hidden="true">
          Model S
        </p>
        <div className="footer__grid">
          <div>
            <p className="eyebrow">Chapters</p>
            <ul className="footer__links">
              {["form", "power", "energy", "sanctuary", "yours"].map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => scrollToChapter(id)}>
                    {id[0].toUpperCase() + id.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Built with</p>
            <p className="footer__text">Next.js · React Three Fiber · Three.js · GLSL · GSAP · Lenis</p>
          </div>
          <div>
            <p className="eyebrow">Credits</p>
            <p className="footer__text">Concept, design &amp; WebGL — ZERROR Studios</p>
          </div>
        </div>
        <p className="footer__legal">
          Independent concept experience, not affiliated with or endorsed by Tesla, Inc. The car is a procedural
          model built in code. *With rollout subtracted. Figures are illustrative.
        </p>
      </footer>
    </main>
  );
}
