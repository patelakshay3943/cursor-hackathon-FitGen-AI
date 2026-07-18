import type { Landmark } from "./landmarks";

/** Angle at point B formed by points A–B–C, in degrees [0, 180] */
export function angle3Point(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);
  if (magAB < 1e-6 || magCB < 1e-6) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Absolute difference between two angles */
export function angleDelta(a: number, b: number): number {
  return Math.abs(a - b);
}
