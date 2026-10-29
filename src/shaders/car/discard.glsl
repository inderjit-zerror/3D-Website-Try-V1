// Wheel arch cut-outs and the x-ray scan dissolve.
{
  vec2 dFront = vCarPos.xy - uArchFront.xy;
  vec2 dRear = vCarPos.xy - uArchRear.xy;
  bool inArch = dot(dFront, dFront) < uArchFront.z * uArchFront.z || dot(dRear, dRear) < uArchRear.z * uArchRear.z;
  if (abs(vCarPos.z) > uArchFront.w && inArch) discard;
  if (uXray > 0.001 && vCarPos.y > carScanY()) discard;
}
