"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { runtime } from "@/lib/store";
import skyVertex from "@/shaders/sky/vertex.glsl";
import skyFragment from "@/shaders/sky/fragment.glsl";

export const PALETTE = {
  dayTop: new THREE.Color("#e4e5e7"),
  dayHorizon: new THREE.Color("#efeeeb"),
  nightTop: new THREE.Color("#020308"),
  nightHorizon: new THREE.Color("#0b1222"),
};

/** Sky dome shader plus fog that always matches its horizon colour. */
export default function Atmosphere() {
  const scene = useThree((s) => s.scene);

  const { material, fog } = useMemo(
    () => ({
      material: new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: {
          uNight: { value: 0 },
          uTime: { value: 0 },
          uDayTop: { value: PALETTE.dayTop },
          uDayHorizon: { value: PALETTE.dayHorizon },
          uNightTop: { value: PALETTE.nightTop },
          uNightHorizon: { value: PALETTE.nightHorizon },
        },
        side: THREE.BackSide,
        depthWrite: false,
      }),
      fog: new THREE.Fog(PALETTE.dayHorizon.clone(), 13, 46),
    }),
    []
  );

  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
      material.dispose();
    };
  }, [scene, fog, material]);

  useFrame((state) => {
    material.uniforms.uNight.value = runtime.night;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    fog.color.lerpColors(PALETTE.dayHorizon, PALETTE.nightHorizon, runtime.night);
  });

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[90, 48, 32]} />
    </mesh>
  );
}
