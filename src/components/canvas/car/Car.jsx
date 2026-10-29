"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { CAR, buildBodyGeometry } from "@/lib/carGeometry";
import { createCarMaterials, createCarUniforms } from "@/lib/carMaterials";
import { FINISHES, runtime, useStore } from "@/lib/store";
import Wheels from "./Wheels";
import Interior from "./Interior";
import CarLights from "./CarLights";
import Xray from "./Xray";

/** Mirror across the centre plane; flips winding so faces stay front-facing. */
function mirrored(geometry) {
  const g = geometry.clone().scale(1, 1, -1);
  const index = g.index;
  for (let i = 0; i < index.count; i += 3) {
    const b = index.getX(i + 1);
    index.setX(i + 1, index.getX(i + 2));
    index.setX(i + 2, b);
  }
  return g;
}

function buildMirrorGeometries() {
  const housing = new THREE.SphereGeometry(1, 40, 24);
  housing.scale(0.06, 0.068, 0.125);
  housing.translate(0.965, 1.0, 0.985);

  const stalk = new THREE.CylinderGeometry(0.016, 0.022, 0.12, 16);
  stalk.rotateX(Math.PI / 2);
  stalk.translate(0.985, 0.95, 0.88);

  const glass = new THREE.CircleGeometry(1, 40);
  glass.scale(0.104, 0.055, 1);
  glass.rotateY(-Math.PI / 2);
  glass.translate(0.903, 1.0, 0.985);

  return {
    housing: [housing, mirrored(housing)],
    stalk: [stalk, mirrored(stalk)],
    glass: [glass, mirrored(glass)],
  };
}

function buildWellGeometry() {
  const r = CAR.archRadius - 0.004;
  const depth = 0.43;
  // keep only the part of the tube above the underbody
  const cut = Math.acos((CAR.wheelRadius - 0.17) / r);
  const tube = new THREE.CylinderGeometry(r, r, depth, 40, 1, true, cut, Math.PI * 2 - cut * 2);
  tube.rotateX(Math.PI / 2);
  tube.translate(0, 0, CAR.archInner + depth / 2);
  const capCut = Math.asin((0.17 - CAR.wheelRadius) / r);
  const cap = new THREE.CircleGeometry(r, 40, capCut, Math.PI - capCut * 2);
  cap.translate(0, 0, CAR.archInner);
  return { tube, cap };
}

export default function Car() {
  const body = useRef(null);
  const initialPaint = useStore.getState().paint;
  const geometry = useMemo(() => buildBodyGeometry(), []);
  const uniforms = useMemo(() => createCarUniforms(initialPaint), [initialPaint]);
  const materials = useMemo(() => createCarMaterials(uniforms, initialPaint), [uniforms, initialPaint]);
  const mirrors = useMemo(() => buildMirrorGeometries(), []);
  const well = useMemo(() => buildWellGeometry(), []);
  const parts = useMemo(
    () => ({
      wellMaterial: new THREE.MeshStandardMaterial({ color: "#060607", roughness: 0.95, side: THREE.DoubleSide }),
      mirrorGlass: new THREE.MeshStandardMaterial({ color: "#9aa3ad", metalness: 1, roughness: 0.04 }),
    }),
    []
  );

  useEffect(
    () => () => {
      geometry.dispose();
      materials.dispose();
      Object.values(mirrors).flat().forEach((g) => g.dispose());
      well.tube.dispose();
      well.cap.dispose();
      parts.wellMaterial.dispose();
      parts.mirrorGlass.dispose();
    },
    [geometry, materials, mirrors, well, parts]
  );

  // Repaint: remember the old colour, then sweep the new one from nose to tail.
  useEffect(
    () =>
      useStore.subscribe((state, prev) => {
        if (state.paint === prev.paint) return;
        gsap.killTweensOf(uniforms.uSweep);
        uniforms.uPrevColor.value.copy(materials.paint.color);
        materials.paint.color.set(state.paint);
        uniforms.uSweep.value = 0;
        gsap.to(uniforms.uSweep, { value: 1.12, duration: 1.7, ease: "power2.inOut" });
      }),
    [materials, uniforms]
  );

  useFrame((state, delta) => {
    const { finish } = useStore.getState();
    const target = FINISHES.find((f) => f.id === finish) ?? FINISHES[0];
    const k = 1 - Math.exp(-delta * 4);
    const paint = materials.paint;
    paint.roughness += (target.roughness - paint.roughness) * k;
    paint.metalness += (target.metalness - paint.metalness) * k;
    paint.clearcoat += (target.clearcoat - paint.clearcoat) * k;
    uniforms.uFlake.value += (target.flake - uniforms.uFlake.value) * k;

    const { xray, interior, speed } = runtime.story;
    uniforms.uXray.value = xray;
    materials.glass.opacity = (0.8 - interior * 0.55) * (1 - xray);
    materials.glass.visible = xray < 0.98;

    // a little life in the suspension: squat under power, idle float
    if (body.current) {
      const t = state.clock.elapsedTime;
      body.current.rotation.z = speed * 0.012 + Math.sin(t * 23) * speed * 0.0012;
      body.current.position.y = Math.sin(t * 1.3) * 0.0015 + Math.sin(t * 31) * speed * 0.0016;
    }
  });

  return (
    <group>
      <group ref={body}>
        <mesh geometry={geometry} material={materials.exterior} castShadow />
        <mesh geometry={geometry} material={materials.interior} />
        {[0, 1].map((side) => (
          <group key={side}>
            <mesh geometry={mirrors.housing[side]} material={materials.paint} />
            <mesh geometry={mirrors.stalk[side]} material={materials.trim} />
            <mesh geometry={mirrors.glass[side]} material={parts.mirrorGlass} />
          </group>
        ))}
        <CarLights geometry={geometry} />
        <Interior />
      </group>

      {[CAR.wheelFrontX, CAR.wheelRearX].flatMap((x) =>
        [1, -1].map((side) => (
          <group key={`${x}${side}`} position={[x, CAR.wheelRadius, 0]} scale={[1, 1, side]}>
            <mesh geometry={well.tube} material={parts.wellMaterial} />
            <mesh geometry={well.cap} material={parts.wellMaterial} />
          </group>
        ))
      )}
      <Wheels />
      <Xray geometry={geometry} />
    </group>
  );
}
