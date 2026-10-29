uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;

varying vec2 vUv;
varying float vSeed;

void main() {
  // comets travelling nose -> tail: a bright head with a long fading tail
  float s = vUv.x * (3.0 + vSeed * 2.0) - uTime * (0.45 + vSeed * 0.35) + vSeed * 13.0;
  float comet = pow(fract(s), 5.0);
  float line = 0.08;
  float ends = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.86, 1.0, vUv.x));
  float a = (comet + line) * ends * uOpacity;
  gl_FragColor = vec4(uColor * (0.6 + comet * 1.6), a);
}
