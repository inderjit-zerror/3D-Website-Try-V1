uniform float uTime;
uniform float uReveal;

varying float vEnergy;
varying float vCap;
varying vec3 vNormalV;

void main() {
  vec3 cell = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

  // cells rise into place from the rear of the pack to the front
  float front = mix(-1.6, 1.6, uReveal);
  float grow = smoothstep(cell.x - 0.35, cell.x, front);

  vec3 p = position;
  p.y = (p.y + 0.035) * grow - 0.035;

  // an energy wave travels towards the motors
  float wave = sin(cell.x * 3.2 - uTime * 2.6 + sin(cell.z * 6.0) * 0.6);
  vEnergy = smoothstep(0.2, 1.0, wave) * grow;
  vCap = step(0.03, position.y);
  vNormalV = normalize(normalMatrix * mat3(instanceMatrix) * normal);

  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}
