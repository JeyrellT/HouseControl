"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNexus, STATIC, selectDevicesByPersona, selectRoomsByPersona } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Mic, MicOff, Send, CheckCircle2, Sparkles, Volume2, VolumeX,
  Loader2, AlertTriangle, RotateCw, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition, useSpeechSynthesis } from "@/lib/hooks/useSpeech";
import { assistantChat, type AssistantReply } from "@/lib/gemini";

interface VoiceLog {
  id: string;
  ts: string;
  phrase: string;
  reply?: string;
  intent: string;
  outcome: "success" | "no-match" | "ai";
  explanation?: string;
  confidence?: number;
  usedAI?: boolean;
}

type BusyState = "idle" | "thinking" | "speaking";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function VoicePage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const runScene = useNexus((s) => s.runScene);
  const apiKey = useNexus((s) => s.geminiApiKey);
  const model = useNexus((s) => s.geminiModel);

  const intents = STATIC.voiceIntents;
  const devices = useMemo(() => selectDevicesByPersona(personaId), [personaId]);
  const rooms = useMemo(() => selectRoomsByPersona(personaId), [personaId]);
  const persona = useMemo(() => STATIC.personas.find((p) => p.id === personaId)!, [personaId]);

  const [input, setInput] = useState("");
  const [log, setLog] = useState<VoiceLog[]>([]);
  const [busy, setBusy] = useState<BusyState>("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lang, setLang] = useState("es-ES");
  const [voiceURI, setVoiceURI] = useState<string | undefined>(undefined);

  const speech = useSpeechRecognition(lang);
  const tts = useSpeechSynthesis();

  // Captura transcripción final y la envía automáticamente cuando el usuario termina de hablar
  const lastHandled = useRef<string>("");
  useEffect(() => {
    if (!speech.finalTranscript) return;
    if (speech.finalTranscript === lastHandled.current) return;
    if (speech.listening) return; // espera a terminar la captura
    lastHandled.current = speech.finalTranscript;
    handleExecute(speech.finalTranscript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.finalTranscript, speech.listening]);

  const contextSummary = useMemo(() => {
    const onlineCount = devices.length;
    const roomsList = rooms.map((r) => r.name).join(", ");
    return `Persona: ${persona.name} (${persona.type}, ${persona.location}).
Habitaciones (${rooms.length}): ${roomsList}.
Dispositivos totales: ${onlineCount}. Escenas disponibles: ${STATIC.scenes.filter((s) => s.personaId === personaId).map((s) => s.name).join(", ")}.`;
  }, [persona, devices.length, rooms, personaId]);

  function localMatch(phrase: string) {
    const n = normalize(phrase);
    // match exacto
    let m = intents.find((i) => normalize(i.phrase) === n);
    if (m) return m;
    // contención parcial en ambos sentidos
    m = intents.find((i) => {
      const ni = normalize(i.phrase);
      return n.includes(ni) || ni.includes(n);
    });
    return m ?? null;
  }

  async function handleExecute(rawPhrase: string) {
    const phrase = rawPhrase.trim();
    if (!phrase) return;
    setInput("");
    setAiError(null);

    const ts = new Date().toISOString();
    const logId = `vl_${Date.now()}`;

    // Si hay API key, pedimos a Gemini una respuesta conversacional + matching inteligente
    if (apiKey) {
      setBusy("thinking");
      try {
        const reply: AssistantReply = await assistantChat({
          apiKey,
          model,
          userPhrase: phrase,
          intents: intents.map((i) => ({
            id: i.id, phrase: i.phrase, intent: i.intent,
            explanation: i.explanation, targetSceneId: i.targetSceneId,
          })),
          contextSummary,
          history: log.slice(0, 4).reverse().flatMap((l) => [
            { role: "user" as const, text: l.phrase },
            ...(l.reply ? [{ role: "assistant" as const, text: l.reply }] : []),
          ]),
        });

        // Ejecutar acción si Gemini matcheó un intent
        const matched = reply.matchedIntentId ? intents.find((i) => i.id === reply.matchedIntentId) : null;
        if (matched?.intent === "scene.activate" && matched.targetSceneId) {
          runScene(matched.targetSceneId);
        }

        setLog((l) => [{
          id: logId, ts, phrase,
          reply: reply.spokenReply,
          intent: matched?.intent ?? "ai.conversation",
          outcome: matched ? "success" : "ai",
          explanation: reply.action ?? matched?.explanation,
          confidence: reply.confidence,
          usedAI: true,
        }, ...l]);

        if (ttsEnabled && reply.spokenReply) {
          setBusy("speaking");
          tts.speak(reply.spokenReply, { voiceURI });
        } else {
          setBusy("idle");
        }
        return;
      } catch (e) {
        setAiError(e instanceof Error ? e.message : "Gemini falló");
        // Caemos a modo local
      }
    }

    // Modo local (sin API key o si Gemini falló)
    const match = localMatch(phrase);
    if (!match) {
      const fallbackReply = "No entendí la orden. Prueba con una frase del catálogo o configura la IA en Ajustes.";
      setLog((l) => [{
        id: logId, ts, phrase,
        reply: fallbackReply,
        intent: "no-match", outcome: "no-match",
        explanation: "Frase no reconocida en el catálogo de intents",
      }, ...l]);
      if (ttsEnabled) {
        setBusy("speaking");
        tts.speak(fallbackReply, { voiceURI });
      } else setBusy("idle");
      return;
    }

    if (match.intent === "scene.activate" && match.targetSceneId) {
      runScene(match.targetSceneId);
    }
    const reply = match.explanation
      ? `Listo. ${match.explanation}.`
      : `Ejecutando ${match.phrase}.`;
    setLog((l) => [{
      id: logId, ts, phrase: match.phrase,
      reply,
      intent: match.intent, outcome: "success",
      explanation: match.explanation,
    }, ...l]);
    if (ttsEnabled) {
      setBusy("speaking");
      tts.speak(reply, { voiceURI });
    } else setBusy("idle");
  }

  // sincroniza estado "speaking" con el TTS real
  useEffect(() => {
    if (!tts.speaking && busy === "speaking") setBusy("idle");
  }, [tts.speaking, busy]);

  const micDisabled = !speech.supported || busy === "thinking";
  const onToggleMic = () => {
    if (speech.listening) {
      speech.stop();
    } else {
      tts.cancel();
      speech.reset();
      speech.start();
    }
  };

  const spanishVoices = useMemo(
    () => tts.voices.filter((v) => /^es/i.test(v.lang)),
    [tts.voices],
  );

  const statusLabel =
    busy === "thinking" ? "Pensando..."
    : busy === "speaking" ? "Hablando..."
    : speech.listening ? "Escuchando..."
    : "Listo";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Voz e IA</h1>
          <p className="text-sm text-ink-soft mt-1">
            Habla al asistente con tu micrófono. Transcribe en tiempo real, ejecuta la orden y responde en voz alta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={apiKey ? "ok" : "warn"}>
            <Brain className="inline h-3 w-3 mr-1" />
            {apiKey ? "Gemini activo" : "Modo local (sin API key)"}
          </Badge>
          <Badge tone={speech.supported ? "ok" : "warn"}>
            {speech.supported ? "STT disponible" : "STT no soportado"}
          </Badge>
          <Badge tone={tts.supported ? "ok" : "warn"}>
            {tts.supported ? "TTS disponible" : "TTS no soportado"}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-gold/15 text-gold-border flex items-center justify-center">
              <Mic size={18} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-medium">Asistente de voz Nexus</div>
              <div className="text-xs text-ink-soft">
                Pulsa el micrófono y habla. También puedes escribir o elegir una frase del catálogo.
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 text-ink-soft">
                Idioma
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="bg-surface border border-line rounded px-2 py-1 text-xs"
                  disabled={speech.listening}
                >
                  <option value="es-ES">es-ES</option>
                  <option value="es-MX">es-MX</option>
                  <option value="es-US">es-US</option>
                  <option value="es-CR">es-CR</option>
                  <option value="en-US">en-US</option>
                </select>
              </label>
              {spanishVoices.length > 0 && (
                <label className="flex items-center gap-1 text-ink-soft">
                  Voz
                  <select
                    value={voiceURI ?? ""}
                    onChange={(e) => setVoiceURI(e.target.value || undefined)}
                    className="bg-surface border border-line rounded px-2 py-1 text-xs max-w-[200px]"
                  >
                    <option value="">Auto</option>
                    {spanishVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                onClick={() => setTtsEnabled((v) => !v)}
                className={cn(
                  "p-2 rounded-lg border",
                  ttsEnabled
                    ? "bg-sage/15 border-sage-border text-sage-border"
                    : "bg-surface border-line text-ink-soft",
                )}
                title={ttsEnabled ? "Silenciar respuesta" : "Activar voz"}
              >
                {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            </div>
          </div>

          {/* Big mic + transcript */}
          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              onClick={onToggleMic}
              disabled={micDisabled}
              className={cn(
                "relative w-24 h-24 rounded-full flex items-center justify-center transition-all select-none",
                speech.listening
                  ? "bg-gold text-navy shadow-[0_0_0_6px_rgba(212,168,75,0.35),0_0_40px_rgba(212,168,75,0.6)] scale-105"
                  : "bg-navy text-cream hover:scale-105",
                micDisabled && "opacity-50 cursor-not-allowed",
              )}
              title={speech.listening ? "Detener" : "Hablar"}
            >
              {busy === "thinking" ? (
                <Loader2 size={34} className="animate-spin" />
              ) : speech.listening ? (
                <>
                  <Mic size={34} />
                  <span className="absolute inset-0 rounded-full border-4 border-gold/60 animate-ping" />
                </>
              ) : (
                <Mic size={34} />
              )}
            </button>
            <div className="text-xs text-ink-soft font-mono flex items-center gap-2">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  busy === "thinking" ? "bg-status-warn animate-pulse"
                  : busy === "speaking" ? "bg-gold animate-pulse"
                  : speech.listening ? "bg-status-ok animate-pulse"
                  : "bg-smoke",
                )}
              />
              {statusLabel}
              {busy === "speaking" && (
                <button
                  onClick={() => { tts.cancel(); setBusy("idle"); }}
                  className="underline text-ink-soft hover:text-ink"
                >
                  Silenciar
                </button>
              )}
            </div>

            <div
              className={cn(
                "w-full min-h-[52px] rounded-lg border px-4 py-2.5 text-sm text-center transition",
                speech.transcript || speech.finalTranscript
                  ? "bg-sage/10 border-sage-border text-ink"
                  : "bg-surface border-line text-ink-soft italic",
              )}
            >
              {speech.transcript || speech.finalTranscript || "La transcripción aparecerá aquí..."}
            </div>
          </div>

          {/* Text fallback */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleExecute(input); }}
            className="mt-4 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='O escribe una orden: "Modo Cine"'
              className="flex-1 px-4 py-2.5 rounded-lg bg-surface border border-line outline-none text-sm focus:border-gold"
              disabled={busy === "thinking"}
            />
            <button
              type="submit"
              disabled={!input.trim() || busy === "thinking"}
              className="px-4 py-2.5 rounded-lg bg-navy text-cream text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              <Send size={14} /> Enviar
            </button>
          </form>

          {!speech.supported && (
            <div className="mt-3 text-[11px] text-status-warn flex items-center gap-1.5">
              <AlertTriangle size={12} />
              Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge en escritorio para activar el micrófono.
            </div>
          )}
          {speech.error && (
            <div className="mt-3 text-[11px] text-status-warn flex items-center gap-1.5">
              <AlertTriangle size={12} />
              {speech.error}
            </div>
          )}
          {aiError && (
            <div className="mt-3 text-[11px] text-status-warn flex items-center gap-1.5">
              <AlertTriangle size={12} />
              Gemini: {aiError}. Se usó el reconocimiento local como respaldo.
            </div>
          )}

          <div className="mt-6">
            <div className="text-xs font-medium uppercase text-ink-soft tracking-wider mb-3">Frases sugeridas</div>
            <div className="flex flex-wrap gap-2">
              {intents.map((i) => (
                <button
                  key={i.id}
                  onClick={() => handleExecute(i.phrase)}
                  disabled={busy === "thinking"}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-line text-sm hover:bg-sage/15 hover:border-sage-border transition disabled:opacity-50"
                >
                  {i.phrase}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Catálogo de intents</CardTitle>
            <Sparkles size={16} className="text-gold-border" />
          </CardHeader>
          <CardBody className="p-0 max-h-96 overflow-auto">
            <div className="divide-y divide-line">
              {intents.map((i) => (
                <div key={i.id} className="px-5 py-3">
                  <div className="text-sm font-medium">{i.phrase}</div>
                  <div className="text-[11px] text-ink-soft mt-0.5 font-mono">{i.intent}</div>
                  {i.explanation && <div className="text-[11px] text-ink-soft mt-1">{i.explanation}</div>}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Conversación</CardTitle>
          {log.length > 0 && (
            <button
              onClick={() => { setLog([]); tts.cancel(); }}
              className="text-xs text-ink-soft flex items-center gap-1 hover:text-ink"
            >
              <RotateCw size={12} /> Limpiar
            </button>
          )}
        </CardHeader>
        <CardBody className="p-0">
          {log.length === 0 ? (
            <div className="px-5 py-10 text-sm text-ink-soft text-center">
              Sin ejecuciones aún. Pulsa el micrófono o selecciona una frase para comenzar.
            </div>
          ) : (
            <div className="divide-y divide-line">
              {log.map((entry) => (
                <div key={entry.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gold/15 text-gold-border">
                      <Mic size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">&ldquo;{entry.phrase}&rdquo;</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-soft">
                        <Badge tone={entry.outcome === "no-match" ? "warn" : entry.usedAI ? "gold" : "ok"}>
                          {entry.intent}
                        </Badge>
                        {typeof entry.confidence === "number" && (
                          <span>conf {(entry.confidence * 100).toFixed(0)}%</span>
                        )}
                        <span>{new Date(entry.ts).toLocaleTimeString("es-CR")}</span>
                      </div>
                    </div>
                  </div>
                  {entry.reply && (
                    <div className="flex items-start gap-3 pl-5">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          entry.outcome === "no-match"
                            ? "bg-status-warn/15 text-status-warn"
                            : "bg-sage/15 text-sage-border",
                        )}
                      >
                        {entry.outcome === "no-match"
                          ? <AlertTriangle size={14} />
                          : <CheckCircle2 size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-ink">{entry.reply}</div>
                        {entry.explanation && (
                          <div className="mt-1 text-[11px] text-ink-soft italic">{entry.explanation}</div>
                        )}
                        <button
                          onClick={() => {
                            tts.cancel();
                            setBusy("speaking");
                            tts.speak(entry.reply!, { voiceURI });
                          }}
                          className="mt-1 text-[11px] text-ink-soft hover:text-ink underline flex items-center gap-1"
                        >
                          <Volume2 size={11} /> Repetir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
