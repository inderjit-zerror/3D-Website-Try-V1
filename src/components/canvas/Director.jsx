"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createStoryState, sampleStory } from "@/lib/story";
import { runtime, useStore } from "@/lib/store";
import { OVERLAY_LAYER } from "@/lib/layers";

const damp = THREE.MathUtils.damp;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Runs first every frame: turns scroll, pointer, drag and time-of-day input
 * into the camera pose and the shared `runtime.story` values every other
 * scene component reads.
 */
export default function Director({ car, debug = false }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => camera.layers.enable(OVERLAY_LAYER), [camera]);

  const state = useMemo(
    () => ({
      story: createStoryState(),
      cam: new THREE.Vector3(),
      look: new THREE.Vector3(),
      forward: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      pointer: new THREE.Vector2(),
      lastDrive: 0,
    }),
    []
  );

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = frame.clock.elapsedTime;
    const { story, cam, look, forward, right, up, pointer } = state;

    runtime.chapterSmooth = damp(runtime.chapterSmooth, runtime.chapter, 7, dt);
    runtime.night = damp(runtime.night, useStore.getState().timeOfDay, 3.4, dt);
    pointer.x = damp(pointer.x, runtime.pointer.x, 3, dt);
    pointer.y = damp(pointer.y, runtime.pointer.y, 3, dt);

    const aspect = size.width / size.height;
    const zoom = aspect < 1 ? 1.12 + (1 - aspect) * 2.5 : aspect < 1.35 ? 1 + (1.35 - aspect) * 0.4 : 1;
    sampleStory(runtime.chapterSmooth, story, zoom);

    // configurator: rotation sticks; elsewhere the car eases back to its pose
    const f = runtime.chapterSmooth;
    const configuring = f > 4.7 && f < 5.75;
    const drag = runtime.drag;
    if (!drag.active && !configuring) drag.target = damp(drag.target, 0, 2.2, dt);
    drag.value = damp(drag.value, drag.target, 6, dt);

    Object.assign(runtime.story, {
      airflow: story.airflow,
      speed: story.speed,
      xray: story.xray,
      interior: story.interior,
      drive: story.drive,
      steer: story.steer,
      exterior: story.ext,
      backdrop: story.backdrop,
    });

    if (car.current) {
      car.current.rotation.y = story.rot + drag.value + Math.sin(t * 0.25) * 0.04 * story.backdrop;
      car.current.position.x = story.drive;
    }
    runtime.velocity = dt > 0 ? (story.drive - state.lastDrive) / dt : 0;
    state.lastDrive = story.drive;

    if (debug) return;

    cam.fromArray(story.cam);
    look.fromArray(story.look);

    // intro: swing in from wide and low
    const intro = easeOutCubic(runtime.intro);
    if (intro < 1) {
      const dx = cam.x - look.x;
      const dz = cam.z - look.z;
      const az = Math.atan2(dz, dx) + (1 - intro) * 1.15;
      const r = Math.hypot(dx, dz) * (1 + (1 - intro) * 0.9);
      cam.set(look.x + Math.cos(az) * r, cam.y - (1 - intro) * 0.55, look.z + Math.sin(az) * r);
    }

    forward.subVectors(look, cam).normalize();
    right.crossVectors(forward, THREE.Object3D.DEFAULT_UP).normalize();
    up.crossVectors(right, forward);

    // pointer parallax outside, gentle look-around inside the cabin
    const ext = story.ext;
    cam.addScaledVector(right, pointer.x * 0.32 * ext).addScaledVector(up, -pointer.y * 0.16 * ext);
    look.addScaledVector(right, pointer.x * 0.55 * (1 - ext)).addScaledVector(up, -pointer.y * 0.3 * (1 - ext));

    // engine-less rumble at speed
    const shake = story.speed * 0.006;
    cam.x += Math.sin(t * 41) * shake;
    cam.y += Math.sin(t * 53 + 1.3) * shake;

    camera.position.copy(cam);
    camera.lookAt(look);
    camera.fov = story.fov;

    // lens shift: on portrait screens the copy sits below, so lift the car
    const portrait = aspect < 1;
    const shiftX = portrait ? 0 : story.shiftX;
    const shiftY = portrait ? 0.11 * ext : story.shiftY;
    camera.setViewOffset(size.width, size.height, -shiftX * size.width, shiftY * size.height, size.width, size.height);
    camera.updateProjectionMatrix();
  });

  return null;
}
