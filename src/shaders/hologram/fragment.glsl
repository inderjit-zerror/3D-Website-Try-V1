uniform float uTime;
uniform float uXray;
uniform vec3 uColor;
uniform vec4 uArchFront;
uniform vec4 uArchRear;

varying vec3 vPos;
varying vec3 vNormalW;
varying vec3 vViewDir;

float gridLine(float v) {
  float w = fwidth(v) * 1.2;
  return 1.0 - smoothstep(0.0, w, abs(fract(v - 0.5) - 0.5));
}

void main() {
  bool inArch = length(vPos.xy - uArchFront.xy) < uArchFront.z || length(vPos.xy - uArchRear.xy) < uArchRear.z;
  if (abs(vPos.z) > uArchFront.w && inArch) discard;

  // only where the paint has already been scanned away
  float scanY = mix(1.6, -0.05, uXray);
  float revealed = smoothstep(scanY - 0.01, scanY + 0.04, vPos.y);

  float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 2.2);
  float grid = max(gridLine(vPos.x * 8.0), gridLine(vPos.y * 8.0)) * 0.35;
  float scan = pow(sin(vPos.y * 90.0 - uTime * 3.0) * 0.5 + 0.5, 8.0) * 0.18;

  float alpha = (fresnel * 0.85 + grid + scan + 0.03) * revealed * uXray;
  gl_FragColor = vec4(uColor * (0.7 + fresnel * 1.8), clamp(alpha, 0.0, 1.0));
}
