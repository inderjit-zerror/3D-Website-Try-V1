"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { INTERIORS, runtime, useStore } from "@/lib/store";
import { useOverlayLayer } from "@/lib/layers";
import { createClusterTexture, createScreenTexture } from "@/lib/textures";

function Seat({ position, materials }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.5, 0.12, 0.5]} radius={0.05} smoothness={4} position={[0.02, 0.5, 0]} material={materials.seat} />
      <RoundedBox args={[0.42, 0.06, 0.08]} radius={0.025} position={[0.03, 0.57, 0.22]} material={materials.seatDark} />
      <RoundedBox args={[0.42, 0.06, 0.08]} radius={0.025} position={[0.03, 0.57, -0.22]} material={materials.seatDark} />
      <group position={[-0.25, 0.53, 0]} rotation-z={0.22}>
        <RoundedBox args={[0.13, 0.62, 0.5]} radius={0.05} smoothness={4} position={[0, 0.31, 0]} material={materials.seat} />
        <RoundedBox args={[0.08, 0.5, 0.06]} radius={0.025} position={[0.06, 0.3, 0.22]} material={materials.seatDark} />
        <RoundedBox args={[0.08, 0.5, 0.06]} radius={0.025} position={[0.06, 0.3, -0.22]} material={materials.seatDark} />
        <RoundedBox args={[0.1, 0.17, 0.28]} radius={0.045} smoothness={4} position={[-0.01, 0.72, 0]} material={materials.seat} />
      </group>
    </group>
  );
}

function RearBench({ materials }) {
  return (
    <group position={[-1.1, 0, 0]}>
      <RoundedBox args={[0.5, 0.12, 1.36]} radius={0.05} smoothness={4} position={[0, 0.47, 0]} material={materials.seat} />
      <group position={[-0.25, 0.5, 0]} rotation-z={0.3}>
        <RoundedBox args={[0.12, 0.56, 1.36]} radius={0.05} smoothness={4} position={[0, 0.28, 0]} material={materials.seat} />
        {[-0.46, 0, 0.46].map((z) => (
          <RoundedBox key={z} args={[0.09, 0.14, 0.26]} radius={0.04} position={[-0.01, 0.62, z]} material={materials.seat} />
        ))}
      </group>
    </group>
  );
}

function Yoke({ materials }) {
  const grip = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      [
        [0, 0.075, -0.168], [0, -0.01, -0.176], [0, -0.07, -0.135], [0, -0.088, 0],
        [0, -0.07, 0.135], [0, -0.01, 0.176], [0, 0.075, 0.168],
      ].map((p) => new THREE.Vector3(...p))
    );
    return new THREE.TubeGeometry(curve, 96, 0.021, 16, false);
  }, []);
  useEffect(() => () => grip.dispose(), [grip]);

  return (
    <group position={[0.36, 0.86, -0.37]} rotation-z={-0.42}>
      <mesh geometry={grip} material={materials.leather} />
      {[-0.168, 0.168].map((z) => (
        <mesh key={z} position={[0, 0.075, z]} material={materials.leather}>
          <sphereGeometry args={[0.021, 16, 12]} />
        </mesh>
      ))}
      <RoundedBox args={[0.03, 0.03, 0.32]} radius={0.012} position={[0.012, -0.012, 0]} material={materials.trimGloss} />
      <mesh position={[0.02, 0, 0]} rotation-z={Math.PI / 2} material={materials.trimGloss}>
        <cylinderGeometry args={[0.055, 0.055, 0.05, 32]} />
      </mesh>
      <mesh position={[0.17, 0, 0]} rotation-z={Math.PI / 2} material={materials.dash}>
        <cylinderGeometry args={[0.032, 0.04, 0.26, 20]} />
      </mesh>
    </group>
  );
}

export default function Interior() {
  const root = useRef(null);
  useOverlayLayer(root);
  const interior = useStore((s) => s.interior);
  const textures = useMemo(() => ({ screen: createScreenTexture(), cluster: createClusterTexture() }), []);
  const materials = useMemo(
    () => ({
      seat: new THREE.MeshPhysicalMaterial({ color: INTERIORS[0].seat, roughness: 0.55, sheen: 0.4, sheenRoughness: 0.6 }),
      seatDark: new THREE.MeshStandardMaterial({ color: "#1b1b1e", roughness: 0.6 }),
      leather: new THREE.MeshStandardMaterial({ color: "#121214", roughness: 0.5 }),
      dash: new THREE.MeshStandardMaterial({ color: "#151517", roughness: 0.62 }),
      trimGloss: new THREE.MeshPhysicalMaterial({ color: "#0a0a0b", roughness: 0.15, clearcoat: 1 }),
      accent: new THREE.MeshStandardMaterial({ color: "#8d8a84", metalness: 1, roughness: 0.28 }),
      carpet: new THREE.MeshStandardMaterial({ color: "#0d0d0f", roughness: 1 }),
      ambient: new THREE.MeshBasicMaterial({ color: new THREE.Color("#7fb8ff").multiplyScalar(1.6), toneMapped: false }),
      screen: new THREE.MeshBasicMaterial({ map: textures.screen, toneMapped: false }),
      cluster: new THREE.MeshBasicMaterial({ map: textures.cluster, toneMapped: false }),
    }),
    [textures]
  );

  useEffect(() => {
    const seat = INTERIORS.find((i) => i.id === interior) ?? INTERIORS[0];
    materials.seat.color.set(seat.seat);
  }, [interior, materials]);

  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m.dispose());
      Object.values(textures).forEach((t) => t.dispose());
    },
    [materials, textures]
  );

  useFrame(() => {
    if (root.current) root.current.visible = runtime.story.xray < 0.4;
    // ambient LEDs glow brighter at night and when the camera is inside
    const glow = 0.6 + runtime.night * 1.6 + runtime.story.interior * 0.8;
    materials.ambient.color.set("#7fb8ff").multiplyScalar(glow);
  });

  return (
    <group ref={root}>
      <mesh position={[-0.3, 0.3, 0]} rotation-x={-Math.PI / 2} material={materials.carpet}>
        <planeGeometry args={[2.9, 1.66]} />
      </mesh>

      <Seat position={[-0.12, 0, -0.37]} materials={materials} />
      <Seat position={[-0.12, 0, 0.37]} materials={materials} />
      <RearBench materials={materials} />

      {/* centre console + armrest */}
      <RoundedBox args={[0.95, 0.24, 0.24]} radius={0.04} position={[0.02, 0.44, 0]} material={materials.trimGloss} />
      <RoundedBox args={[0.34, 0.07, 0.22]} radius={0.03} position={[-0.32, 0.6, 0]} material={materials.seat} />

      {/* dashboard */}
      <RoundedBox args={[0.42, 0.16, 1.66]} radius={0.05} smoothness={4} position={[0.82, 0.79, 0]} material={materials.dash} />
      <RoundedBox args={[0.32, 0.06, 1.62]} radius={0.03} position={[0.92, 0.875, 0]} material={materials.dash} />
      <mesh position={[0.607, 0.79, 0]} material={materials.accent}>
        <boxGeometry args={[0.012, 0.032, 1.56]} />
      </mesh>
      <mesh position={[0.612, 0.757, 0]} material={materials.ambient}>
        <boxGeometry args={[0.004, 0.006, 1.5]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[-0.3, 0.76, side * 0.88]} material={materials.ambient}>
          <boxGeometry args={[1.5, 0.006, 0.004]} />
        </mesh>
      ))}

      {/* 17" landscape display */}
      <group position={[0.56, 0.99, 0]} rotation-z={0.14}>
        <RoundedBox args={[0.025, 0.262, 0.44]} radius={0.01} material={materials.trimGloss} />
        <mesh position-x={-0.0135} rotation-y={-Math.PI / 2} material={materials.screen}>
          <planeGeometry args={[0.418, 0.238]} />
        </mesh>
      </group>

      {/* driver cluster */}
      <group position={[0.62, 0.935, -0.37]} rotation-z={0.25}>
        <RoundedBox args={[0.02, 0.1, 0.28]} radius={0.008} material={materials.trimGloss} />
        <mesh position-x={-0.011} rotation-y={-Math.PI / 2} material={materials.cluster}>
          <planeGeometry args={[0.27, 0.09]} />
        </mesh>
      </group>

      <Yoke materials={materials} />
    </group>
  );
}
