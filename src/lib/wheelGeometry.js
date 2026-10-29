import * as THREE from "three";

/**
 * Wheel parts are modelled with their axle on +Z and the outer face at +Z,
 * so a right-hand wheel can be used as-is and a left-hand one mirrored.
 */

export const TIRE = { outer: 0.355, inner: 0.262, halfWidth: 0.122 };

/** Tyre: lathe of a rounded rectangle with a slight sidewall bulge. */
export function buildTireGeometry() {
  const { outer, inner, halfWidth } = TIRE;
  const corner = 0.045;
  const pts = [];
  const push = (r, y) => pts.push(new THREE.Vector2(r, y));

  push(inner, -halfWidth + 0.004);
  // inner sidewall, slight bulge
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    const r = THREE.MathUtils.lerp(inner, outer - corner, t);
    push(r, -halfWidth - Math.sin(t * Math.PI) * 0.008);
  }
  // shoulder -> tread -> shoulder
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2);
    push(outer - corner + Math.cos(a) * corner, -halfWidth + corner + Math.sin(a) * corner);
  }
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    push(outer - corner + Math.cos(a) * corner, halfWidth - corner + Math.sin(a) * corner);
  }
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    const r = THREE.MathUtils.lerp(outer - corner, inner, t);
    push(r, halfWidth + Math.sin(t * Math.PI) * 0.008);
  }
  push(inner, halfWidth - 0.004);

  const geometry = new THREE.LatheGeometry(pts, 96);
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function holeShape(r0, r1, a0, a1, twist) {
  const path = new THREE.Path();
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const a = THREE.MathUtils.lerp(a0, a1, i / steps);
    const x = Math.cos(a) * r1;
    const y = Math.sin(a) * r1;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  for (let i = 0; i <= steps; i++) {
    const a = THREE.MathUtils.lerp(a1, a0, i / steps) + twist;
    const spread = 1 - 0.35 * Math.sin((i / steps) * Math.PI);
    const mid = (a0 + a1) / 2 + twist;
    path.lineTo(Math.cos(mid + (a - mid) * spread) * r0, Math.sin(mid + (a - mid) * spread) * r0);
  }
  path.closePath();
  return path;
}

const RIMS = {
  // ten slim, twisted spokes
  arachnid: { spokes: 10, r0: 0.085, r1: 0.232, gap: 0.62, twist: 0.22, dish: 0.03 },
  // five broad aero spokes with narrow slots
  tempest: { spokes: 5, r0: 0.11, r1: 0.215, gap: 0.42, twist: -0.12, dish: 0.012 },
};

/** Rim face: extruded disc with spoke cut-outs, dished towards the hub. */
export function buildRimGeometry(style = "arachnid") {
  const cfg = RIMS[style];
  const radius = TIRE.inner + 0.002;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  const step = (Math.PI * 2) / cfg.spokes;
  for (let i = 0; i < cfg.spokes; i++) {
    const center = i * step + step / 2;
    const half = (step * cfg.gap) / 2;
    shape.holes.push(holeShape(cfg.r0, cfg.r1, center - half, center + half, cfg.twist));
  }
  const hub = new THREE.Path();
  hub.absarc(0, 0, 0.032, 0, Math.PI * 2, true);
  shape.holes.push(hub);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.005,
    bevelSegments: 3,
    curveSegments: 64,
  });
  // dish the face: hub sits proud, rim edge recessed
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i)) / radius;
    pos.setZ(i, pos.getZ(i) + cfg.dish * (1 - r * r));
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function buildBarrelGeometry() {
  const geometry = new THREE.CylinderGeometry(TIRE.inner, TIRE.inner, TIRE.halfWidth * 2 - 0.02, 64, 1, true);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function buildDiscGeometry() {
  const geometry = new THREE.CylinderGeometry(0.19, 0.19, 0.026, 64);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}
