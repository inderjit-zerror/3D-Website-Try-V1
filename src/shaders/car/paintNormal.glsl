// Metallic flakes: jitter the base-layer normal only. The clearcoat keeps the
// unperturbed normal, so the sparkle sits underneath a glassy top coat.
{
  vec3 cell = floor(vCarPos * 900.0);
  vec3 jitter = carHash33(cell) * 2.0 - 1.0;
  float fade = 1.0 - smoothstep(0.0012, 0.0035, length(fwidth(vCarPos)));
  normal = normalize(normal + jitter * uFlake * fade);
}
