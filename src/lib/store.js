import { create } from "zustand";

export const PAINTS = [
  { id: "pearl", name: "Pearl White", hex: "#e8e8e4" },
  { id: "black", name: "Solid Black", hex: "#0b0b0d" },
  { id: "stealth", name: "Stealth Grey", hex: "#3a3d42" },
  { id: "blue", name: "Deep Blue", hex: "#16306e" },
  { id: "red", name: "Ultra Red", hex: "#9c0a12" },
  { id: "silver", name: "Quicksilver", hex: "#a7abb0" },
];

export const FINISHES = [
  { id: "gloss", name: "Gloss", roughness: 0.18, metalness: 0.35, clearcoat: 1, flake: 0.04 },
  { id: "metallic", name: "Metallic", roughness: 0.32, metalness: 0.85, clearcoat: 1, flake: 0.22 },
  { id: "matte", name: "Satin Matte", roughness: 0.55, metalness: 0.3, clearcoat: 0.0001, flake: 0 },
];

export const WHEELS = [
  { id: "arachnid", name: "21″ Arachnid", note: "Forged graphite" },
  { id: "tempest", name: "19″ Tempest", note: "Silver aero" },
];

export const INTERIORS = [
  { id: "white", name: "Black & White", seat: "#e7e3da" },
  { id: "black", name: "All Black", seat: "#17171a" },
  { id: "cream", name: "Cream", seat: "#c9b393" },
];

export const CHAPTERS = [
  { id: "hero", label: "Prologue" },
  { id: "form", label: "Form" },
  { id: "power", label: "Power" },
  { id: "energy", label: "Energy" },
  { id: "sanctuary", label: "Sanctuary" },
  { id: "yours", label: "Yours" },
  { id: "horizon", label: "Horizon" },
];

export const useStore = create((set) => ({
  paint: PAINTS[0].hex,
  paintName: PAINTS[0].name,
  finish: "gloss",
  wheels: "arachnid",
  interior: "white",
  /** 0 = day, 1 = night. Continuous while the switch is being dragged. */
  timeOfDay: 0,
  loaded: false,
  /** true once the preloader has lifted and the intro has started */
  revealed: false,
  chapter: 0,
  setPaint: (hex, name) => set({ paint: hex, paintName: name }),
  setFinish: (finish) => set({ finish }),
  setWheels: (wheels) => set({ wheels }),
  setInterior: (interior) => set({ interior }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setLoaded: (loaded) => set({ loaded }),
  setRevealed: (revealed) => set({ revealed }),
  setChapter: (chapter) => set({ chapter }),
}));

/**
 * Mutable per-frame state shared between the DOM and the WebGL scene.
 * Kept outside React so scroll and pointer updates never trigger renders.
 */
export const runtime = {
  chapter: 0, // float chapter position from scroll
  chapterSmooth: 0,
  pointer: { x: 0, y: 0 },
  intro: 0, // 0 -> 1 camera intro after the preloader
  velocity: 0, // car speed along X while driving off (m/s)
  night: 0, // smoothed time of day
  drag: { active: false, target: 0, value: 0 },
  story: {
    airflow: 0,
    speed: 0,
    xray: 0,
    interior: 0,
    drive: 0,
    steer: 0,
    exterior: 1,
    backdrop: 1,
  },
};
