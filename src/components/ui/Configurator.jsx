"use client";

import { useEffect, useState } from "react";
import { FINISHES, INTERIORS, PAINTS, WHEELS, useStore } from "@/lib/store";
import Swatches from "./Swatches";

const PARAMS = ["paint", "finish", "wheels", "interior"];

/** Restore a shared build from the URL (?paint=%23…&finish=…). */
function useBuildFromUrl() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = useStore.getState();
    const hex = q.get("paint");
    if (hex && /^#[0-9a-f]{6}$/i.test(hex)) {
      s.setPaint(hex, PAINTS.find((p) => p.hex === hex)?.name ?? "Custom");
    }
    if (FINISHES.some((f) => f.id === q.get("finish"))) s.setFinish(q.get("finish"));
    if (WHEELS.some((w) => w.id === q.get("wheels"))) s.setWheels(q.get("wheels"));
    if (INTERIORS.some((i) => i.id === q.get("interior"))) s.setInterior(q.get("interior"));
  }, []);
}

function Options({ label, items, value, onChange, render }) {
  return (
    <fieldset className="config__group">
      <legend className="config__legend">{label}</legend>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={value === item.id}
            className="segmented__option"
            onClick={() => onChange(item.id)}
          >
            {render ? render(item) : item.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Configurator() {
  useBuildFromUrl();
  const { paint, paintName, finish, wheels, interior, setFinish, setWheels, setInterior } = useStore();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = new URL(window.location.href);
    const values = { paint, finish, wheels, interior };
    PARAMS.forEach((k) => url.searchParams.set(k, values[k]));
    url.hash = "yours";
    try {
      await navigator.clipboard.writeText(url.toString());
    } catch {
      window.history.replaceState(null, "", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const finishName = FINISHES.find((f) => f.id === finish)?.name;
  const wheelName = WHEELS.find((w) => w.id === wheels)?.name;
  const interiorName = INTERIORS.find((i) => i.id === interior)?.name;

  return (
    <div className="config" data-interactive data-no-drag>
      <fieldset className="config__group">
        <legend className="config__legend">
          Paint <span className="config__value">{paintName}</span>
        </legend>
        <Swatches size="lg" />
      </fieldset>

      <Options label="Finish" items={FINISHES} value={finish} onChange={setFinish} />

      <Options
        label="Wheels"
        items={WHEELS}
        value={wheels}
        onChange={setWheels}
        render={(w) => (
          <span className="segmented__stack">
            <span>{w.name}</span>
            <small>{w.note}</small>
          </span>
        )}
      />

      <Options
        label="Interior"
        items={INTERIORS}
        value={interior}
        onChange={setInterior}
        render={(i) => (
          <span className="segmented__row">
            <span className="segmented__dot" style={{ background: i.seat }} />
            {i.name}
          </span>
        )}
      />

      <div className="config__summary">
        <p className="eyebrow">Your build</p>
        <p className="config__build">
          Model S Plaid · {paintName} · {finishName} · {wheelName} · {interiorName}
        </p>
        <button type="button" className="btn btn--solid btn--wide" onClick={share}>
          {copied ? "Link copied ✓" : "Share this build"}
        </button>
      </div>
    </div>
  );
}
