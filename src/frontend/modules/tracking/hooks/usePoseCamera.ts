"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { detectPoseForVideo, getPoseLandmarker } from "../lib/pose/mediapipe";
import {
  averageVisibility,
  type Landmark,
  PoseLandmark,
} from "../lib/pose/landmarks";
import { LandmarkSmoother } from "../lib/pose/smoothing";

const CORE_LANDMARKS = [
  PoseLandmark.LEFT_SHOULDER,
  PoseLandmark.RIGHT_SHOULDER,
  PoseLandmark.LEFT_HIP,
  PoseLandmark.RIGHT_HIP,
  PoseLandmark.LEFT_KNEE,
  PoseLandmark.RIGHT_KNEE,
  PoseLandmark.LEFT_ANKLE,
  PoseLandmark.RIGHT_ANKLE,
  PoseLandmark.LEFT_ELBOW,
  PoseLandmark.RIGHT_ELBOW,
  PoseLandmark.LEFT_WRIST,
  PoseLandmark.RIGHT_WRIST,
];

const CONFIDENCE_THRESHOLD = 0.6;
/** Cap React re-renders from the detection loop (~25–30 FPS target). */
const UI_UPDATE_MS = 40;

export type PoseFrameMeta = {
  lowConfidence: boolean;
  fps: number;
};

export type PoseCameraState = {
  ready: boolean;
  error: string | null;
  lowConfidence: boolean;
  landmarks: Landmark[] | null;
  fps: number;
};

export function usePoseCamera(
  enabled: boolean,
  onFrame?: (landmarks: Landmark[] | null, meta: PoseFrameMeta) => void,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);
  const lastUiPublishRef = useRef<number>(0);
  const fpsCounter = useRef({ frames: 0, last: 0, fps: 0 });
  const landmarkSmootherRef = useRef(new LandmarkSmoother(0.4));
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const [state, setState] = useState<PoseCameraState>({
    ready: false,
    error: null,
    lowConfidence: true,
    landmarks: null,
    fps: 0,
  });

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    const video = videoRef.current;
    if (video?.srcObject) {
      for (const track of (video.srcObject as MediaStream).getTracks()) {
        track.stop();
      }
      video.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopCamera();
      setState((s) =>
        s.ready || s.landmarks
          ? { ...s, ready: false, landmarks: null, lowConfidence: true }
          : s,
      );
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        setState((s) => (s.error ? { ...s, error: null } : s));
        const landmarker = await getPoseLandmarker();
        if (cancelled) return;
        landmarkerRef.current = landmarker;

        const isMobile =
          typeof window !== "undefined" &&
          (window.matchMedia("(max-width: 768px)").matches ||
            /iPhone|iPad|Android/i.test(navigator.userAgent));

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: isMobile ? 720 : 1280 },
            height: { ideal: isMobile ? 960 : 720 },
            frameRate: { ideal: isMobile ? 24 : 30, max: 30 },
          },
          audio: false,
        });
        if (cancelled) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        if (cancelled) return;
        setState((s) => ({ ...s, ready: true, error: null }));
        lastUiPublishRef.current = 0;
        landmarkSmootherRef.current.reset();

        const loop = () => {
          rafRef.current = requestAnimationFrame(loop);
          const v = videoRef.current;
          const lm = landmarkerRef.current;
          if (!v || !lm || v.readyState < 2) return;

          const now = performance.now();
          if (now <= lastTsRef.current) return;
          lastTsRef.current = now;

          try {
            const result = detectPoseForVideo(lm, v, now);
            const rawPose = (result.landmarks?.[0] as Landmark[] | undefined) ?? null;
            const pose = rawPose
              ? landmarkSmootherRef.current.next(rawPose)
              : null;
            const visibility = pose
              ? averageVisibility(pose, CORE_LANDMARKS)
              : 0;
            const low = !pose || visibility < CONFIDENCE_THRESHOLD;

            fpsCounter.current.frames += 1;
            if (now - fpsCounter.current.last >= 1000) {
              fpsCounter.current.fps = fpsCounter.current.frames;
              fpsCounter.current.frames = 0;
              fpsCounter.current.last = now;
            }

            const meta: PoseFrameMeta = {
              lowConfidence: low,
              fps: fpsCounter.current.fps,
            };

            // Drive trackers off the rAF path without forcing a React render.
            onFrameRef.current?.(pose, meta);

            if (now - lastUiPublishRef.current >= UI_UPDATE_MS) {
              lastUiPublishRef.current = now;
              setState((s) => {
                if (
                  s.lowConfidence === low &&
                  s.fps === meta.fps &&
                  s.landmarks === pose
                ) {
                  return s;
                }
                return {
                  ...s,
                  landmarks: pose,
                  lowConfidence: low,
                  fps: meta.fps,
                };
              });
            }
          } catch {
            // skip bad frame
          }
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Camera or pose model failed to start";
        setState((s) => ({
          ...s,
          ready: false,
          error:
            message.includes("Permission") || message.includes("NotAllowed")
              ? "Camera permission denied. Allow webcam access and reload."
              : message,
        }));
      }
    }

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      stopCamera();
    };
  }, [enabled, stopCamera]);

  return { videoRef, ...state };
}
