"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { topHeightAt } from "@/lib/carGeometry";
import { runtime } from "@/lib/store";
import { useOverlayLayer } from "@/lib/layers";
import airVertex from "@/shaders/airflow/vertex.glsl";
import airFragment from "@/shaders/airflow/fragment.glsl";

const X_START = 5;
const X_END = -6.5;
const SAMPLES = 140;

function smooth(values, passes = 6) {
  let v = values;
  for (let p = 0; p < passes; p++) {
    v = v.map((y, i) => (i === 0 || i === v.length - 1 ? y : (v[i - 1] + y * 2 + v[i + 1]) / 4));
  }
  return v;
}

// Where the streamlines leave the body: just behind the nose, just ahead of
// the tail lip. Outside that span they ease towards free stream.
const NOSE = 2.24;
const TAIL = -2.24;

/** Streamline over the body at lateral offset z, `gap` above the surface. */
function topLine(z, gap) {
  const xs = Array.from({ length: SAMPLES }, (_, i) => X_START + ((X_END - X_START) * i) / (SAMPLES - 1));
  const noseY = (topHeightAt(NOSE, Math.abs(z)) ?? 0.75) + gap;
  const tailY = (topHeightAt(TAIL, Math.abs(z)) ?? 1.0) + gap;
  const ys = xs.map((x) => {
    if (x >= NOSE) return noseY - 0.16 * Math.min(1, (x - NOSE) / 2.5) ** 0.7;
    if (x <= TAIL) return tailY - (TAIL - x) * 0.06;
    return (topHeightAt(x, Math.abs(z)) ?? noseY) + gap;
  });
  const smoothed = smooth(ys, 10);
  return xs.map((x, i) => new THREE.Vector3(x, smoothed[i], z));
}

export default function Airflow() {
  const mesh = useRef(null);
  useOverlayLayer(mesh);

  const { geometry, material } = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 14; i++) {
      const z = -0.66 + (i / 13) * 1.32;
      lines.push(topLine(z, 0.035 + ((i * 5) % 4) * 0.07));
    }
    const parts = lines.map((points, i) => {
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 220, 0.0045, 5, false);
      const seed = new Float32Array(tube.attributes.position.count).fill(((i * 0.618) % 1) + 0.0001);
      tube.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
      return tube;
    });
    const merged = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return {
      geometry: merged,
      material: new THREE.ShaderMaterial({
        vertexShader: airVertex,
        fragmentShader: airFragment,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color("#1f4fff") } },
        transparent: true,
        depthWrite: false,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame((state) => {
    const amount = Math.max(runtime.story.airflow, runtime.story.speed * 0.6);
    if (mesh.current) mesh.current.visible = amount > 0.01;
    material.uniforms.uOpacity.value = amount;
    material.uniforms.uTime.value = state.clock.elapsedTime * (1 + runtime.story.speed * 3);
    material.uniforms.uColor.value.set(runtime.night > 0.5 ? "#9fe0ff" : "#1f4fff");
    if (runtime.night > 0.5) material.uniforms.uColor.value.multiplyScalar(1 + runtime.night);
  });

  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={4} frustumCulled={false} />;
}
