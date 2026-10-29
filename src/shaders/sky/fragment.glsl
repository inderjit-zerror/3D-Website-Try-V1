#pragma glslify: noise = require('../includes/noise.glsl')

uniform float uNight;
uniform float uTime;
uniform vec3 uDayTop;
uniform vec3 uDayHorizon;
uniform vec3 uNightTop;
uniform vec3 uNightHorizon;

varying vec3 vDir;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 dir = normalize(vDir);
  float h = clamp(dir.y, 0.0, 1.0);

  vec3 day = mix(uDayHorizon, uDayTop, pow(h, 0.55));
  // soft studio cyclorama falloff
  day *= 1.0 - 0.06 * smoothstep(0.2, 1.0, h);

  vec3 night = mix(uNightHorizon, uNightTop, pow(h, 0.4));

  // stars: one candidate per cell, twinkling at their own pace
  vec3 sp = dir * 260.0;
  vec3 cell = floor(sp);
  float r = hash13(cell);
  float d = length(fract(sp) - 0.5);
  float star = step(0.986, r) * smoothstep(0.32, 0.0, d);
  float twinkle = 0.55 + 0.45 * sin(uTime * (1.5 + r * 3.0) + r * 60.0);
  night += vec3(0.85, 0.9, 1.0) * star * twinkle * smoothstep(0.04, 0.35, h) * 2.2;

  // drifting haze and a distant city glow hovering just above the horizon.
  // Both fade to zero at h = 0 so the sky meets the fogged floor seamlessly.
  float lift = smoothstep(0.0, 0.06, h);
  float haze = noise(vec3(dir.xz * 3.0, uTime * 0.02)) * 0.5 + 0.5;
  night += vec3(0.04, 0.07, 0.16) * haze * smoothstep(0.45, 0.0, h) * 0.6 * lift;
  night += vec3(0.08, 0.13, 0.3) * exp(-abs(dir.y - 0.05) * 14.0) * 0.45 * lift;

  gl_FragColor = vec4(mix(day, night, uNight), 1.0);
  #include <colorspace_fragment>
}
