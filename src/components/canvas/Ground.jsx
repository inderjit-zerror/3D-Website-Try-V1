"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { runtime } from "@/lib/store";
import streakVertex from "@/shaders/streaks/vertex.glsl";
import streakFragment from "@/shaders/streaks/fragment.glsl";

const FLOOR_DAY = new THREE.Color("#d7d6d2");
const FLOOR_NIGHT = new THREE.Color("#0b0c10");

/** Polished studio floor (day) that turns into wet asphalt (night). */
export default function Ground({ quality = "high" }) {
  const reflector = useRef(null);
  const distance = useRef(0);

  const streaks = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: streakVertex,
        fragmentShader: streakFragment,
        uniforms: {
          uDistance: { value: 0 },
          uSpeed: { value: 0 },
          uNight: { value: 0 },
          uDayColor: { value: new THREE.Color("#1d2128") },
          uNightColor: { value: new THREE.Color("#c9e6ff").multiplyScalar(2.2) },
        },
        transparent: true,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => streaks.dispose(), [streaks]);

  useFrame((_, delta) => {
    const n = runtime.night;
    const speed = runtime.story.speed;
    distance.current += speed * 34 * Math.min(delta, 0.05);
    streaks.uniforms.uDistance.value = distance.current;
    streaks.uniforms.uSpeed.value = speed;
    streaks.uniforms.uNight.value = n;

    const m = reflector.current;
    if (m) {
      m.color.lerpColors(FLOOR_DAY, FLOOR_NIGHT, n);
      m.mixStrength = THREE.MathUtils.lerp(0.55, 4.5, n);
      m.roughness = THREE.MathUtils.lerp(0.85, 0.55, n);
    }
  });

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <MeshReflectorMaterial
          ref={reflector}
          resolution={quality === "high" ? 1024 : 512}
          blur={[380, 110]}
          mixBlur={1}
          mixStrength={0.55}
          mixContrast={1}
          mirror={0.65}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.25}
          roughness={0.85}
          metalness={0.25}
          color={FLOOR_DAY}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.004} material={streaks} renderOrder={1}>
        <planeGeometry args={[60, 16]} />
      </mesh>
    </group>
  );
}
