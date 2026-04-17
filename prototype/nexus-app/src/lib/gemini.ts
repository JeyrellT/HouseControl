// Cliente minimal para la API pública de Gemini (generativelanguage.googleapis.com).
// Usa modo JSON (responseMimeType) para obtener sugerencias estructuradas de escenas.

import type { Capability, Device, Room, Scene } from "./types";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export interface SceneSuggestion {
  name: string;
  description: string;
  icon: string; // nombre Lucide
  targetStates: Record<string, unknown>;
  rationale: string;
  recommendedAreas: string[]; // roomIds
}

interface GeminiPart { text: string }
interface GeminiContent { role?: string; parts: GeminiPart[] }
interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  error?: { message: string };
  promptFeedback?: { blockReason?: string };
}

export async function suggestScene(params: {
  apiKey: string;
  model: string;
  prompt: string;
  devices: Device[];
  rooms: Room[];
  capabilities: Record<string, Capability>;
  existingScene?: Scene;
}): Promise<SceneSuggestion> {
  const { apiKey, model, prompt, devices, rooms, capabilities, existingScene } = params;

  if (!apiKey) throw new Error("Falta la API key de Gemini. Configúrala en Ajustes.");

  // Compact catalog context for the model (avoid huge prompts)
  const deviceCatalog = devices.map((d) => {
    const caps = d.capabilityIds
      .map((id) => {
        const c = capabilities[id];
        if (!c) return null;
        return { capabilityId: c.id, kind: c.kind, unit: c.unit };
      })
      .filter(Boolean);
    const room = rooms.find((r) => r.id === d.roomId)?.name ?? "";
    return {
      deviceId: d.id,
      name: d.name,
      kind: d.kind,
      room,
      roomId: d.roomId,
      capabilities: caps,
    };
  });

  const roomCatalog = rooms.map((r) => ({ roomId: r.id, name: r.name, zone: r.zone }));

  const systemPrompt = `Eres un diseñador experto de escenas de automatización para un smart home.
Tu tarea: devolver un JSON que describa una escena basada en la petición del usuario.
Reglas:
- "targetStates" es un objeto cuyas claves son capabilityId exactos del catálogo
- valores permitidos por kind:
  * on_off: boolean
  * dim: número 0-100
  * color_temp: número 2200-6500 (Kelvin)
  * rgb: string hexadecimal (#RRGGBB)
  * thermostat: objeto { mode: "cool"|"heat"|"off", target: number }
  * valve: "open" | "closed"
  * lock: "locked" | "unlocked"
  * audio: { playing: boolean, volume: 0-100 }
- "recommendedAreas" debe ser un array de roomId existentes del catálogo
- "icon" debe ser un nombre válido de Lucide Icons (Sunrise, Moon, Film, Home, ShieldCheck, Utensils, etc.)
- "name" y "description" en español, breves
- "rationale" explica en una frase la lógica aplicada
- NO inventes capabilityIds ni roomIds. Usa SOLO los del catálogo.`;

  const userPrompt = [
    prompt,
    existingScene ? `Escena existente como base: ${JSON.stringify(existingScene)}` : "",
    `Catálogo de dispositivos (${deviceCatalog.length}):\n${JSON.stringify(deviceCatalog)}`,
    `Habitaciones:\n${JSON.stringify(roomCatalog)}`,
  ].filter(Boolean).join("\n\n");

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }] as GeminiContent[],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.6,
    },
  };

  const url = `${BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }

  const data: GeminiResponse = await res.json();
  if (data.error) throw new Error(`Gemini: ${data.error.message}`);
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Prompt bloqueado: ${data.promptFeedback.blockReason}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Respuesta vacía de Gemini");

  let parsed: SceneSuggestion;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini devolvió JSON inválido");
  }

  // Sanitización mínima
  const validCapIds = new Set(Object.keys(capabilities));
  const validRoomIds = new Set(rooms.map((r) => r.id));
  parsed.targetStates = Object.fromEntries(
    Object.entries(parsed.targetStates ?? {}).filter(([k]) => validCapIds.has(k)),
  );
  parsed.recommendedAreas = (parsed.recommendedAreas ?? []).filter((r) => validRoomIds.has(r));
  parsed.name = parsed.name?.slice(0, 80) ?? "Escena IA";
  parsed.description = parsed.description?.slice(0, 300) ?? "";
  parsed.icon = parsed.icon ?? "Sparkles";
  parsed.rationale = parsed.rationale ?? "";

  return parsed;
}

// ---------- Health insight (texto libre, párrafos) ----------

export interface HealthInsight {
  summary: string;      // párrafo principal
  whatHappening: string; // párrafo sobre qué está pasando ahora
  recommendations: string[]; // bullets accionables
  severity: "ok" | "warn" | "critical";
}

export async function summarizeHealth(params: {
  apiKey: string;
  model: string;
  snapshot: {
    personaName: string;
    totals: { devices: number; online: number; offline: number; gateways: number; gatewaysOnline: number };
    platforms: Array<{ vendor: string; status: string; latencyMs: number; devicesDiscovered: number; quotaRemaining?: number }>;
    gateways: Array<{ name: string; kind: string; status: string; hosted: number }>;
    offlineDevices: Array<{ name: string; vendor: string; updatedAt: string; room: string }>;
    recentActivity: Array<{ ts: string; summary: string; severity?: string; outcome: string }>;
    averageLatencyMs: number;
    coverage: { localRoutePct: number; matterPct: number; batteryLowCount: number };
  };
}): Promise<HealthInsight> {
  const { apiKey, model, snapshot } = params;
  if (!apiKey) throw new Error("Falta la API key de Gemini. Configúrala en Ajustes.");

  const systemPrompt = `Eres un ingeniero senior de observabilidad para smart homes.
Analiza el snapshot de salud y devuelve un JSON con esta forma exacta:
{
  "summary": "párrafo de 3-5 frases en español, tono tranquilo pero técnico, explicando el estado general",
  "whatHappening": "párrafo de 2-4 frases describiendo qué está ocurriendo AHORA: incidentes, tendencias, anomalías",
  "recommendations": ["bullet accionable 1", "bullet accionable 2", "..."],
  "severity": "ok" | "warn" | "critical"
}
Reglas:
- Español natural, sin jerga innecesaria
- Menciona cifras concretas cuando aporten (latencias, dispositivos offline, %)
- 3 a 6 recomendaciones como máximo, priorizadas
- severity="critical" sólo si hay gateways offline o >10% dispositivos caídos`;

  const userPrompt = `Snapshot actual:\n${JSON.stringify(snapshot, null, 2)}`;

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }] as GeminiContent[],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  };

  const url = `${BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }
  const data: GeminiResponse = await res.json();
  if (data.error) throw new Error(`Gemini: ${data.error.message}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Respuesta vacía de Gemini");
  let parsed: HealthInsight;
  try { parsed = JSON.parse(text); } catch { throw new Error("Gemini devolvió JSON inválido"); }
  parsed.recommendations = (parsed.recommendations ?? []).slice(0, 6);
  if (!["ok", "warn", "critical"].includes(parsed.severity)) parsed.severity = "warn";
  return parsed;
}

// ---------- Energy insight ----------

export interface EnergyAction {
  title: string;
  impact: "alto" | "medio" | "bajo";
  estimatedSavingsCRC: number;
  estimatedSavingsKwh?: number;
  paybackMonths?: number;
  category: string;
  steps?: string[];
}

export interface EnergyInsight {
  executiveSummary: string;      // 1 frase potente
  summary: string;               // párrafo resumen
  whatHappening: string;         // qué está consumiendo más ahora
  benchmarkAnalysis: string;     // cómo compara vs hogar típico CR
  anomaliesNarrative: string;    // explicación de anomalías detectadas
  actions: EnergyAction[];       // acciones priorizadas con ROI
  monthlyForecast: string;       // pronóstico del mes
  seasonality: string;           // consideraciones de temporada/clima CR
  severity: "ok" | "warn" | "critical";
  efficiencyGrade: "A" | "B" | "C" | "D" | "E";
}

export async function summarizeEnergy(params: {
  apiKey: string;
  model: string;
  snapshot: Record<string, unknown>;  // se acepta cualquier forma rica del audit
}): Promise<EnergyInsight> {
  const { apiKey, model, snapshot } = params;
  if (!apiKey) throw new Error("Falta la API key de Gemini. Configúrala en Ajustes.");

  const systemPrompt = `Eres un auditor energético senior residencial certificado (CEM) especializado en Costa Rica.
Conoces la tarifa residencial ICE, las franjas horarias (pico 10-14 y 17-20 a ₡120, valle 22-06 a ₡75, medio ₡95),
la matriz eléctrica CR (~99% renovable, factor 0.18 kg CO₂/kWh), el clima tropical (calor moderado, alta humedad),
net metering ICE para FV residencial, y los electrodomésticos comunes en hogares premium de Escazú.

Analiza el snapshot completo (que incluye dispositivos con auditoría individual, anomalías pre-detectadas,
oportunidades con ROI estimado, carga fantasma, distribución tarifaria, y benchmark vs hogar CR) y devuelve
un JSON con esta forma exacta:

{
  "executiveSummary": "una frase contundente (máx 20 palabras) con el veredicto principal",
  "summary": "párrafo de 4-6 frases con diagnóstico general, nivel de consumo, estado de eficiencia global",
  "whatHappening": "párrafo de 3-5 frases identificando exactamente qué dispositivos están consumiendo y por qué",
  "benchmarkAnalysis": "párrafo 2-3 frases comparando contra hogar CR típico (${230} kWh) y premium (${450} kWh), usando las cifras del snapshot",
  "anomaliesNarrative": "párrafo 2-4 frases explicando las anomalías detectadas y su impacto real en colones",
  "actions": [
    {
      "title": "acción específica y clara",
      "impact": "alto" | "medio" | "bajo",
      "estimatedSavingsCRC": número (₡/mes),
      "estimatedSavingsKwh": número opcional,
      "paybackMonths": número opcional (si hay inversión),
      "category": "electrodoméstico|climatización|iluminación|entretenimiento|seguridad|movilidad|oficina|otros",
      "steps": ["paso 1", "paso 2", "..."] opcional
    }
  ],
  "monthlyForecast": "2-3 frases con proyección de costo mensual, tendencia y ahorro total alcanzable si se aplican todas las acciones de alto impacto",
  "seasonality": "1-2 frases con consideraciones de clima/estación CR (seca nov-abr: menos AC; lluviosa may-oct: más iluminación)",
  "severity": "ok" | "warn" | "critical",
  "efficiencyGrade": "A" | "B" | "C" | "D" | "E"
}

Reglas estrictas:
- Español natural, tono de auditor profesional pero accesible
- Usa cifras EXACTAS del snapshot para todo lo numérico
- Las acciones deben expandir (no sólo copiar) las "opportunities" del snapshot, priorizadas por impacto económico
- Máximo 8 acciones, mínimo 4. Combina técnicas (hábito, programación, inversión, reemplazo)
- severity="critical" si hay consumo >2× hogar premium O anomalías críticas sin resolver
- severity="warn" si hay oportunidades >₡15,000/mes de ahorro
- efficiencyGrade basado en efficiencyScore del snapshot: A=90+, B=75-89, C=60-74, D=40-59, E<40
- NO inventes cifras — usa el snapshot como fuente de verdad`;

  const userPrompt = `Auditoría energética completa:\n${JSON.stringify(snapshot, null, 2)}`;

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }] as GeminiContent[],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.45,
    },
  };

  const url = `${BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }
  const data: GeminiResponse = await res.json();
  if (data.error) throw new Error(`Gemini: ${data.error.message}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Respuesta vacía de Gemini");
  let parsed: EnergyInsight;
  try { parsed = JSON.parse(text); } catch { throw new Error("Gemini devolvió JSON inválido"); }
  parsed.actions = (parsed.actions ?? []).slice(0, 8);
  if (!["ok", "warn", "critical"].includes(parsed.severity)) parsed.severity = "warn";
  if (!["A", "B", "C", "D", "E"].includes(parsed.efficiencyGrade)) parsed.efficiencyGrade = "C";
  parsed.executiveSummary = parsed.executiveSummary ?? "";
  parsed.benchmarkAnalysis = parsed.benchmarkAnalysis ?? "";
  parsed.anomaliesNarrative = parsed.anomaliesNarrative ?? "";
  parsed.seasonality = parsed.seasonality ?? "";
  parsed.monthlyForecast = parsed.monthlyForecast ?? "";
  return parsed;
}

// ---------- Voice assistant ----------

export interface VoiceIntentLite {
  id: string;
  phrase: string;
  intent: string;
  explanation?: string;
  targetSceneId?: string;
}

export interface AssistantReply {
  spokenReply: string;          // lo que dirá la voz (breve, 1-3 frases)
  matchedIntentId?: string;     // id del intent del catálogo, si aplica
  action?: string;              // resumen humano de la acción tomada
  confidence: number;           // 0-1
}

export async function assistantChat(params: {
  apiKey: string;
  model: string;
  userPhrase: string;
  intents: VoiceIntentLite[];
  contextSummary: string;       // resumen corto del hogar (persona, conteo de devices/rooms, escenas)
  history?: Array<{ role: "user" | "assistant"; text: string }>;
}): Promise<AssistantReply> {
  const { apiKey, model, userPhrase, intents, contextSummary, history = [] } = params;
  if (!apiKey) throw new Error("Falta la API key de Gemini. Configúrala en Ajustes.");

  const systemPrompt = `Eres "Nexus", un asistente de voz en español para un hogar inteligente en Costa Rica.
Respondes siempre con un JSON exacto:
{
  "spokenReply": "respuesta natural en español, 1-3 frases, que se leerá en voz alta",
  "matchedIntentId": "id del intent del catálogo que coincide, o null si ninguno encaja",
  "action": "resumen humano de la acción (o null si es solo conversación/consulta)",
  "confidence": 0.0-1.0
}
Reglas:
- Español neutro, cálido, conciso. Nada de markdown, emojis ni asteriscos.
- Si el usuario pide activar algo y hay un intent claro del catálogo, úsalo en "matchedIntentId".
- Si la petición es ambigua, pide aclaración breve en "spokenReply" y deja matchedIntentId null.
- Si es una pregunta general sobre el hogar, responde usando el contextSummary; no inventes datos no provistos.
- No listes el catálogo ni expliques tu funcionamiento interno; contesta como un asistente, no como un chatbot.`;

  const userPrompt = [
    `Contexto del hogar:\n${contextSummary}`,
    `Catálogo de intents (solo estos ids son válidos en matchedIntentId):\n${JSON.stringify(intents)}`,
    history.length
      ? `Conversación previa:\n${history.map((h) => `${h.role}: ${h.text}`).join("\n")}`
      : "",
    `Usuario dice: "${userPhrase}"`,
  ].filter(Boolean).join("\n\n");

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }] as GeminiContent[],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.5,
    },
  };

  const url = `${BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }
  const data: GeminiResponse = await res.json();
  if (data.error) throw new Error(`Gemini: ${data.error.message}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Respuesta vacía de Gemini");
  let parsed: AssistantReply;
  try { parsed = JSON.parse(text); } catch { throw new Error("Gemini devolvió JSON inválido"); }
  parsed.spokenReply = (parsed.spokenReply ?? "").slice(0, 400);
  if (typeof parsed.confidence !== "number") parsed.confidence = 0.5;
  parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
  // Normalizar matchedIntentId
  const validIds = new Set(intents.map((i) => i.id));
  if (parsed.matchedIntentId && !validIds.has(parsed.matchedIntentId)) {
    parsed.matchedIntentId = undefined;
  }
  return parsed;
}

// ---------- Audit analysis (chat-style Q&A over activity events) ----------

export interface AuditInsight {
  answer: string;                // respuesta principal en español (1-6 frases)
  relatedEventIds: string[];     // IDs de eventos relevantes del array proporcionado
  pattern?: string;              // patrón detectado, si lo hay (opcional)
  followUpQuestions: string[];   // sugerencias de preguntas de follow-up (2-4)
}

export async function analyzeAudit(params: {
  apiKey: string;
  model: string;
  question: string;
  events: Array<{
    id: string;
    ts: string;
    actor: string;
    intent: string;
    target?: string;
    outcome: string;
    severity?: string;
    source: string;
    summary: string;
  }>;
  history?: Array<{ role: "user" | "assistant"; text: string }>;
}): Promise<AuditInsight> {
  const { apiKey, model, question, events, history = [] } = params;
  if (!apiKey) throw new Error("Falta la API key de Gemini. Configúrala en Ajustes.");

  const systemPrompt = `Eres un analista senior de operaciones y seguridad para un hogar inteligente en Costa Rica.
Analizas la bitácora de eventos (auditoría) y respondes preguntas del usuario en español.

Devuelve SIEMPRE un JSON con esta forma exacta:
{
  "answer": "respuesta clara y concisa en español (1-6 frases). Usa datos concretos del log. Si detectas algo importante, menciónalo.",
  "relatedEventIds": ["id-1", "id-2"],
  "pattern": "patrón detectado si la pregunta lo amerita, o null",
  "followUpQuestions": ["pregunta sugerida 1", "pregunta sugerida 2"]
}

Reglas:
- Español natural, tono profesional pero accesible
- "relatedEventIds" DEBE contener SOLO ids que existan en el log proporcionado
- Si el usuario pregunta por un evento específico, incluye su id en relatedEventIds
- Si el usuario pide un resumen o análisis de patrones, incluye los ids más relevantes (máx 10)
- "followUpQuestions" debe sugerir 2-4 preguntas naturales relacionadas con lo que acabas de responder
- Si no hay suficiente información para responder, dilo honestamente pero sugiere qué datos ayudarían
- NO inventes eventos ni datos que no estén en el log
- Menciona timestamps y detalles concretos cuando sean relevantes`;

  const userPrompt = [
    `Bitácora de eventos (${events.length} registros):\n${JSON.stringify(events)}`,
    history.length
      ? `Conversación previa:\n${history.map((h) => `${h.role}: ${h.text}`).join("\n")}`
      : "",
    `Pregunta del usuario: "${question}"`,
  ].filter(Boolean).join("\n\n");

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }] as GeminiContent[],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  };

  const url = `${BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }
  const data: GeminiResponse = await res.json();
  if (data.error) throw new Error(`Gemini: ${data.error.message}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Respuesta vacía de Gemini");
  let parsed: AuditInsight;
  try { parsed = JSON.parse(text); } catch { throw new Error("Gemini devolvió JSON inválido"); }

  // Sanitización
  const validEventIds = new Set(events.map((e) => e.id));
  parsed.answer = (parsed.answer ?? "").slice(0, 2000);
  parsed.relatedEventIds = (parsed.relatedEventIds ?? []).filter((id) => validEventIds.has(id)).slice(0, 10);
  parsed.followUpQuestions = (parsed.followUpQuestions ?? []).slice(0, 4);
  if (parsed.pattern && typeof parsed.pattern !== "string") parsed.pattern = undefined;
  return parsed;
}
