"use client";

import { useState } from "react";
import { useNexus, selectActivityByPersona } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Search, Download } from "lucide-react";

export default function AuditPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const all = useNexus((s) => s.activity);
  const items = selectActivityByPersona(personaId, all);
  const [q, setQ] = useState("");
  const [actor, setActor] = useState<string>("all");

  const filtered = items.filter((a) => {
    if (actor !== "all" && a.actor !== actor) return false;
    if (q && !a.summary.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  function exportCsv() {
    const header = "ts,actor,intent,target,outcome,severity,source,summary";
    const rows = filtered.map((a) => [a.ts, a.actor, a.intent, a.target, a.outcome, a.severity, a.source, JSON.stringify(a.summary)].join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit_${personaId}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Auditoría</h1>
          <p className="text-sm text-ink-soft mt-1">Bitácora completa · {items.length} eventos</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-line bg-surface-2 text-sm hover:bg-line">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-line">
          <Search size={16} className="text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar evento..." className="bg-transparent flex-1 outline-none text-sm" />
        </div>
        <select value={actor} onChange={(e) => setActor(e.target.value)} className="px-3 py-2 rounded-lg bg-surface border border-line text-sm">
          <option value="all">Todos los actores</option>
          <option value="user">Usuario</option>
          <option value="system">Sistema</option>
          <option value="rule">Regla</option>
          <option value="voice">Voz</option>
        </select>
      </Card>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase text-ink-soft">
              <tr>
                <th className="text-left px-4 py-3">Timestamp</th>
                <th className="text-left px-4 py-3">Actor</th>
                <th className="text-left px-4 py-3">Intent</th>
                <th className="text-left px-4 py-3">Target</th>
                <th className="text-left px-4 py-3">Severidad</th>
                <th className="text-left px-4 py-3">Resumen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-line hover:bg-surface/60">
                  <td className="px-4 py-2.5 text-xs font-mono text-ink-soft">{new Date(a.ts).toLocaleString("es-CR")}</td>
                  <td className="px-4 py-2.5"><Badge tone="neutral">{a.actor}</Badge></td>
                  <td className="px-4 py-2.5 text-xs font-mono">{a.intent}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-ink-soft">{a.target}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={a.severity === "critical" ? "critical" : a.severity === "warn" ? "warn" : "ok"}>{a.severity}</Badge>
                  </td>
                  <td className="px-4 py-2.5">{a.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="px-4 py-10 text-center text-ink-soft text-sm">Sin resultados</div>}
        </CardBody>
      </Card>
    </div>
  );
}
