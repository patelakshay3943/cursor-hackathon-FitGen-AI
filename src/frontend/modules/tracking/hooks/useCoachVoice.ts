"use client";

import { useEffect, useRef } from "react";

/** Don't re-speak the exact same cue within this window */
const SAME_CUE_COOLDOWN_MS = 12_000;

const audioCache = new Map<string, string>();

function stopBrowserSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

function speakWithBrowser(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  stopBrowserSpeech();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;
  utter.pitch = 1;
  utter.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find(
      (v) =>
        /en(-|_)?(US|GB)?/i.test(v.lang) &&
        /female|samantha|google/i.test(v.name),
    ) || voices.find((v) => /^en/i.test(v.lang));
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
}

async function fetchCoachAudio(text: string): Promise<string | null> {
  const cached = audioCache.get(text);
  if (cached) return cached;

  const res = await fetch("/api/coach/speak", {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) return null;

  const blob = await res.blob();
  if (!blob.size) return null;

  const url = URL.createObjectURL(blob);
  if (audioCache.size > 24) {
    const oldest = audioCache.keys().next().value;
    if (oldest) {
      const oldUrl = audioCache.get(oldest);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      audioCache.delete(oldest);
    }
  }
  audioCache.set(text, url);
  return url;
}

/**
 * Speaks wrong-form coach cues aloud via ElevenLabs (server) with
 * Web Speech API fallback so the user hears alerts during the workout.
 */
export function useCoachVoice(enabled: boolean, cue: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef("");
  const lastSpokenAtRef = useRef(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      stopBrowserSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const text = cue.trim();
    if (text.length < 4) return;

    const now = Date.now();
    if (
      text === lastSpokenRef.current &&
      now - lastSpokenAtRef.current < SAME_CUE_COOLDOWN_MS
    ) {
      return;
    }

    lastSpokenRef.current = text;
    lastSpokenAtRef.current = now;
    const reqId = ++requestIdRef.current;

    stopBrowserSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    void (async () => {
      try {
        const url = await fetchCoachAudio(text);
        if (reqId !== requestIdRef.current) return;

        if (!url) {
          speakWithBrowser(text);
          return;
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.volume = 1;
        try {
          await audio.play();
        } catch {
          speakWithBrowser(text);
        }
      } catch {
        if (reqId !== requestIdRef.current) return;
        speakWithBrowser(text);
      }
    })();
  }, [enabled, cue]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      stopBrowserSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
}
