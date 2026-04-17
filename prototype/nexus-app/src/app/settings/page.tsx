"use client";

import { useNexus } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const presentation = useNexus((s) => s.presentationMode);
  const togglePresentation = useNexus((s) => s.togglePresentation);
  const density = useNexus((s) => s.density);
  const setDensity = useNexus((s) => s.setDensity);
  const role = useNexus((s) => s.activeRole);
  const setRole = useNexus((s) => s.setRole);
  const reset = useNexus((s) => s.resetDemo);
  const geminiApiKey = useNexus((s) => s.geminiApiKey);
  const setGeminiApiKey = useNexus((s) => s.setGeminiApiKey);
  const geminiModel = useNexus((s) => s.geminiModel);
  const setGeminiModel = useNexus((s) => s.setGeminiModel);
  const [showKey, setShowKey] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl">Ajustes</h1>
        <p className="text-sm text-ink-soft mt-1">Preferencias del prototipo</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Apariencia</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          {mounted && (
            <Row label="Tema">
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="px-3 py-1.5 rounded-lg border border-line bg-surface text-sm">
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="system">Sistema</option>
              </select>
            </Row>
          )}
          <Row label="Densidad">
            <div className="flex gap-2">
              {(["minimal", "dense"] as const).map((d) => (
                <button key={d} onClick={() => setDensity(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${density === d ? "bg-sage/20 border-sage-border" : "border-line bg-surface"}`}>
                  {d === "minimal" ? "Minimalista" : "Densa"}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Modo presentación" hint="Oculta controles de desarrollador y aumenta tipografía">
            <button onClick={togglePresentation}
              className={`px-3 py-1.5 rounded-lg text-sm border ${presentation ? "bg-gold/20 border-gold-border" : "border-line bg-surface"}`}>
              {presentation ? "Activado" : "Desactivado"}
            </button>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>RBAC (rol activo)</CardTitle></CardHeader>
        <CardBody>
          <Row label="Rol" hint="Determina qué controles puede manipular">
            <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}
              className="px-3 py-1.5 rounded-lg border border-line bg-surface text-sm">
              <option value="owner">Owner — control total</option>
              <option value="admin">Admin — gestión</option>
              <option value="technician">Technician — instalación</option>
              <option value="viewer">Viewer — solo lectura</option>
            </select>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Inteligencia Artificial (Gemini)</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Row label="API key" hint="Obtén una gratuita en aistudio.google.com/app/apikey">
            <div className="flex gap-2 items-center">
              <input
                type={showKey ? "text" : "password"}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIza…"
                className="px-3 py-1.5 rounded-lg border border-line bg-surface text-sm font-mono w-64"
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="px-3 py-1.5 rounded-lg text-xs border border-line bg-surface"
              >
                {showKey ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </Row>
          <Row label="Modelo" hint="gemini-2.5-flash es gratuito y rápido">
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-line bg-surface text-sm"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash (recomendado)</option>
              <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (más rápido)</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro (mejor calidad)</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash</option>
            </select>
          </Row>
          {!geminiApiKey && (
            <p className="text-xs text-ink-soft">
              Sin API key, el asistente IA de escenas estará deshabilitado. La clave se guarda solo en este navegador.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Datos</CardTitle></CardHeader>
        <CardBody>
          <Row label="Reset demo" hint="Restaura capabilities y actividad al estado seed">
            <button onClick={reset} className="px-3 py-1.5 rounded-lg text-sm bg-status-critical text-white">
              Reiniciar
            </button>
          </Row>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-ink-soft">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
