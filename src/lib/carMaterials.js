import * as THREE from "three";
import { CAR, LENGTH } from "./carGeometry";
import parsChunk from "@/shaders/car/pars.glsl";
import discardChunk from "@/shaders/car/discard.glsl";
import paintColorChunk from "@/shaders/car/paintColor.glsl";
import paintNormalChunk from "@/shaders/car/paintNormal.glsl";
import paintEmissiveChunk from "@/shaders/car/paintEmissive.glsl";

// glslify prefixes every file with this define; inline snippets don't need it.
const chunk = (src) => src.replace(/#define GLSLIFY 1\s*/g, "");

/**
 * Uniforms shared by every patched car material. They are passed by
 * reference into each compiled program, so updating `.value` here updates
 * the paint, trim, underbody and cabin shell in one go.
 */
export function createCarUniforms(initialPaint) {
  return {
    uArchFront: { value: new THREE.Vector4(CAR.wheelFrontX, CAR.wheelRadius, CAR.archRadius, CAR.archInner) },
    uArchRear: { value: new THREE.Vector4(CAR.wheelRearX, CAR.wheelRadius, CAR.archRadius + 0.006, CAR.archInner) },
    uXray: { value: 0 },
    uPrevColor: { value: new THREE.Color(initialPaint) },
    uSweep: { value: 1.2 },
    uSpan: { value: new THREE.Vector2(CAR.front, LENGTH) },
    uFlake: { value: 0.04 },
  };
}

function patch(material, uniforms, { paint = false } = {}) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vCarPos;\nvarying vec3 vCarNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCarPos = position;\nvCarNormal = normal;");

    let fragment = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${chunk(parsChunk)}`)
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>\n${chunk(discardChunk)}`);

    if (paint) {
      fragment = fragment
        .replace("vec4 diffuseColor = vec4( diffuse, opacity );", chunk(paintColorChunk))
        .replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.65, seams);"
        )
        .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n${chunk(paintNormalChunk)}`)
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${chunk(paintEmissiveChunk)}`);
    }
    shader.fragmentShader = fragment;
  };
  material.customProgramCacheKey = () => (paint ? "car-paint" : "car-shell");
  return material;
}

export function createCarMaterials(uniforms, paintHex) {
  const paint = patch(
    new THREE.MeshPhysicalMaterial({
      color: paintHex,
      metalness: 0.35,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.035,
      envMapIntensity: 1.25,
    }),
    uniforms,
    { paint: true }
  );

  const glass = new THREE.MeshPhysicalMaterial({
    color: "#050608",
    metalness: 0.2,
    roughness: 0.04,
    transparent: true,
    opacity: 0.8,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const trim = patch(
    new THREE.MeshPhysicalMaterial({
      color: "#050506",
      metalness: 0.4,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    }),
    uniforms
  );

  const under = patch(
    new THREE.MeshStandardMaterial({ color: "#0c0c0d", roughness: 0.85, metalness: 0.1 }),
    uniforms
  );

  // Inside faces of the body: door cards, kick panels, pillars.
  const shell = patch(
    new THREE.MeshStandardMaterial({ color: "#141416", roughness: 0.75, metalness: 0.05, side: THREE.BackSide }),
    uniforms
  );

  const hidden = new THREE.MeshBasicMaterial({ visible: false });

  return {
    paint,
    glass,
    trim,
    under,
    shell,
    exterior: [paint, glass, trim, under],
    interior: [shell, hidden, shell, shell],
    dispose() {
      [paint, glass, trim, under, shell, hidden].forEach((m) => m.dispose());
    },
  };
}
