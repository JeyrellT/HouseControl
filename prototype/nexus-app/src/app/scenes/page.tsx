"use client";

import { useState } from "react";
import { useNexus, selectActivePersona, selectScenesByPersona } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Play, Sparkles, Pencil, Copy, Trash2, Plus, Wand2 } from "lucide-react";
import { SceneEditor } from "@/components/scenes/SceneEditor";
import type { Scene } from "@/lib/types";

export default function ScenesPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const persona = selectActivePersona(personaId);
  const userScenes = useNexus((s) => s.userScenes);
  const deletedSeedSceneIds = useNexus((s) => s.deletedSeedSceneIds);
  const scenes = selectScenesByPersona(personaId, userScenes, deletedSeedSceneIds);
  const runScene = useNexus((s) => s.runScene);
  const deleteScene = useNexus((s) => s.deleteScene);
  const upsertScene = useNexus((s) => s.upsertScene);
  const role = useNexus((s) => s.activeRole);
  const apiKey = useNexus((s) => s.geminiApiKey);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  const canEdit = role === "owner" || role === "admin";

  const openNew = () => { setEditingScene(null); setEditorOpen(true); };
  const openEdit = (s: Scene) => { setEditingScene(s); setEditorOpen(true); };
  const duplicate = (s: Scene) => {
    const copy: Scene = {
      ...s,
      id: `scene_${Date.now().toString(36)}`,
      name: `${s.name} (copia)`,
    };
    upsertScene(copy);
  };
  const remove = (s: Scene) => {
    if (confirm(`¿Eliminar la escena "${s.name}"?`)) deleteScene(s.id);
  };

  const isUserScene = (s: Scene) => userScenes.some((u) => u.id === s.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Escenas</h1>
          <p className="text-sm text-ink-soft mt-1">
            {scenes.length} escena(s) para {persona.name}
            {!apiKey && <span className="ml-2 text-gold-border text-xs">· IA disponible tras configurar API key</span>}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy text-cream text-sm font-medium hover:opacity-90"
            >
              <Plus size={16} /> Nueva escena
            </button>
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gold-border text-gold-border text-sm font-medium hover:bg-gold/10"
              title="Crea una escena y usa el asistente IA"
            >
              <Wand2 size={16} /> Generar con IA
            </button>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map((s) => {
          const editable = canEdit && isUserScene(s);
          return (
            <Card key={s.id} className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold-border flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{s.name}</div>
                    {isUserScene(s) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sage/20 text-navy dark:text-sage border border-sage-border">custom</span>
                    )}
                  </div>
                  <div className="text-xs text-ink-soft mt-1">
                    {s.areaIds.length} ambiente(s) · {Object.keys(s.targetStates).length} acción(es)
                  </div>
                </div>
              </div>
              {s.description && (
                <p className="text-sm text-ink-soft leading-relaxed line-clamp-3">{s.description}</p>
              )}
              <div className="mt-auto space-y-2">
                <button
                  onClick={() => runScene(s.id)}
                  disabled={role === "viewer"}
                  className="w-full px-4 py-2.5 rounded-lg bg-navy text-cream font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={14} /> Activar escena
                </button>
                {canEdit && (
                  <div className="flex gap-1">
                    {editable ? (
                      <button
                        onClick={() => openEdit(s)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs hover:bg-surface-2"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                    ) : (
                      <button
                        onClick={() => duplicate(s)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs hover:bg-surface-2"
                        title="Duplica la escena predefinida para poder editarla"
                      >
                        <Copy size={12} /> Duplicar para editar
                      </button>
                    )}
                    <button
                      onClick={() => remove(s)}
                      className="px-2 py-1.5 rounded-lg border border-line text-xs hover:bg-critical/10 hover:text-critical"
                      aria-label="Eliminar"
                      title={isUserScene(s) ? "Eliminar" : "Ocultar escena predefinida"}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {editorOpen && (
        <SceneEditor scene={editingScene} onClose={() => setEditorOpen(false)} />
      )}
    </div>
  );
}
