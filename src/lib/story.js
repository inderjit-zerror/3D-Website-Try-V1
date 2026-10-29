/**
 * Camera + scene keyframes, indexed by chapter position.
 *
 * Every chapter section spans one unit of scroll: at `n.0` its sticky panel
 * has just pinned, by `n.5` it starts handing over to the next chapter.
 * Exterior shots are interpolated around the look-at point (azimuth, radius,
 * height) so the camera always orbits the car instead of cutting through it;
 * shots that involve the cabin are interpolated in straight lines.
 */

// shiftX / shiftY move the car on screen (fraction of the viewport) with a
// lens shift, so the layout can make room for copy without changing the
// perspective.
const BASE = {
  airflow: 0, speed: 0, xray: 0, interior: 0, drive: 0, steer: 0, backdrop: 0,
  rot: 0, fov: 30, ext: 1, shiftX: 0, shiftY: 0,
};

const key = (at, cam, look, extra = {}) => ({ ...BASE, at, cam, look, ...extra });

export const KEYS = [
  // Prologue: front three-quarter hero, wheels turned in
  key(0.0, [6.6, 1.35, 6.0], [0.1, 0.62, 0], { steer: 0.24, backdrop: 1, shiftX: -0.02, shiftY: -0.13 }),
  key(0.42, [5.8, 1.15, 5.2], [0.0, 0.6, 0], { steer: 0.24, backdrop: 0.6, shiftX: -0.02, shiftY: -0.1 }),
  // Form: pure side profile, air made visible
  key(1.0, [0.2, 0.9, 10.4], [0.0, 0.8, 0], { airflow: 1, fov: 27, shiftX: 0.08, shiftY: -0.06 }),
  key(1.45, [-0.5, 0.85, 10.0], [0.0, 0.8, 0], { airflow: 1, fov: 27, shiftX: 0.08, shiftY: -0.06 }),
  // Power: low, wide and fast
  key(2.0, [5.6, 0.42, 2.7], [0.2, 0.58, -0.25], { speed: 1, fov: 36, shiftX: 0.17, shiftY: 0.02 }),
  key(2.45, [5.1, 0.36, 2.2], [0.0, 0.58, -0.2], { speed: 1, fov: 38, shiftX: 0.17, shiftY: 0.02 }),
  // Energy: the car turns nose-up under a top-down camera, x-raying the pack
  key(3.0, [-0.4, 11.2, 2.6], [0.0, 0.2, 0.1], { xray: 1, fov: 32, rot: Math.PI / 2, shiftX: 0.06 }),
  key(3.45, [-0.3, 10.4, 2.0], [0.0, 0.2, 0.1], { xray: 1, fov: 32, rot: Math.PI / 2, shiftX: 0.06 }),
  // Sanctuary: through the glass roof into the driver's seat, then the rear
  key(4.0, [-0.46, 1.17, -0.28], [1.5, 0.9, 0.02], { interior: 1, fov: 52, ext: 0, shiftX: 0.15 }),
  key(4.45, [-1.02, 1.1, 0.02], [1.2, 0.86, -0.08], { interior: 1, fov: 55, ext: 0, shiftX: 0.12 }),
  // Yours: studio three-quarter, wheels turned, free rotation
  key(5.0, [5.9, 1.8, -7.8], [0, 0.55, 0], { steer: 0.2, shiftX: -0.1, shiftY: -0.15 }),
  key(5.5, [5.9, 1.8, -7.8], [0, 0.55, 0], { steer: 0.2, shiftX: -0.1, shiftY: -0.15 }),
  // Horizon: rear three-quarter, then it drives into the distance
  key(6.0, [-8.6, 1.3, 5.8], [0.2, 0.62, 0], { shiftY: -0.27 }),
  key(6.25, [-8.6, 1.3, 5.8], [0.4, 0.62, 0], { shiftY: -0.27 }),
  key(7.0, [-6.9, 1.4, 4.2], [5.0, 0.6, 0], { drive: 22, shiftY: -0.16 }),
];

const NUMERIC = Object.keys(BASE);

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function toOrbit(cam, look) {
  const dx = cam[0] - look[0];
  const dz = cam[2] - look[2];
  return { az: Math.atan2(dz, dx), r: Math.hypot(dx, dz), y: cam[1] - look[1] };
}

/**
 * Samples the keyframes at chapter position `f`, writing into `out`.
 * `zoom` pushes exterior shots back on narrow (portrait) screens.
 */
export function sampleStory(f, out, zoom = 1) {
  let i = 0;
  while (i < KEYS.length - 2 && f > KEYS[i + 1].at) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const raw = Math.min(1, Math.max(0, (f - a.at) / (b.at - a.at)));
  const t = easeInOut(raw);

  for (const k of NUMERIC) out[k] = a[k] + (b[k] - a[k]) * t;

  const look = [0, 1, 2].map((n) => a.look[n] + (b.look[n] - a.look[n]) * t);
  out.look[0] = look[0];
  out.look[1] = look[1];
  out.look[2] = look[2];

  const zA = a.ext ? zoom : 1;
  const zB = b.ext ? zoom : 1;
  if (a.ext && b.ext) {
    const oa = toOrbit(a.cam, a.look);
    const ob = toOrbit(b.cam, b.look);
    let dAz = ob.az - oa.az;
    if (dAz > Math.PI) dAz -= Math.PI * 2;
    if (dAz < -Math.PI) dAz += Math.PI * 2;
    const az = oa.az + dAz * t;
    const r = (oa.r + (ob.r - oa.r) * t) * zoom;
    const y = (oa.y + (ob.y - oa.y) * t) * zoom;
    out.cam[0] = look[0] + Math.cos(az) * r;
    out.cam[1] = look[1] + y;
    out.cam[2] = look[2] + Math.sin(az) * r;
  } else {
    for (let n = 0; n < 3; n++) {
      const ca = a.look[n] + (a.cam[n] - a.look[n]) * zA;
      const cb = b.look[n] + (b.cam[n] - b.look[n]) * zB;
      out.cam[n] = ca + (cb - ca) * t;
    }
  }
  return out;
}

export function createStoryState() {
  return { ...BASE, cam: [0, 0, 0], look: [0, 0, 0] };
}
