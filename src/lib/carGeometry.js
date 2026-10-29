import * as THREE from "three";

/**
 * Procedural sedan body inspired by the Model S silhouette.
 *
 * The body is a loft: a cross-section ring is swept along the car's length
 * (front points to +X, up is +Y, right is +Z). Each station along X has its
 * own width, rocker height, shoulder height and roof height, all driven by
 * monotone splines so the surface stays smooth with no overshoot.
 *
 * The ring is split in three parts:
 *   lower right  (bottom centre -> right shoulder)
 *   upper        (right shoulder -> roof centre -> left shoulder)
 *   lower left   (left shoulder -> bottom centre)
 * Quads are assigned to material groups (paint / glass / trim / underbody),
 * so the greenhouse, pillars and seals come out of the same smooth surface.
 */

export const CAR = {
  rear: -2.36,
  front: 2.38,
  halfWidth: 0.945,
  wheelRadius: 0.355,
  wheelFrontX: 1.47,
  wheelRearX: -1.43,
  track: 0.84,
  archRadius: 0.418,
  archInner: 0.5,
  windshieldX: 1.13,
  rearGlassX: -1.98,
};

export const LENGTH = CAR.front - CAR.rear;

export const MAT = { PAINT: 0, GLASS: 1, TRIM: 2, UNDER: 3 };

const NA = 36; // segments on each lower side
const NB = 100; // segments across the upper surface
const RING = NA * 2 + NB;

const A_S = 0.5; // shoulder angle on the side superellipse
const EXP_BOTTOM = 0.34; // 2/n for the boxy bottom corner
const EXP_SIDE = 0.62; // 2/n for the upper side
const SHOULDER_RATIO = Math.pow(Math.cos(A_S), EXP_SIDE);
const TUMBLE = 0.62; // greenhouse tumblehome

const RAIL_IN = 0.4; // |2b-1| range that becomes the roof rail
const RAIL_OUT = 0.44;
const SEAL = 0.98; // belt seal under the side glass

/* ------------------------------------------------------------------ math */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const gauss = (d, s) => Math.exp(-(d * d) / (s * s));

/** Monotone cubic (Fritsch–Carlson) through [x, y] pairs. */
function monotone(points) {
  const n = points.length;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const d = [];
  for (let k = 0; k < n - 1; k++) d.push((ys[k + 1] - ys[k]) / (xs[k + 1] - xs[k]));
  const m = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let k = 1; k < n - 1; k++) m[k] = d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2;
  for (let k = 0; k < n - 1; k++) {
    if (d[k] === 0) {
      m[k] = 0;
      m[k + 1] = 0;
      continue;
    }
    const a = m[k] / d[k];
    const b = m[k + 1] / d[k];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[k] = t * a * d[k];
      m[k + 1] = t * b * d[k];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
}

/* -------------------------------------------------------------- profiles */

// rocker / bumper underside
const yLow = monotone([
  [-2.36, 0.47], [-2.3, 0.38], [-2.15, 0.3], [-1.9, 0.235], [-1.55, 0.2],
  [-1.0, 0.185], [1.1, 0.185], [1.75, 0.2], [2.05, 0.225], [2.25, 0.27],
  [2.34, 0.33], [2.38, 0.37],
]);

// shoulder: trunk edge -> beltline -> hood edge
const yHi = monotone([
  [-2.36, 0.72], [-2.32, 0.86], [-2.24, 0.945], [-2.1, 0.98], [-1.7, 0.985],
  [-1.0, 0.97], [-0.3, 0.95], [0.4, 0.93], [1.0, 0.9], [1.3, 0.875],
  [1.7, 0.825], [2.0, 0.765], [2.2, 0.7], [2.32, 0.62], [2.38, 0.52],
]);

// centreline: deck -> rear glass -> roof -> windshield -> hood -> nose
const yTop = monotone([
  [-2.36, 0.74], [-2.33, 0.88], [-2.26, 0.985], [-2.14, 1.03], [-1.98, 1.045],
  [-1.6, 1.17], [-1.1, 1.31], [-0.6, 1.39], [-0.15, 1.418], [0.2, 1.405],
  [0.55, 1.31], [0.9, 1.12], [1.13, 0.965], [1.3, 0.935], [1.7, 0.885],
  [2.0, 0.82], [2.2, 0.75], [2.32, 0.655], [2.38, 0.535],
]);

export function halfWidth(x) {
  const u = (x - CAR.rear) / LENGTH;
  const e = Math.abs(2 * u - 1);
  const base = Math.pow(Math.max(0, 1 - Math.pow(e, 4.2)), 1 / 4.2);
  const fenders =
    0.022 * gauss(x - CAR.wheelFrontX, 0.5) +
    0.034 * gauss(x - CAR.wheelRearX, 0.55) -
    0.012 * gauss(x + 0.1, 0.7);
  return CAR.halfWidth * base * (1 + fenders);
}

export function station(x) {
  const hi = yHi(x);
  return {
    x,
    w: halfWidth(x),
    lo: yLow(x),
    hi,
    H: Math.max(0, yTop(x) - hi),
  };
}

/* ------------------------------------------------------- cross-sections */

/** a: 0 = bottom centre, 1 = shoulder. Returns [z, y] on the right side. */
function lowerPoint(a, st) {
  const yC = st.lo + 0.56 * (st.hi - st.lo);
  const alpha = -Math.PI / 2 + a * (Math.PI / 2 + A_S);
  const c = Math.max(0, Math.cos(alpha));
  const s = Math.sin(alpha);
  if (alpha < 0) {
    return [st.w * Math.pow(c, EXP_BOTTOM), yC - (yC - st.lo) * Math.pow(-s, EXP_BOTTOM)];
  }
  const hu = (st.hi - yC) / Math.pow(Math.sin(A_S), EXP_SIDE);
  return [st.w * Math.pow(c, EXP_SIDE), yC + hu * Math.pow(s, EXP_SIDE)];
}

function upperExponent(H) {
  return lerp(0.5, 0.82, smoothstep(0.06, 0.34, H));
}

/** b: 0 = right shoulder, 0.5 = roof centre, 1 = left shoulder. */
function upperPoint(b, st) {
  const sign = b < 0.5 ? 1 : -1;
  const bb = Math.abs(2 * b - 1);
  const gamma = ((1 - bb) * Math.PI) / 2;
  const m = upperExponent(st.H);
  const cs = Math.pow(Math.max(0, Math.cos(gamma)), m);
  const sn = Math.pow(Math.max(0, Math.sin(gamma)), m);
  const wSh = st.w * SHOULDER_RATIO;
  return [sign * (wSh - TUMBLE * st.H * sn) * cs, st.hi + st.H * sn];
}

function ringPoint(j, st) {
  if (j <= NA) return lowerPoint(j / NA, st);
  if (j <= NA + NB) return upperPoint((j - NA) / NB, st);
  const [z, y] = lowerPoint(1 - (j - NA - NB) / NA, st);
  return [-z, y];
}

/* -------------------------------------------------------- materials map */

const GH = {
  sail: 0.93, // front quarter trim (mirror sail)
  header: [0.16, 0.26], // windshield header bar
  rearHeader: [-0.98, -0.9],
  bPillar: [-0.3, -0.18],
  divider: [-1.34, -1.26],
  cPillar: -1.7,
};

const inRange = (v, r) => v >= r[0] && v <= r[1];

function upperMaterial(x, bb) {
  if (x > CAR.windshieldX || x < CAR.rearGlassX) return MAT.PAINT;
  if (bb >= RAIL_IN && bb <= RAIL_OUT) return MAT.TRIM;
  if (bb > RAIL_OUT) {
    // side glass band
    if (bb >= SEAL) return MAT.TRIM;
    if (x > GH.sail) return MAT.TRIM;
    if (x < GH.cPillar) return MAT.PAINT;
    if (inRange(x, GH.bPillar) || inRange(x, GH.divider)) return MAT.TRIM;
    return MAT.GLASS;
  }
  // windshield / roof / backlight
  if (inRange(x, GH.header) || inRange(x, GH.rearHeader)) return MAT.TRIM;
  return MAT.GLASS;
}

function quadMaterial(xm, j) {
  if (j < NA) return (j + 0.5) / NA < 0.28 ? MAT.UNDER : MAT.PAINT;
  if (j < NA + NB) {
    const b = (j - NA + 0.5) / NB;
    return upperMaterial(xm, Math.abs(2 * b - 1));
  }
  const a = 1 - (j - NA - NB + 0.5) / NA;
  return a < 0.28 ? MAT.UNDER : MAT.PAINT;
}

/* ------------------------------------------------------------- stations */

function stationList(count = 260) {
  const xs = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    // cosine spacing: dense at the nose and tail where curvature is highest
    const u = 0.5 - 0.5 * Math.cos(Math.PI * t);
    xs.push(CAR.rear + LENGTH * lerp(t, u, 0.6));
  }
  const breaks = [
    CAR.windshieldX, CAR.rearGlassX, GH.sail, GH.cPillar,
    ...GH.header, ...GH.rearHeader, ...GH.bPillar, ...GH.divider,
  ];
  const merged = xs.filter((x) => breaks.every((b) => Math.abs(x - b) > 0.006));
  return [...merged, ...breaks].sort((a, b) => a - b);
}

/* ----------------------------------------------------------- geometry */

export function buildBodyGeometry() {
  const xs = stationList();
  const N = xs.length;
  const positions = new Float32Array(N * RING * 3);
  const uvs = new Float32Array(N * RING * 2);

  for (let i = 0; i < N; i++) {
    const st = station(xs[i]);
    for (let j = 0; j < RING; j++) {
      const [z, y] = ringPoint(j, st);
      const k = i * RING + j;
      positions[k * 3] = xs[i];
      positions[k * 3 + 1] = y;
      positions[k * 3 + 2] = z;
      uvs[k * 2] = (xs[i] - CAR.rear) / LENGTH;
      uvs[k * 2 + 1] = j / RING;
    }
  }

  const buckets = [[], [], [], []];
  for (let i = 0; i < N - 1; i++) {
    const xm = (xs[i] + xs[i + 1]) / 2;
    for (let j = 0; j < RING; j++) {
      const j2 = (j + 1) % RING;
      const a = i * RING + j;
      const b = (i + 1) * RING + j;
      const c = (i + 1) * RING + j2;
      const d = i * RING + j2;
      const bucket = buckets[quadMaterial(xm, j)];
      bucket.push(a, b, d, b, c, d);
    }
  }

  const total = buckets.reduce((s, b) => s + b.length, 0);
  const index = new Uint32Array(total);
  const geometry = new THREE.BufferGeometry();
  let offset = 0;
  buckets.forEach((bucket, materialIndex) => {
    index.set(bucket, offset);
    geometry.addGroup(offset, bucket.length, materialIndex);
    offset += bucket.length;
  });

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/* ------------------------------------------------------ surface queries */

/** Height of the upper surface at lateral offset |z| (shoulder height beyond it). */
export function topHeightAt(x, zAbs) {
  const st = station(x);
  const wSh = st.w * SHOULDER_RATIO;
  if (st.w < 1e-4) return null;
  if (zAbs >= wSh) return st.hi;
  let lo = 0;
  let hi = 0.5;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    const [z] = upperPoint(mid, st);
    if (z > zAbs) lo = mid;
    else hi = mid;
  }
  return upperPoint((lo + hi) / 2, st)[1];
}

/** Half width of the lower body at height y (0 if y is outside the side). */
export function sideWidthAt(x, y) {
  const st = station(x);
  if (y < st.lo || y > st.hi || st.w < 1e-4) return 0;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (lowerPoint(mid, st)[1] < y) lo = mid;
    else hi = mid;
  }
  return lowerPoint((lo + hi) / 2, st)[0];
}

export { yLow, yHi, yTop, smoothstep, lerp, clamp };
