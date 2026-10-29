"use client";

import { PAINTS, useStore } from "@/lib/store";

/** Paint swatches + a free colour picker, shared by the dock and configurator. */
export default function Swatches({ size = "md", showNames = false }) {
  const paint = useStore((s) => s.paint);
  const setPaint = useStore((s) => s.setPaint);
  const isCustom = !PAINTS.some((p) => p.hex === paint);

  return (
    <div className={`swatches swatches--${size}`} role="radiogroup" aria-label="Paint colour">
      {PAINTS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={paint === p.hex}
          aria-label={p.name}
          title={p.name}
          className="swatch"
          style={{ "--swatch": p.hex }}
          onClick={() => setPaint(p.hex, p.name)}
        >
          <span className="swatch__chip" />
          {showNames && <span className="swatch__name">{p.name}</span>}
        </button>
      ))}
      <label className="swatch swatch--custom" title="Custom colour" data-active={isCustom || undefined}>
        <span className="swatch__chip" style={isCustom ? { "--swatch": paint } : undefined} />
        {showNames && <span className="swatch__name">Custom</span>}
        <input
          type="color"
          className="sr-only"
          aria-label="Custom paint colour"
          value={paint}
          onChange={(e) => setPaint(e.target.value, "Custom")}
        />
      </label>
    </div>
  );
}
