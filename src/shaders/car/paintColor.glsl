// Repaint sweep: the new colour washes over the body from nose to tail.
float sweepCoord = (uSpan.x - vCarPos.x) / uSpan.y + 0.035 * sin(vCarPos.y * 7.0 + vCarPos.z * 4.0);
float sweepMask = smoothstep(uSweep - 0.015, uSweep + 0.015, sweepCoord);
vec3 paintColor = mix(diffuse, uPrevColor, sweepMask);
float seams = carSeams(vCarPos, normalize(vCarNormal));
float lip = archLip(vCarPos);
paintColor *= (1.0 - 0.85 * seams) * (1.0 - 0.55 * lip);
vec4 diffuseColor = vec4(paintColor, opacity);
