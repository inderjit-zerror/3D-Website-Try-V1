attribute float aSeed;

varying vec2 vUv;
varying float vSeed;

void main() {
  vUv = uv;
  vSeed = aSeed;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
