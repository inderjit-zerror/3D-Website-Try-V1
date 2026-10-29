uniform vec3 uBase;
uniform vec3 uHot;
uniform float uOpacity;

varying float vEnergy;
varying float vCap;
varying vec3 vNormalV;

void main() {
  float light = 0.55 + 0.45 * max(dot(vNormalV, normalize(vec3(0.3, 0.8, 0.5))), 0.0);
  vec3 color = mix(uBase * light, uHot * 2.4, vEnergy * (0.35 + vCap * 0.65));
  gl_FragColor = vec4(color, uOpacity);
}
