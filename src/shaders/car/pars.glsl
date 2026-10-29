// Shared declarations injected into every car body material.
varying vec3 vCarPos;
varying vec3 vCarNormal;

uniform vec4 uArchFront;   // x, y, radius, inner |z|
uniform vec4 uArchRear;
uniform float uXray;       // 0 -> 1 top-down dissolve into the x-ray view
uniform vec3 uPrevColor;   // colour before the current repaint sweep
uniform float uSweep;      // repaint progress, front (0) to rear (1)
uniform vec2 uSpan;        // front x, overall length
uniform float uFlake;      // metallic flake strength

vec3 carHash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

float seamLine(float coord, float center, float halfWidth) {
  float aa = fwidth(coord) * 1.25 + 1e-5;
  return 1.0 - smoothstep(halfWidth, halfWidth + aa, abs(coord - center));
}

// Panel shut lines in object space: doors, sill, hood and trunk.
float carSeams(vec3 p, vec3 n) {
  float side = smoothstep(0.55, 0.8, abs(n.z));
  float top = smoothstep(0.6, 0.85, n.y);
  float band = step(0.24, p.y) * step(p.y, 0.95);
  float doors = band * step(-1.0, p.x) * step(p.x, 1.03);

  float s = 0.0;
  s += side * band * (seamLine(p.x, 1.03, 0.0015) + seamLine(p.x, -0.22, 0.0015) + seamLine(p.x, -1.0, 0.0015));
  s += side * doors * seamLine(p.y, 0.262, 0.0015);
  s += top * seamLine(p.x, 1.2, 0.0015) * step(abs(p.z), 0.78);
  s += top * seamLine(abs(p.z), 0.7, 0.0015) * step(1.2, p.x) * step(p.x, 2.22);
  s += top * seamLine(abs(p.z), 0.72, 0.0015) * step(p.x, -1.98) * step(-2.28, p.x);
  return clamp(s, 0.0, 1.0);
}

float archLip(vec3 p) {
  float inner = step(uArchFront.w, abs(p.z));
  float f = length(p.xy - uArchFront.xy) - uArchFront.z;
  float r = length(p.xy - uArchRear.xy) - uArchRear.z;
  float d = min(f, r);
  return inner * (1.0 - smoothstep(0.0, 0.014, d));
}

float carScanY() {
  return mix(1.6, -0.05, uXray);
}
