"use client";

import { useEffect, useMemo, useRef } from "react";
import { POSE_CONNECTIONS, type Landmark } from "../lib/pose/landmarks";
import { FULL_BODY_SKELETON } from "../lib/pose/formHighlights";

type TrackingOverlayProps = {
  video: HTMLVideoElement | null;
  landmarks: Landmark[] | null;
  /** Landmark indices with form issues — drawn in red */
  issueLandmarks?: number[];
  /** Wrong exercise — entire skeleton red, no green */
  wholeBodyWrong?: boolean;
  /** Keep in sync with video CSS mirror */
  mirrored?: boolean;
};

const GOOD_STROKE = "rgba(61, 203, 159, 0.95)";
const GOOD_FILL = "rgba(15, 122, 95, 1)";
const BAD_STROKE = "rgba(248, 113, 113, 0.98)";
const BAD_FILL = "rgba(239, 68, 68, 1)";
const BAD_RING = "rgba(255, 255, 255, 0.9)";
const BAD_GLOW = "rgba(239, 68, 68, 0.35)";

/**
 * Draws skeleton aligned to the (optionally mirrored) video.
 * Wrong-form joints pulse red; whole wrong exercise → full red skeleton.
 */
export function TrackingOverlay({
  video,
  landmarks,
  issueLandmarks = [],
  wholeBodyWrong = false,
  mirrored = true,
}: TrackingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  const issueSet = useMemo(() => {
    if (wholeBodyWrong) return new Set(FULL_BODY_SKELETON);
    return new Set(issueLandmarks);
  }, [issueLandmarks, wholeBodyWrong]);

  const hasIssues = wholeBodyWrong || issueSet.size > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (pulse: number) => {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      ctx.clearRect(0, 0, w, h);
      if (!landmarks?.length) return;

      const lineWidth = Math.max(3, w / 280);
      const goodRadius = Math.max(4, w / 160);
      const pulseScale = 0.85 + Math.sin(pulse * Math.PI * 2) * 0.15;
      const badRadius = Math.max(7, w / 110) * pulseScale;
      const glowRadius = badRadius + Math.max(6, w / 90) * (0.6 + pulseScale * 0.4);
      ctx.lineCap = "round";

      const visible = (i: number) => {
        const lm = landmarks[i];
        return lm && (lm.visibility ?? 1) >= 0.4;
      };

      const isBadConnection = (a: number, b: number) =>
        hasIssues && (issueSet.has(a) || issueSet.has(b));

      if (!hasIssues) {
        ctx.strokeStyle = GOOD_STROKE;
        ctx.lineWidth = lineWidth;
        for (const [a, b] of POSE_CONNECTIONS) {
          if (!visible(a) || !visible(b)) continue;
          const pa = landmarks[a]!;
          const pb = landmarks[b]!;
          ctx.beginPath();
          ctx.moveTo(pa.x * w, pa.y * h);
          ctx.lineTo(pb.x * w, pb.y * h);
          ctx.stroke();
        }

        for (let i = 0; i < landmarks.length; i++) {
          if (!visible(i)) continue;
          const lm = landmarks[i]!;
          ctx.beginPath();
          ctx.fillStyle = GOOD_FILL;
          ctx.arc(lm.x * w, lm.y * h, goodRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }

      // Wrong form — red skeleton only on highlighted regions (or full body)
      ctx.strokeStyle = BAD_STROKE;
      ctx.lineWidth = lineWidth + 1.5;
      for (const [a, b] of POSE_CONNECTIONS) {
        if (!isBadConnection(a, b)) continue;
        if (!visible(a) || !visible(b)) continue;
        const pa = landmarks[a]!;
        const pb = landmarks[b]!;
        ctx.beginPath();
        ctx.moveTo(pa.x * w, pa.y * h);
        ctx.lineTo(pb.x * w, pb.y * h);
        ctx.stroke();
      }

      // Optional faint green for non-issue joints when partial wrong
      if (!wholeBodyWrong) {
        ctx.strokeStyle = "rgba(61, 203, 159, 0.35)";
        ctx.lineWidth = lineWidth;
        for (const [a, b] of POSE_CONNECTIONS) {
          if (isBadConnection(a, b)) continue;
          if (!visible(a) || !visible(b)) continue;
          const pa = landmarks[a]!;
          const pb = landmarks[b]!;
          ctx.beginPath();
          ctx.moveTo(pa.x * w, pa.y * h);
          ctx.lineTo(pb.x * w, pb.y * h);
          ctx.stroke();
        }

        for (let i = 0; i < landmarks.length; i++) {
          if (!visible(i) || issueSet.has(i)) continue;
          const lm = landmarks[i]!;
          ctx.beginPath();
          ctx.fillStyle = GOOD_FILL;
          ctx.arc(lm.x * w, lm.y * h, goodRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Pulsing red issue points
      for (const i of issueSet) {
        if (!visible(i)) continue;
        const lm = landmarks[i]!;
        const x = lm.x * w;
        const y = lm.y * h;

        ctx.beginPath();
        ctx.fillStyle = BAD_GLOW;
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = BAD_RING;
        ctx.arc(x, y, badRadius + 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = BAD_FILL;
        ctx.arc(x, y, badRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      const pulse = (now % 1200) / 1200;
      draw(pulse);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [video, landmarks, issueSet, hasIssues, wholeBodyWrong, mirrored]);

  return (
    <canvas
      ref={canvasRef}
      className={
        hasIssues
          ? "pointer-events-none absolute inset-0 h-full w-full object-cover track-skeleton-wrong"
          : "pointer-events-none absolute inset-0 h-full w-full object-cover"
      }
      style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
      aria-hidden
      suppressHydrationWarning
    />
  );
}
