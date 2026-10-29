"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import Director from "./Director";
import Atmosphere from "./Atmosphere";
import StudioEnvironment from "./StudioEnvironment";
import Ground from "./Ground";
import Airflow from "./Airflow";
import Backdrop from "./Backdrop";
import Effects from "./Effects";
import Car from "./car/Car";

/** Compiles every shader up front, then tells the preloader we're ready. */
function Ready() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const setLoaded = useStore((s) => s.setLoaded);

  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      try {
        gl.compile(scene, camera);
      } catch {
        // a material that fails here will compile on first draw instead
      }
      // give the GPU a couple of frames to finish linking before the reveal
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setLoaded(true));
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [gl, scene, camera, setLoaded]);
  return null;
}

export default function Scene() {
  const car = useRef(null);
  const [debug] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"));
  const [dpr, setDpr] = useState(1.5);
  const [quality, setQuality] = useState("high");

  return (
    <Canvas
      className="webgl"
      dpr={dpr}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 30, near: 0.05, far: 300, position: [9, 1, 9] }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color("#efeeeb"))}
    >
      <PerformanceMonitor
        bounds={() => [42, 58]}
        onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))}
        onDecline={() => {
          setDpr(1);
          setQuality("low");
        }}
      />
      <Suspense fallback={null}>
        <Director car={car} debug={debug} />
        <Atmosphere />
        <StudioEnvironment />
        <group ref={car}>
          <Car />
          <Airflow />
          <ContactShadows position={[0, 0.006, 0]} scale={[7, 4]} resolution={512} blur={2.6} far={1.6} opacity={0.78} frames={Infinity} />
        </group>
        <Ground quality={quality} />
        <Backdrop />
        <Effects />
        <Ready />
        {debug && <OrbitControls makeDefault target={[0, 0.6, 0]} />}
      </Suspense>
    </Canvas>
  );
}
