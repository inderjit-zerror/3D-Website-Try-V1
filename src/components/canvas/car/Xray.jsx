"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAR } from "@/lib/carGeometry";
import { runtime } from "@/lib/store";
import { useOverlayLayer } from "@/lib/layers";
import holoVertex from "@/shaders/hologram/vertex.glsl";
import holoFragment from "@/shaders/hologram/fragment.glsl";
import batteryVertex from "@/shaders/battery/vertex.glsl";
import batteryFragment from "@/shaders/battery/fragment.glsl";

const PACK = { x0: -1.22, x1: 1.12, z: 0.66, y: 0.255, pitch: 0.058 };
const DAY = { line: new THREE.Color("#1f4fff"), base: new THREE.Color("#0c1f4d"), hot: new THREE.Color("#2f7bff") };
const NIGHT = { line: new THREE.Color("#7fd4ff"), base: new THREE.Color("#0b2a52"), hot: new THREE.Color("#8fe8ff") };

const MOTORS = [
  [CAR.wheelFrontX, 0, 0.16, 0.36],
  [CAR.wheelRearX, -0.2, 0.15, 0.3],
  [CAR.wheelRearX, 0.2, 0.15, 0.3],
];

export default function Xray({ geometry }) {
  const group = useRef(null);
  const cells = useRef(null);
  useOverlayLayer(group);

  const layout = useMemo(() => {
    const matrices = [];
    const m = new THREE.Matrix4();
    for (let x = PACK.x0; x <= PACK.x1; x += PACK.pitch) {
      for (let z = -PACK.z; z <= PACK.z + 1e-6; z += PACK.pitch) {
        matrices.push(m.clone().makeTranslation(x, PACK.y, z));
      }
    }
    return matrices;
  }, []);

  const resources = useMemo(() => {
    const holo = new THREE.ShaderMaterial({
      vertexShader: holoVertex,
      fragmentShader: holoFragment,
      uniforms: {
        uTime: { value: 0 },
        uXray: { value: 0 },
        uColor: { value: DAY.line.clone() },
        uArchFront: { value: new THREE.Vector4(CAR.wheelFrontX, CAR.wheelRadius, CAR.archRadius, CAR.archInner) },
        uArchRear: { value: new THREE.Vector4(CAR.wheelRearX, CAR.wheelRadius, CAR.archRadius, CAR.archInner) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const battery = new THREE.ShaderMaterial({
      vertexShader: batteryVertex,
      fragmentShader: batteryFragment,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uOpacity: { value: 0 },
        uBase: { value: DAY.base.clone() },
        uHot: { value: DAY.hot.clone() },
      },
      transparent: true,
    });
    const cell = new THREE.CylinderGeometry(0.022, 0.022, 0.07, 10);
    const motor = new THREE.MeshBasicMaterial({ color: DAY.hot.clone(), transparent: true, toneMapped: false });
    const tray = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(PACK.x1 - PACK.x0 + 0.12, 0.1, PACK.z * 2 + 0.12).translate((PACK.x0 + PACK.x1) / 2, PACK.y, 0)
    );
    const trayMaterial = new THREE.LineBasicMaterial({ color: DAY.line.clone(), transparent: true });
    return { holo, battery, cell, motor, tray, trayMaterial };
  }, []);

  useEffect(() => {
    layout.forEach((matrix, i) => cells.current.setMatrixAt(i, matrix));
    cells.current.instanceMatrix.needsUpdate = true;
  }, [layout]);

  useEffect(() => () => Object.values(resources).forEach((r) => r.dispose()), [resources]);

  useFrame((state) => {
    const x = runtime.story.xray;
    if (group.current) group.current.visible = x > 0.002;
    if (x <= 0.002) return;
    const t = state.clock.elapsedTime;
    const n = runtime.night;
    const { holo, battery, motor, trayMaterial } = resources;
    holo.uniforms.uTime.value = t;
    holo.uniforms.uXray.value = x;
    holo.uniforms.uColor.value.lerpColors(DAY.line, NIGHT.line, n);
    battery.uniforms.uTime.value = t;
    battery.uniforms.uReveal.value = THREE.MathUtils.smoothstep(x, 0.45, 1);
    battery.uniforms.uOpacity.value = Math.min(1, x * 1.5);
    battery.uniforms.uBase.value.lerpColors(DAY.base, NIGHT.base, n);
    battery.uniforms.uHot.value.lerpColors(DAY.hot, NIGHT.hot, n);
    motor.color.lerpColors(DAY.hot, NIGHT.hot, n).multiplyScalar(1 + n * 2 + Math.sin(t * 4) * 0.3);
    motor.opacity = THREE.MathUtils.smoothstep(x, 0.6, 1);
    trayMaterial.color.lerpColors(DAY.line, NIGHT.line, n);
    trayMaterial.opacity = x * 0.8;
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={geometry} material={resources.holo} renderOrder={5} />
      <instancedMesh ref={cells} args={[resources.cell, resources.battery, layout.length]} frustumCulled={false} />
      <lineSegments geometry={resources.tray} material={resources.trayMaterial} />
      {MOTORS.map(([x, z, r, len], i) => (
        <mesh key={i} position={[x, CAR.wheelRadius, z]} rotation-x={Math.PI / 2} material={resources.motor}>
          <cylinderGeometry args={[r, r, len, 28]} />
        </mesh>
      ))}
    </group>
  );
}
