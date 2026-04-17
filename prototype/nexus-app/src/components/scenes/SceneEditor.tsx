"use client";

import { useState, useMemo } from "react";
import {
  useNexus, selectDevicesByPersona, selectRoomsByPersona,
} from "@/lib/store";
import type { Scene, Capability } from "@/lib/types";
import { suggestScene } from "@/lib/gemini";
import { Sparkles, Wand2, X, Plus, Trash2, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

function uid() {
  return `scene_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function SceneEditor({
  scene, onClose,
}: {
  scene: Scene | null;
  onClose: () => void;
}) {
  const personaId = useNexus((s) => s.activePersonaId);
  const devices = selectDevicesByPersona(personaId);
  const rooms = selectRoomsByPersona(personaId);
  const capabilities = useNexus((s) => s.capabilities);
  const apiKey = useNexus((s) => s.geminiApiKey);
  const model = useNexus((s) => s.geminiModel);
  const upsertScene = useNexus((s) => s.upsertScene);

  const isNew = !scene;
  const [name, setName] = useState(scene?.name ?? "");
  const [description, setDescription] = useState(scene?.description ?? "");
  const [icon, setIcon] = useState(scene?.icon ?? "Sparkles");
  const [areaIds, setAreaIds] = useState<string[]>(scene?.areaIds ?? []);
  const [targetStates, setTargetStates] = useState<Record<string, unknown>>(
    scene?.targetStates ?? {},
  );

  // IA
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  const capsByDevice = useMemo(() => {
    const map = new Map<string, Capability[]>();
    devices.forEach((d) => {
      map.set(d.id, d.capabilityIds.map((id) => capabilities[id]).filter(Boolean) as Capability[]);
    });
    return map;
  }, [devices, capabilities]);

  const toggleArea = (roomId: string) => {
    setAreaIds((prev) => prev.includes(roomId) ? prev.filter((r) => r !== roomId) : [...prev, roomId]);
  };

  const setTarget = (capId: string, value: unknown) => {
    setTargetStates((prev) => ({ ...prev, [capId]: value }));
  };
  const removeTarget = (capId: string) => {
    setTargetStates((prev) => {
      const { [capId]: _, ...rest } = prev;
      return rest;
    });
  };

  const onSave = () => {
    if (!name.trim()) {
      alert("La escena necesita un nombre");
      return;
    }
    const finalScene: Scene = {
      id: scene?.id ?? uid(),
      personaId,
      name: name.trim(),
      description: description.trim() || undefined,
      icon: icon || "Sparkles",
      areaIds,
      targetStates,
    };
    upsertScene(finalScene);
    onClose();
  };

  const askGemini = async () => {
    if (!apiKey) {
      setAiError("Configura tu API key de Gemini en Ajustes antes de usar IA.");
      return;
    }
    if (!aiPrompt.trim()) {
      setAiError("Describe qué quieres que haga la escena.");
      return;
    }
    setAiError(null);
    setAiRationale(null);
    setAiLoading(true);
    try {
      const suggestion = await suggestScene({
        apiKey, model, prompt: aiPrompt,
        devices, rooms, capabilities,
        existingScene: scene ?? undefined,
      });
      if (!name) setName(suggestion.name);
      if (!description) setDescription(suggestion.description);
      setIcon(suggestion.icon || icon);
      if (suggestion.recommendedAreas.length) setAreaIds(suggestion.recommendedAreas);
      setTargetStates((prev) => ({ ...prev, ...suggestion.targetStates }));
      setAiRationale(suggestion.rationale);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl border border-line shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">{isNew ? "Nueva escena" : `Editar · ${scene?.name}`}</h2>
            <p className="text-xs text-ink-soft mt-0.5">Configura acciones manualmente o pide ayuda a Gemini</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-surface-2" aria-label="Cerrar"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Panel IA */}
          <div className="rounded-xl border border-gold-border/40 bg-gold/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="h-4 w-4 text-gold-border" />
              <span className="font-medium text-sm">Asistente Gemini</span>
              <span className="text-[10px] text-ink-soft ml-auto font-mono">{model}</span>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder='Ej: "Una escena para leer por la noche: baja luces de suite al 30%, apaga las del resto de la casa, enciende lámpara de mesa cálida, sube calentador"'
              rows={3}
              className="w-full text-sm rounded-lg border border-line bg-surface-2 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={askGemini}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy text-cream text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {aiLoading ? "Pensando…" : "Generar con IA"}
              </button>
              {!apiKey && (
                <span className="text-[11px] text-critical flex items-center gap-1">
                  <Info className="h-3 w-3" /> Configura API key en Ajustes
                </span>
              )}
            </div>
            {aiError && <p className="text-xs text-critical mt-2">{aiError}</p>}
            {aiRationale && (
              <p className="text-xs text-ink-soft mt-2 italic">💡 {aiRationale}</p>
            )}
          </div>

          {/* Datos generales */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-soft">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
                placeholder="Ej: Modo noche"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">Icono (Lucide)</label>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm font-mono"
                placeholder="Sparkles"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-ink-soft">Descripción</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
                placeholder="Qué hace esta escena"
              />
            </div>
          </div>

          {/* Áreas */}
          <div>
            <label className="text-xs font-medium text-ink-soft">Áreas involucradas</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleArea(r.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border transition",
                    areaIds.includes(r.id)
                      ? "bg-sage/20 border-sage-border text-navy dark:text-sage"
                      : "bg-surface-2 border-line text-ink-soft hover:bg-line",
                  )}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Target states editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-ink-soft">Acciones por dispositivo ({Object.keys(targetStates).length})</label>
            </div>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {devices
                .filter((d) => areaIds.length === 0 || areaIds.includes(d.roomId))
                .map((d) => {
                  const caps = capsByDevice.get(d.id) ?? [];
                  return (
                    <div key={d.id} className="rounded-lg border border-line bg-surface-2 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">{d.name}</div>
                        <div className="text-[10px] text-ink-soft">{d.kind} · {d.vendor}</div>
                      </div>
                      <div className="space-y-2">
                        {caps.map((c) => (
                          <CapabilityRow
                            key={c.id}
                            cap={c}
                            value={targetStates[c.id]}
                            onChange={(v) => setTarget(c.id, v)}
                            onRemove={() => removeTarget(c.id)}
                            isSet={Object.prototype.hasOwnProperty.call(targetStates, c.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2 bg-surface-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-line text-sm hover:bg-surface">Cancelar</button>
          <button onClick={onSave} className="px-4 py-2 rounded-lg bg-navy text-cream text-sm font-medium hover:opacity-90">
            {isNew ? "Crear escena" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CapabilityRow({
  cap, value, onChange, onRemove, isSet,
}: {
  cap: Capability;
  value: unknown;
  onChange: (v: unknown) => void;
  onRemove: () => void;
  isSet: boolean;
}) {
  const label = `${cap.kind}${cap.unit ? ` (${cap.unit})` : ""}`;
  const editor = (() => {
    switch (cap.kind) {
      case "on_off":
        return (
          <select
            value={String(value === true ? "true" : value === false ? "false" : "")}
            onChange={(e) => onChange(e.target.value === "true")}
            className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
          >
            <option value="">—</option>
            <option value="true">Encender</option>
            <option value="false">Apagar</option>
          </select>
        );
      case "dim":
        return (
          <input
            type="number" min={0} max={100}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 rounded-md border border-line bg-surface px-2 py-1 text-xs"
            placeholder="0-100"
          />
        );
      case "color_temp":
        return (
          <input
            type="number" min={2200} max={6500}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24 rounded-md border border-line bg-surface px-2 py-1 text-xs"
            placeholder="2700"
          />
        );
      case "rgb":
        return (
          <input
            type="color"
            value={typeof value === "string" ? value : "#FFFFFF"}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-12 rounded border border-line bg-surface"
          />
        );
      case "valve":
      case "lock":
        return (
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
          >
            <option value="">—</option>
            {cap.kind === "valve" ? (
              <>
                <option value="open">Abrir</option>
                <option value="closed">Cerrar</option>
              </>
            ) : (
              <>
                <option value="locked">Bloquear</option>
                <option value="unlocked">Desbloquear</option>
              </>
            )}
          </select>
        );
      case "thermostat": {
        const v = (value && typeof value === "object" ? value : {}) as { mode?: string; target?: number };
        return (
          <div className="flex gap-1">
            <select
              value={v.mode ?? ""}
              onChange={(e) => onChange({ ...v, mode: e.target.value })}
              className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
            >
              <option value="">—</option>
              <option value="cool">Frío</option>
              <option value="heat">Calor</option>
              <option value="off">Apagar</option>
            </select>
            <input
              type="number" min={16} max={30}
              value={typeof v.target === "number" ? v.target : ""}
              onChange={(e) => onChange({ ...v, target: Number(e.target.value) })}
              className="w-16 rounded-md border border-line bg-surface px-2 py-1 text-xs"
              placeholder="°C"
            />
          </div>
        );
      }
      case "audio": {
        const v = (value && typeof value === "object" ? value : {}) as { playing?: boolean; volume?: number };
        return (
          <div className="flex gap-1">
            <select
              value={String(v.playing === true ? "true" : v.playing === false ? "false" : "")}
              onChange={(e) => onChange({ ...v, playing: e.target.value === "true" })}
              className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
            >
              <option value="">—</option>
              <option value="true">Play</option>
              <option value="false">Stop</option>
            </select>
            <input
              type="number" min={0} max={100}
              value={typeof v.volume === "number" ? v.volume : ""}
              onChange={(e) => onChange({ ...v, volume: Number(e.target.value) })}
              className="w-16 rounded-md border border-line bg-surface px-2 py-1 text-xs"
              placeholder="vol"
            />
          </div>
        );
      }
      default:
        return <span className="text-[10px] text-ink-soft italic">No editable</span>;
    }
  })();

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <div className="flex-1 text-ink-soft">
        {isSet && <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold mr-1.5" />}
        {label}
      </div>
      {editor}
      {isSet ? (
        <button onClick={onRemove} className="p-1 rounded hover:bg-critical/20 text-critical" aria-label="Quitar">
          <Trash2 size={12} />
        </button>
      ) : (
        <button
          onClick={() => onChange(cap.value)}
          className="p-1 rounded hover:bg-line text-ink-soft"
          aria-label="Añadir"
          title="Añadir al escena con valor actual"
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );
}
