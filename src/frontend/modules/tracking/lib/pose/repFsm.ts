/**
 * Dual-threshold phase machine with minimum dwell time.
 * Prevents double-reps and bounce-count from noisy angles.
 */
export class AngleRepFsm {
  phase: "idle" | "down" | "up" = "idle";
  private reachedExtreme = false;
  private dwellMs = 0;
  private cooldownMs = 0;

  constructor(
    private opts: {
      /** Enter "down/flexed" when angle goes below this */
      downEnter: number;
      /** Count complete when angle rises above this after depth */
      upEnter: number;
      /** Must reach this (or below) at bottom to count */
      depthGood: number;
      /** Min ms spent in down before allowing stand-up count */
      minDownMs?: number;
      /** Min ms between completed reps */
      cooldownMs?: number;
      /** If true, "down" means smaller angle (curl/squat/press). Default true. */
      smallerIsDown?: boolean;
    },
  ) {}

  reset() {
    this.phase = "idle";
    this.reachedExtreme = false;
    this.dwellMs = 0;
    this.cooldownMs = 0;
  }

  /**
   * @returns whether a rep completed this frame
   */
  update(angle: number, dtMs: number): {
    repCompleted: boolean;
    shallow: boolean;
  } {
    const minDown = this.opts.minDownMs ?? 120;
    const cool = this.opts.cooldownMs ?? 280;
    const smallerIsDown = this.opts.smallerIsDown !== false;

    if (this.cooldownMs > 0) {
      this.cooldownMs = Math.max(0, this.cooldownMs - dtMs);
    }

    const isDown = smallerIsDown
      ? angle < this.opts.downEnter
      : angle > this.opts.downEnter;
    const isUp = smallerIsDown
      ? angle > this.opts.upEnter
      : angle < this.opts.upEnter;
    const atDepth = smallerIsDown
      ? angle <= this.opts.depthGood
      : angle >= this.opts.depthGood;

    let repCompleted = false;
    let shallow = false;

    if (this.phase === "idle" || this.phase === "up") {
      if (isDown && this.cooldownMs <= 0) {
        this.phase = "down";
        this.reachedExtreme = atDepth;
        this.dwellMs = 0;
      }
    } else if (this.phase === "down") {
      if (atDepth) this.reachedExtreme = true;
      this.dwellMs += dtMs;
      if (isUp && this.dwellMs >= minDown) {
        if (this.reachedExtreme) {
          repCompleted = true;
          this.cooldownMs = cool;
        } else {
          shallow = true;
        }
        this.phase = "up";
        this.reachedExtreme = false;
        this.dwellMs = 0;
      }
    }

    return { repCompleted, shallow };
  }

  get inDown() {
    return this.phase === "down";
  }

  get hasDepth() {
    return this.reachedExtreme;
  }
}
