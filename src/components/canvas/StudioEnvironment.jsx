"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { runtime } from "@/lib/store";

const hdr = (hex, intensity) => new THREE.Color(hex).multiplyScalar(intensity);

// Light panels of a virtual photo studio. They only exist in the reflection
// probe, so the paint picks up crisp highlight lines without any real lights.
const PANELS = [
  // top softbox
  { size: [11, 3.2], position: [0, 6.5, 0], rotation: [Math.PI / 2, 0, 0], day: hdr("#ffffff", 3.2), night: hdr("#b9c8ff", 0.55) },
  // long side strips: the signature reflection along the doors
  { size: [18, 0.85], position: [0, 1.7, 6.5], rotation: [0, Math.PI, 0], day: hdr("#ffffff", 2.4), night: hdr("#2f6bff", 1.6) },
  { size: [18, 0.85], position: [0, 1.7, -6.5], rotation: [0, 0, 0], day: hdr("#ffffff", 2.4), night: hdr("#ff7a33", 0.95) },
  { size: [18, 0.3], position: [0, 3.4, 6.5], rotation: [0, Math.PI, 0], day: hdr("#ffffff", 1.4), night: hdr("#9ad8ff", 0.5) },
  // front and rear fill
  { size: [7, 3.5], position: [10, 2, 0], rotation: [0, -Math.PI / 2, 0], day: hdr("#fbf6ef", 1.5), night: hdr("#cfd8ff", 0.18) },
  { size: [7, 3.5], position: [-10, 2, 0], rotation: [0, Math.PI / 2, 0], day: hdr("#eef3ff", 1.1), night: hdr("#ff2a3d", 0.25) },
  // diagonal kicker
  { size: [0.6, 9], position: [4, 4.5, 4], rotation: [0, -Math.PI / 4, Math.PI / 3], day: hdr("#ffffff", 1.8), night: hdr("#7fe1ff", 0.8) },
  // floor bounce
  { size: [40, 40], position: [0, -0.6, 0], rotation: [-Math.PI / 2, 0, 0], day: hdr("#a9a8a3", 0.42), night: hdr("#0c0e14", 0.25) },
];

const BG_DAY = hdr("#d6d8db", 0.55);
const BG_NIGHT = hdr("#05070c", 1);

export default function StudioEnvironment({ resolution = 256 }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const last = useRef(-1);

  const studio = useMemo(() => {
    const virtual = new THREE.Scene();
    virtual.background = BG_DAY.clone();
    const target = new THREE.WebGLCubeRenderTarget(resolution, { type: THREE.HalfFloatType });
    const cubeCamera = new THREE.CubeCamera(0.1, 100, target);
    cubeCamera.position.set(0, 0.8, 0);
    const panels = PANELS.map((p) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(...p.size),
        new THREE.MeshBasicMaterial({ color: p.day.clone(), side: THREE.DoubleSide, toneMapped: false })
      );
      mesh.position.set(...p.position);
      mesh.rotation.set(...p.rotation);
      virtual.add(mesh);
      return { mesh, day: p.day, night: p.night };
    });
    return { virtual, target, cubeCamera, panels };
  }, [resolution]);

  useEffect(() => {
    scene.environment = studio.target.texture;
    return () => {
      scene.environment = null;
      studio.target.dispose();
      studio.panels.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    };
  }, [scene, studio]);

  useFrame(() => {
    const n = runtime.night;
    if (Math.abs(n - last.current) < 0.002) return;
    last.current = n;
    studio.panels.forEach(({ mesh, day, night }) => mesh.material.color.lerpColors(day, night, n));
    studio.virtual.background.lerpColors(BG_DAY, BG_NIGHT, n);
    studio.cubeCamera.update(gl, studio.virtual);
  });

  return null;
}
