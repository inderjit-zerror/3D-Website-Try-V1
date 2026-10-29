"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { CAR } from "@/lib/carGeometry";
import {
  TIRE,
  buildBarrelGeometry,
  buildDiscGeometry,
  buildRimGeometry,
  buildTireGeometry,
} from "@/lib/wheelGeometry";
import { runtime, useStore } from "@/lib/store";

const RIM_FINISH = {
  arachnid: { color: "#2a2d31", metalness: 0.9, roughness: 0.3 },
  tempest: { color: "#c9ccd0", metalness: 1, roughness: 0.18 },
};

const PLACEMENTS = [
  { x: CAR.wheelFrontX, side: 1, front: true },
  { x: CAR.wheelFrontX, side: -1, front: true },
  { x: CAR.wheelRearX, side: 1, front: false },
  { x: CAR.wheelRearX, side: -1, front: false },
];

const CALIPER_ANGLE = (130 * Math.PI) / 180;

export default function Wheels() {
  const style = useStore((s) => s.wheels);
  const steerers = useRef([]);
  const spinners = useRef([]);
  const distance = useRef(0);

  const geo = useMemo(
    () => ({
      tire: buildTireGeometry(),
      barrel: buildBarrelGeometry(),
      disc: buildDiscGeometry(),
      cap: new THREE.CylinderGeometry(0.034, 0.034, 0.02, 32).rotateX(Math.PI / 2),
      rims: { arachnid: buildRimGeometry("arachnid"), tempest: buildRimGeometry("tempest") },
    }),
    []
  );
  const mats = useMemo(
    () => ({
      tire: new THREE.MeshStandardMaterial({ color: "#151517", roughness: 0.88, metalness: 0 }),
      rim: new THREE.MeshPhysicalMaterial({ ...RIM_FINISH.arachnid, clearcoat: 0.6, clearcoatRoughness: 0.1 }),
      barrel: new THREE.MeshStandardMaterial({ color: "#3a3d42", metalness: 0.8, roughness: 0.45, side: THREE.DoubleSide }),
      disc: new THREE.MeshStandardMaterial({ color: "#7c8086", metalness: 1, roughness: 0.38 }),
      caliper: new THREE.MeshPhysicalMaterial({ color: "#c1121f", roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 }),
      cap: new THREE.MeshStandardMaterial({ color: "#0e0f11", metalness: 0.6, roughness: 0.25 }),
    }),
    []
  );

  useEffect(() => {
    const finish = RIM_FINISH[style];
    mats.rim.color.set(finish.color);
    mats.rim.metalness = finish.metalness;
    mats.rim.roughness = finish.roughness;
  }, [style, mats]);

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => (g.isBufferGeometry ? g.dispose() : Object.values(g).forEach((r) => r.dispose())));
      Object.values(mats).forEach((m) => m.dispose());
    },
    [geo, mats]
  );

  useFrame((_, delta) => {
    const { speed, steer } = runtime.story;
    distance.current += (speed * 30 + runtime.velocity) * Math.min(delta, 0.05);
    const angle = -distance.current / TIRE.outer;
    PLACEMENTS.forEach((p, i) => {
      if (spinners.current[i]) spinners.current[i].rotation.z = angle;
      if (steerers.current[i]) steerers.current[i].rotation.y = p.front ? steer * p.side : 0;
    });
  });

  return PLACEMENTS.map((p, i) => (
    <group key={i} position={[p.x, TIRE.outer, p.side * CAR.track]} scale={[1, 1, p.side]}>
      <group ref={(el) => (steerers.current[i] = el)}>
        <group ref={(el) => (spinners.current[i] = el)}>
          <mesh geometry={geo.tire} material={mats.tire} castShadow />
          <mesh geometry={geo.barrel} material={mats.barrel} />
          <mesh geometry={geo.rims[style]} material={mats.rim} position-z={0.05} />
          <mesh geometry={geo.cap} material={mats.cap} position-z={0.112} />
          <mesh geometry={geo.disc} material={mats.disc} position-z={-0.03} />
        </group>
        <RoundedBox
          args={[0.15, 0.06, 0.075]}
          radius={0.018}
          smoothness={3}
          material={mats.caliper}
          position={[Math.cos(CALIPER_ANGLE) * 0.168, Math.sin(CALIPER_ANGLE) * 0.168, -0.022]}
          rotation-z={CALIPER_ANGLE - Math.PI / 2}
        />
      </group>
    </group>
  ));
}
