"use client";

import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GitBranch, Sunrise, Moon, ShieldAlert, Droplets } from "lucide-react";

const RULES = [
  { id: "r-1", name: "Buenos días", trigger: "07:00 entre semana", action: "scene.activate(buenos-dias)", icon: Sunrise, status: "active" },
  { id: "r-2", name: "Buenas noches", trigger: "22:00 todos los días", action: "scene.activate(buenas-noches)", icon: Moon, status: "active" },
  { id: "r-3", name: "Modo ausente", trigger: "Geofence salida 200m", action: "scene.activate(fuera-casa)", icon: ShieldAlert, status: "active" },
  { id: "r-4", name: "Riego adaptativo", trigger: "06:00 si humedad < 40%", action: "scene.activate(riego-am)", icon: Droplets, status: "paused" },
  { id: "r-5", name: "Tarde fresca", trigger: "Temperatura > 26°C", action: "thermostat.set(23)", icon: GitBranch, status: "active" },
];

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Reglas y automatizaciones</h1>
        <p className="text-sm text-ink-soft mt-1">Motor de orquestación · trigger → conditions → actions</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {RULES.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage/15 text-sage-border flex items-center justify-center">
                <r.icon size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{r.name}</div>
                  <Badge tone={r.status === "active" ? "ok" : "warn"}>{r.status}</Badge>
                </div>
                <div className="mt-2 text-xs space-y-1 font-mono">
                  <div><span className="text-ink-soft">when</span> {r.trigger}</div>
                  <div><span className="text-ink-soft">then</span> {r.action}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 bg-gold/10 border-gold-border">
        <div className="text-sm">
          <strong>Nota:</strong> El motor de reglas DSL completo está planificado en Rev 6 (rules-engine extensible). Esta vista muestra reglas mock no editables.
        </div>
      </Card>
    </div>
  );
}
