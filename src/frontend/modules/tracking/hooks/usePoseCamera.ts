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
const UI_UPDATE_MS = 40;

export type CameraFacing = "user" | "environment";

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
  facingMode: CameraFacing;
  switching: boolean;
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
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<CameraFacing>("user");
  const [switching, setSwitching] = useState(false);
  const [state, setState] = useState<Omit<PoseCameraState, "facingMode" | "switching">>({
    ready: false,
    error: null,
    lowConfidence: true,
    landmarks: null,
    fps: 0,
  });

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video?.srcObject) {
      video.srcObject = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    stopTracks();
  }, [stopTracks]);

  const openStream = useCallback(async (facing: CameraFacing) => {
    const isMobile =
      typeof window !== "undefined" &&
      (window.matchMedia("(max-width: 768px)").matches ||
        /iPhone|iPad|Android/i.test(navigator.userAgent));

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 960 : 720 },
          frameRate: { ideal: isMobile ? 24 : 30, max: 30 },
        },
        audio: false,
      });
    } catch {
      // Fallback without ideal constraints (older phones)
      return navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
    }
  }, []);

  const toggleFacing = useCallback(() => {
    setFacingMode((f) => (f === "user" ? "environment" : "user"));
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
        setSwitching(true);
        setState((s) => ({ ...s, error: null, ready: false }));

        // Stop previous stream before requesting the other camera
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        stopTracks();

        const landmarker = await getPoseLandmarker();
        if (cancelled) return;
        landmarkerRef.current = landmarker;

        const stream = await openStream(facingMode);
        if (cancelled) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        if (cancelled) return;
        setState((s) => ({ ...s, ready: true, error: null }));
        setSwitching(false);
        lastUiPublishRef.current = 0;
        landmarkSmootherRef.current.reset();
        lastTsRef.current = 0;

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
            const rawPose =
              (result.landmarks?.[0] as Landmark[] | undefined) ?? null;
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
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "Camera or pose model failed to start";
        setSwitching(false);
        setState((s) => ({
          ...s,
          ready: false,
          error:
            message.includes("Permission") || message.includes("NotAllowed")
              ? "Camera permission denied. Allow webcam access and reload."
              : message.includes("NotFound") || message.includes("Overconstrained")
                ? "That camera isn't available on this device. Try the other one."
                : message,
        }));
      }
    }

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      stopTracks();
    };
  }, [enabled, facingMode, openStream, stopCamera, stopTracks]);

  return {
    videoRef,
    ...state,
    facingMode,
    switching,
    toggleFacing,
    setFacingMode,
  };
}
