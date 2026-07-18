/** Exponential moving average for angle / scalar streams */
export class EmaSmoother {
  private values = new Map<string, number>();

  constructor(private alpha = 0.28) {}

  next(key: string, value: number): number {
    if (!Number.isFinite(value)) {
      return this.values.get(key) ?? value;
    }
    const prev = this.values.get(key);
    if (prev === undefined || Number.isNaN(prev)) {
      this.values.set(key, value);
      return value;
    }
    // Reject single-frame spikes > 35° (or 0.25 for normalized signals)
    const delta = Math.abs(value - prev);
    const capped =
      delta > 35 && value > 1 ? prev + Math.sign(value - prev) * 35 : value;
    const smoothed = this.alpha * capped + (1 - this.alpha) * prev;
    this.values.set(key, smoothed);
    return smoothed;
  }

  reset() {
    this.values.clear();
  }
}

/** Smooth landmark xyz across frames to stabilize angles. */
export class LandmarkSmoother {
  private prev: { x: number; y: number; z: number; visibility: number }[] | null =
    null;

  constructor(private alpha = 0.45) {}

  next<T extends { x: number; y: number; z?: number; visibility?: number; presence?: number }>(
    landmarks: T[],
  ): T[] {
    if (!landmarks.length) return landmarks;
    if (!this.prev || this.prev.length !== landmarks.length) {
      this.prev = landmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z ?? 0,
        visibility: lm.visibility ?? 1,
      }));
      return landmarks;
    }

    const a = this.alpha;
    const out = landmarks.map((lm, i) => {
      const p = this.prev![i];
      const x = a * lm.x + (1 - a) * p.x;
      const y = a * lm.y + (1 - a) * p.y;
      const z = a * (lm.z ?? 0) + (1 - a) * p.z;
      const visibility =
        a * (lm.visibility ?? 1) + (1 - a) * p.visibility;
      p.x = x;
      p.y = y;
      p.z = z;
      p.visibility = visibility;
      return { ...lm, x, y, z, visibility };
    });
    return out;
  }

  reset() {
    this.prev = null;
  }
}
