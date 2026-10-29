"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { runtime } from "@/lib/store";
import { createHeadlightTextures, createPillTexture, createTaillightTextures } from "@/lib/textures";

/**
 * Projects a decal onto the body. `dir` points from the car towards the
 * viewer; a ray is cast back along it through `aim` and the projector sits
 * where that ray first meets the paint.
 */
function projectDecal(mesh, { dir, aim, size, flipU = false }) {
  const d = new THREE.Vector3(...dir).normalize();
  const origin = d.clone().multiplyScalar(4).add(new THREE.Vector3(...aim));
  const ray = new THREE.Raycaster(origin, d.clone().negate());
  const hit = ray.intersectObject(mesh, false)[0];
  if (!hit) return null;
  const orientation = new THREE.Euler(0, Math.atan2(d.x, d.z), 0);
  const geometry = new DecalGeometry(mesh, hit.point, orientation, new THREE.Vector3(...size));
  if (flipU) {
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  }
  return geometry;
}

const decalMaterial = (params) =>
  new THREE.MeshStandardMaterial({
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    roughness: 0.12,
    metalness: 0.4,
    ...params,
  });

// Welcome sequence: two quick blinks then the lamps settle on.
function wakeCurve(t) {
  if (t <= 0) return 0;
  if (t < 0.12) return 1;
  if (t < 0.22) return 0.05;
  if (t < 0.34) return 1;
  if (t < 0.46) return 0.05;
  return Math.min(1, (t - 0.46) * 4);
}

export default function CarLights({ geometry }) {
  const head = useRef(null);
  const headSpots = useRef([]);
  const tailGlow = useRef(null);

  const textures = useMemo(
    () => ({ head: createHeadlightTextures(), tail: createTaillightTextures(), pill: createPillTexture() }),
    []
  );

  const decals = useMemo(() => {
    const mesh = new THREE.Mesh(geometry);
    mesh.updateMatrixWorld();
    const corner = 0.95;
    return {
      headR: projectDecal(mesh, { dir: [Math.sin(corner), 0, Math.cos(corner)], aim: [2.18, 0.655, 0.6], size: [0.6, 0.18, 0.5] }),
      headL: projectDecal(mesh, { dir: [Math.sin(corner), 0, -Math.cos(corner)], aim: [2.18, 0.655, -0.6], size: [0.6, 0.18, 0.5], flipU: true }),
      tail: projectDecal(mesh, { dir: [-1, 0, 0], aim: [-2.3, 0.83, 0], size: [1.86, 0.15, 0.6] }),
      intake: projectDecal(mesh, { dir: [1, 0, 0], aim: [2.3, 0.36, 0], size: [1.15, 0.13, 0.4] }),
      diffuser: projectDecal(mesh, { dir: [-1, 0, 0], aim: [-2.3, 0.54, 0], size: [1.3, 0.09, 0.5] }),
      handles: [
        [0.5, 1], [0.5, -1], [-0.66, 1], [-0.66, -1],
      ].map(([x, side]) => projectDecal(mesh, { dir: [0, 0, side], aim: [x, 0.8, 0], size: [0.2, 0.026, 0.3] })),
    };
  }, [geometry]);

  const spotTargets = useMemo(() => [new THREE.Object3D(), new THREE.Object3D()], []);

  const mats = useMemo(
    () => ({
      head: decalMaterial({
        map: textures.head.map,
        emissiveMap: textures.head.emissive,
        emissive: new THREE.Color("#eaf3ff"),
        emissiveIntensity: 0,
      }),
      tail: decalMaterial({
        map: textures.tail.map,
        emissiveMap: textures.tail.emissive,
        emissive: new THREE.Color("#ff1626"),
        emissiveIntensity: 0,
      }),
      black: decalMaterial({ alphaMap: textures.pill, color: "#060607", roughness: 0.3, metalness: 0.2 }),
      handle: decalMaterial({ alphaMap: textures.pill, color: "#b8bcc2", roughness: 0.18, metalness: 1 }),
    }),
    [textures]
  );

  useEffect(
    () => () => {
      Object.values(decals).flat().forEach((g) => g?.dispose());
      Object.values(mats).forEach((m) => m.dispose());
      Object.values(textures).forEach((t) => (t.isTexture ? t.dispose() : Object.values(t).forEach((x) => x.dispose())));
    },
    [decals, mats, textures]
  );

  useFrame(() => {
    const wake = wakeCurve(runtime.intro * 1.6 - 0.15);
    const night = runtime.night;
    const visible = runtime.story.xray < 0.5;
    mats.head.emissiveIntensity = wake * (2.2 + night * 7);
    mats.tail.emissiveIntensity = wake * (2.4 + night * 5);
    if (head.current) head.current.visible = visible;
    headSpots.current.forEach((s) => s && (s.intensity = wake * night * 160 * (visible ? 1 : 0)));
    if (tailGlow.current) tailGlow.current.intensity = wake * night * 2.2 * (visible ? 1 : 0);
  });

  return (
    <group>
      <group ref={head}>
        {decals.headR && <mesh geometry={decals.headR} material={mats.head} renderOrder={2} />}
        {decals.headL && <mesh geometry={decals.headL} material={mats.head} renderOrder={2} />}
        {decals.tail && <mesh geometry={decals.tail} material={mats.tail} renderOrder={2} />}
        {decals.intake && <mesh geometry={decals.intake} material={mats.black} renderOrder={2} />}
        {decals.diffuser && <mesh geometry={decals.diffuser} material={mats.black} renderOrder={2} />}
        {decals.handles.map((g, i) => g && <mesh key={i} geometry={g} material={mats.handle} renderOrder={2} />)}
      </group>

      {[0.62, -0.62].map((z, i) => (
        <group key={z}>
          <primitive object={spotTargets[i]} position={[9, 0, z * 1.6]} />
          <spotLight
            ref={(el) => (headSpots.current[i] = el)}
            target={spotTargets[i]}
            position={[2.2, 0.66, z]}
            angle={0.42}
            penumbra={0.75}
            distance={26}
            decay={1.6}
            intensity={0}
          />
        </group>
      ))}
      <pointLight ref={tailGlow} position={[-2.6, 0.7, 0]} color="#ff1a2a" distance={4} decay={2} intensity={0} />
    </group>
  );
}
