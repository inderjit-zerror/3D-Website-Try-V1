uniform float uDistance;
uniform float uSpeed;
uniform float uNight;
uniform vec3 uDayColor;
uniform vec3 uNightColor;

varying vec3 vWorld;

float hash11(float n) {
  return fract(sin(n * 127.1) * 43758.5453);
}

void main() {
  vec2 p = vWorld.xz;

  // lanes of light streaks rushing backwards past the car
  float laneWidth = 0.22;
  float lane = floor(p.y / laneWidth);
  float rnd = hash11(lane);
  float speed = 0.8 + rnd * 0.7;
  float period = 3.0 + rnd * 6.0;
  float x = p.x + uDistance * speed + rnd * 37.0;
  float seg = fract(x / period);
  float streak = smoothstep(0.0, 0.03, seg) * (1.0 - smoothstep(0.03, 0.45 + rnd * 0.3, seg));
  float across = abs(fract(p.y / laneWidth) - 0.5);
  float thin = 1.0 - smoothstep(0.02, 0.02 + fwidth(p.y / laneWidth) * 1.5, across);
  float keep = step(0.45, rnd);

  float fade = 1.0 - smoothstep(3.0, 13.0, length(p));
  float underCar = smoothstep(0.92, 1.25, abs(p.y)) + step(2.6, abs(p.x));

  float a = streak * thin * keep * fade * clamp(underCar, 0.0, 1.0) * uSpeed;
  vec3 color = mix(uDayColor, uNightColor, uNight);
  gl_FragColor = vec4(color, a * mix(0.55, 1.0, uNight));
}
