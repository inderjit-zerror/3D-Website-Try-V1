"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime } from "@/lib/store";
import { createBackdropTexture } from "@/lib/textures";

const DAY = new THREE.Color("#101114");
const NIGHT = new THREE.Color("#ffffff");

/** Giant outlined wordmark standing in the studio behind the hero shot. */
export default function Backdrop({ text = "PLAID" }) {
  const mesh = useRef(null);
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    let tex;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const family =
        getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "sans-serif";
      tex = createBackdropTexture(text, family);
      setTexture(tex);
    });
    return () => {
      cancelled = true;
      tex?.dispose();
    };
  }, [text]);

  useFrame(() => {
    if (!mesh.current) return;
    const amount = runtime.story.backdrop * runtime.intro;
    mesh.current.visible = amount > 0.01;
    mesh.current.material.opacity = amount * THREE.MathUtils.lerp(0.22, 0.32, runtime.night);
    mesh.current.material.color.lerpColors(DAY, NIGHT, runtime.night);
  });

  if (!texture) return null;
  return (
    <mesh ref={mesh} position={[-8.4, 2.5, -7.6]} rotation-y={0.83}>
      <planeGeometry args={[24, 6]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
