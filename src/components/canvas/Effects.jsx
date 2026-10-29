"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Noise, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingMode, VignetteEffect } from "postprocessing";
import { runtime } from "@/lib/store";

export default function Effects() {
  // Created by hand (not via <Bloom ref>): the wrapper memoises on
  // JSON.stringify(props), and with React 19 `ref` is a prop.
  const effects = useMemo(
    () => ({
      bloom: new BloomEffect({ mipmapBlur: true, luminanceThreshold: 1, luminanceSmoothing: 0.2, intensity: 0.35, radius: 0.72 }),
      vignette: new VignetteEffect({ offset: 0.28, darkness: 0.35 }),
    }),
    []
  );
  useEffect(() => () => Object.values(effects).forEach((e) => e.dispose()), [effects]);

  useFrame(() => {
    const n = runtime.night;
    effects.bloom.intensity = 0.35 + n * 0.9 + runtime.story.xray * 0.25;
    effects.vignette.darkness = 0.35 + n * 0.35;
  });

  return (
    <EffectComposer multisampling={4}>
      <primitive object={effects.bloom} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <primitive object={effects.vignette} />
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.08} />
    </EffectComposer>
  );
}
