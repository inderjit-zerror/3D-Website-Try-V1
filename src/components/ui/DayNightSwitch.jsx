"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * Drag switch between day and night. While the knob is held the scene
 * scrubs continuously through dusk; on release it settles on the nearest
 * end. A plain click (or Enter / Space) toggles.
 */
export default function DayNightSwitch() {
  const value = useStore((s) => s.timeOfDay);
  const setTimeOfDay = useStore((s) => s.setTimeOfDay);
  const track = useRef(null);
  const gesture = useRef(null);
  const [dragging, setDragging] = useState(false);

  const valueAt = (clientX) => {
    const rect = track.current.getBoundingClientRect();
    const knob = rect.height;
    return Math.min(1, Math.max(0, (clientX - rect.left - knob / 2) / (rect.width - knob)));
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { x: e.clientX, start: value, moved: false };
    setDragging(true);
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    if (Math.abs(e.clientX - g.x) > 3) g.moved = true;
    if (g.moved) setTimeOfDay(valueAt(e.clientX));
  };

  const onPointerUp = () => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    setDragging(false);
    const current = useStore.getState().timeOfDay;
    setTimeOfDay(g.moved ? (current > 0.5 ? 1 : 0) : g.start > 0.5 ? 0 : 1);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setTimeOfDay(value > 0.5 ? 0 : 1);
    } else if (e.key === "ArrowLeft") setTimeOfDay(0);
    else if (e.key === "ArrowRight") setTimeOfDay(1);
  };

  const night = value > 0.5;

  return (
    <div className="tod" style={{ "--t": value }} data-dragging={dragging || undefined}>
      <span className="tod__label" aria-hidden="true">
        Day
      </span>
      <div
        ref={track}
        className="tod__track"
        role="switch"
        tabIndex={0}
        aria-checked={night}
        aria-label="Night mode — drag or press to switch between day and night"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <span className="tod__sky tod__sky--day" />
        <span className="tod__sky tod__sky--night">
          <i style={{ left: "22%", top: "30%" }} />
          <i style={{ left: "38%", top: "62%" }} />
          <i style={{ left: "52%", top: "26%" }} />
          <i style={{ left: "30%", top: "48%" }} />
        </span>
        <span className="tod__knob">
          <span className="tod__sun" />
          <span className="tod__moon" />
        </span>
      </div>
      <span className="tod__label" aria-hidden="true">
        Night
      </span>
    </div>
  );
}
