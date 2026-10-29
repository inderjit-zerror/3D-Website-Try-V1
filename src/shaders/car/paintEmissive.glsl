// Glowing leading edge of the repaint sweep and of the x-ray scan line.
float sweepEdge = (1.0 - smoothstep(0.0, 0.035, abs(sweepCoord - uSweep))) * step(0.005, uSweep) * step(uSweep, 1.04);
totalEmissiveRadiance += sweepEdge * mix(vec3(1.0), diffuse, 0.35) * 3.0;
float scanEdge = (1.0 - smoothstep(0.0, 0.03, carScanY() - vCarPos.y)) * step(0.001, uXray) * step(uXray, 0.995);
totalEmissiveRadiance += scanEdge * vec3(0.35, 0.75, 1.0) * 6.0;
