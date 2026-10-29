import { useEffect } from "react";

/**
 * Layer for things the main camera should see but the contact-shadow and
 * floor-reflection passes should not (cabin parts, overlays). Those passes
 * render with depth testing off, so anything drawn inside the car would
 * otherwise punch light holes into the shadow.
 */
export const OVERLAY_LAYER = 1;

export function useOverlayLayer(ref) {
  useEffect(() => {
    ref.current?.traverse((o) => o.layers.set(OVERLAY_LAYER));
  });
}
