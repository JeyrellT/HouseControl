"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal types for the Web Speech API (not in lib.dom for all TS configs).
interface SRResultItem { transcript: string; confidence: number }
interface SRResult { 0: SRResultItem; isFinal: boolean; length: number }
interface SRResults { [index: number]: SRResult; length: number }
interface SREvent { results: SRResults; resultIndex: number }
interface SRErrorEvent { error: string; message?: string }

interface SRInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((e: Event) => void) | null;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: ((e: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SRCtor = new () => SRInstance;

function getSRCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechReturn {
  supported: boolean;
  listening: boolean;
  transcript: string;        // lo que va capturando (interim + final)
  finalTranscript: string;   // último final
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(lang = "es-ES"): UseSpeechReturn {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SRInstance | null>(null);

  useEffect(() => {
    const Ctor = getSRCtor();
    setSupported(!!Ctor);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSRCtor();
    if (!Ctor) {
      setError("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge en escritorio.");
      return;
    }
    try {
      // Cierra cualquier instancia previa
      if (recRef.current) {
        try { recRef.current.abort(); } catch { /* noop */ }
        recRef.current = null;
      }
      const rec = new Ctor();
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onstart = () => {
        setListening(true);
        setError(null);
        setTranscript("");
      };
      rec.onresult = (ev: SREvent) => {
        let interim = "";
        let finalText = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          const txt = r[0]?.transcript ?? "";
          if (r.isFinal) finalText += txt;
          else interim += txt;
        }
        if (finalText) {
          setFinalTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText).trim());
          setTranscript(finalText.trim());
        } else {
          setTranscript(interim.trim());
        }
      };
      rec.onerror = (ev: SRErrorEvent) => {
        const map: Record<string, string> = {
          "not-allowed": "Permiso de micrófono denegado.",
          "service-not-allowed": "Permiso de micrófono bloqueado por el navegador.",
          "no-speech": "No se detectó voz. Intenta de nuevo.",
          "audio-capture": "No se encontró micrófono disponible.",
          "network": "Error de red durante el reconocimiento.",
          "aborted": "",
        };
        const msg = map[ev.error] ?? `Error: ${ev.error}`;
        if (msg) setError(msg);
        setListening(false);
      };
      rec.onend = () => {
        setListening(false);
      };
      recRef.current = rec;
      rec.start();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar el reconocimiento.");
      setListening(false);
    }
  }, [lang]);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setFinalTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      try { recRef.current?.abort(); } catch { /* noop */ }
    };
  }, []);

  return { supported, listening, transcript, finalTranscript, error, start, stop, reset };
}

// ---------------- Speech synthesis ----------------

export interface UseSpeakReturn {
  supported: boolean;
  speaking: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (text: string, opts?: { voiceURI?: string; rate?: number; pitch?: number }) => void;
  cancel: () => void;
}

export function useSpeechSynthesis(): UseSpeakReturn {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    const load = () => {
      const vs = window.speechSynthesis.getVoices();
      if (vs.length) setVoices(vs);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string, opts?: { voiceURI?: string; rate?: number; pitch?: number }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (!text.trim()) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      const all = window.speechSynthesis.getVoices();
      // Preferir voz seleccionada > español CR/ES/MX > cualquier es-*
      let chosen: SpeechSynthesisVoice | undefined;
      if (opts?.voiceURI) chosen = all.find((v) => v.voiceURI === opts.voiceURI);
      if (!chosen) chosen = all.find((v) => /^es(-|_)(CR|MX|ES|US|AR|CO)/i.test(v.lang));
      if (!chosen) chosen = all.find((v) => /^es/i.test(v.lang));
      if (chosen) utt.voice = chosen;
      utt.lang = chosen?.lang ?? "es-ES";
      utt.rate = opts?.rate ?? 1;
      utt.pitch = opts?.pitch ?? 1;
      utt.onstart = () => setSpeaking(true);
      utt.onend = () => setSpeaking(false);
      utt.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utt);
    },
    [],
  );

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { supported, speaking, voices, speak, cancel };
}
