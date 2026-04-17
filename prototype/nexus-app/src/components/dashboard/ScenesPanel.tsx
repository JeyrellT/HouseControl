"use client";

import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { useNexus, selectScenesByPersona } from "@/lib/store";
import { Sparkles, Play } from "lucide-react";

export function ScenesPanel() {
  const personaId = useNexus((s) => s.activePersonaId);
  const runScene = useNexus((s) => s.runScene);
  const role = useNexus((s) => s.activeRole);
  const scenes = selectScenesByPersona(personaId);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Escenas</CardTitle>
        <Sparkles size={16} className="text-gold-border" />
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-2">
          {scenes.map((s) => (
            <button
              key={s.id}
              onClick={() => runScene(s.id)}
              disabled={role === "viewer"}
              className="text-left p-3 rounded-xl bg-surface hover:bg-line transition border border-line group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gold/15 text-gold-border flex items-center justify-center group-hover:bg-gold/25 transition">
                  <Play size={12} />
                </div>
                <div className="font-medium text-sm">{s.name}</div>
              </div>
              {s.description && (
                <div className="mt-1.5 text-[11px] text-ink-soft line-clamp-2">{s.description}</div>
              )}
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
