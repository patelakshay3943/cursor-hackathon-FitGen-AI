"use client";

import { useEffect, useMemo, useRef } from "react";
import { POSE_CONNECTIONS, type Landmark } from "../lib/pose/landmarks";

type TrackingOverlayProps = {
  video: HTMLVideoElement | null;
  landmarks: Landmark[] | null;
  /** Keep in sync with video CSS mirror */
  mirrored?: boolean;
};

/**
 * Draws skeleton in the same coordinate space as the (optionally mirrored) video.
 * Both video and canvas use CSS scaleX(-1) when mirrored so landmarks align.
 */
export function TrackingOverlay({
  video,
  landmarks,
  mirrored = true,
}: TrackingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    if (!landmarks?.length) return;

    const stroke = "rgba(61, 203, 159, 0.95)";
    const fill = "rgba(15, 122, 95, 1)";
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(3, w / 280);
    ctx.lineCap = "round";

    for (const [a, b] of POSE_CONNECTIONS) {
      const pa = landmarks[a];
      const pb = landmarks[b];
      if (!pa || !pb) continue;
      if ((pa.visibility ?? 1) < 0.4 || (pb.visibility ?? 1) < 0.4) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x * w, pa.y * h);
      ctx.lineTo(pb.x * w, pb.y * h);
      ctx.stroke();
    }

    for (const lm of landmarks) {
      if (!lm || (lm.visibility ?? 1) < 0.4) continue;
      ctx.beginPath();
      ctx.fillStyle = fill;
      ctx.arc(lm.x * w, lm.y * h, Math.max(4, w / 160), 0, Math.PI * 2);
      ctx.fill();
    }
  }, [video, landmarks, mirrored]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
      aria-hidden
    />
  );
}
