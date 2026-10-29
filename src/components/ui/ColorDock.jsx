"use client";

import { useStore } from "@/lib/store";
import Swatches from "./Swatches";

/** Always-on paint picker; steps aside in the cabin and the full configurator. */
export default function ColorDock() {
  const paintName = useStore((s) => s.paintName);
  const chapter = useStore((s) => s.chapter);
  const revealed = useStore((s) => s.revealed);
  const hidden = !revealed || chapter === 4 || chapter === 5;

  return (
    <aside className="dock" data-hidden={hidden || undefined} aria-label="Paint">
      <p className="dock__label">
        <span>Paint</span>
        <span key={paintName} className="dock__name">
          {paintName}
        </span>
      </p>
      <Swatches size="sm" />
    </aside>
  );
}
