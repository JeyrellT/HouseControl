"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  STATIC, useNexus, selectDevicesByPersona, selectGatewaysByPersona,
  selectActivityByPersona,
} from "@/lib/store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Platform, Protocol, GatewayNode, Device } from "@/lib/types";
import {
  Cloud, Wifi, Radio, Bluetooth, Network, Server, KeyRound,
  Activity as ActivityIcon, Zap, ChevronDown, Plug, CircleDot,
  ShieldCheck, AlertTriangle, Signal, Gauge, Share2, Rocket,
  Settings, Eye, EyeOff, Copy, CheckCircle2, X, ExternalLink, Globe, Lock, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Config visual por vendor ----------
type VendorVisual = {
  gradient: string;
  accent: string;
  soft: string;
  label: string;
  tagline: string;
};
const VENDOR_VISUALS: Record<string, VendorVisual> = {
  tuya: {
    gradient: "from-orange-500/90 via-amber-500/80 to-yellow-400/70",
    accent: "#F97316", soft: "bg-orange-500/10",
    label: "Tuya Cloud", tagline: "Wi-Fi · Cloud-first",
  },
  smartthings: {
    gradient: "from-sky-500/90 via-blue-500/80 to-indigo-500/70",
    accent: "#0EA5E9", soft: "bg-sky-500/10",
    label: "SmartThings", tagline: "Zigbee + Z-Wave hub",
  },
  ubiquiti: {
    gradient: "from-teal-500/90 via-cyan-500/80 to-sky-400/70",
    accent: "#14B8A6", soft: "bg-teal-500/10",
    label: "UniFi Protect", tagline: "Vigilancia local",
  },
  crestron: {
    gradient: "from-slate-600/90 via-indigo-600/80 to-violet-500/70",
    accent: "#6366F1", soft: "bg-indigo-500/10",
    label: "Crestron Home", tagline: "Control pro on-prem",
  },
  rainbird: {
    gradient: "from-emerald-500/90 via-green-500/80 to-lime-400/70",
    accent: "#10B981", soft: "bg-emerald-500/10",
    label: "Rain Bird", tagline: "Riego inteligente",
  },
  sonos: {
    gradient: "from-purple-500/90 via-fuchsia-500/80 to-pink-500/70",
    accent: "#A855F7", soft: "bg-purple-500/10",
    label: "Sonos", tagline: "Audio multi-zona",
  },
};
const DEFAULT_VISUAL: VendorVisual = {
  gradient: "from-slate-500/90 via-slate-400/80 to-slate-300/70",
  accent: "#64748B", soft: "bg-slate-500/10",
  label: "Plataforma", tagline: "Integración externa",
};

// ---------- Config de protocolos ----------
const PROTOCOL_META: Record<Protocol, { label: string; color: string; Icon: typeof Wifi }> = {
  wifi:   { label: "Wi-Fi",    color: "#0EA5E9", Icon: Wifi },
  zigbee: { label: "Zigbee",   color: "#F59E0B", Icon: Radio },
  zwave:  { label: "Z-Wave",   color: "#6366F1", Icon: Radio },
  thread: { label: "Thread",   color: "#14B8A6", Icon: Network },
  matter: { label: "Matter",   color: "#A855F7", Icon: Network },
  ble:    { label: "BLE",      color: "#EC4899", Icon: Bluetooth },
  mqtt:   { label: "MQTT",     color: "#10B981", Icon: Server },
  rest:   { label: "REST",     color: "#94A3B8", Icon: Cloud },
  coap:   { label: "CoAP",     color: "#64748B", Icon: Cloud },
};

// ---------- Helpers ----------
function latencyTone(ms: number): { label: string; color: string; pct: number } {
  if (ms < 200) return { label: "Excelente", color: "#5BB37F", pct: 15 };
  if (ms < 500) return { label: "Bueno", color: "#5BB37F", pct: 35 };
  if (ms < 1000) return { label: "Moderado", color: "#E0A537", pct: 65 };
  return { label: "Alto", color: "#D9534F", pct: 90 };
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function oauthUrgency(days: number | null): { tone: "ok" | "warn" | "critical"; label: string } {
  if (days === null) return { tone: "ok", label: "Sin OAuth" };
  if (days < 7) return { tone: "critical", label: `${days}d` };
  if (days < 30) return { tone: "warn", label: `${days}d` };
  return { tone: "ok", label: `${days}d` };
}

// ---------- Credenciales demo por vendor ----------
type VendorCredentials = {
  endpoint: string;
  apiKey: string;
  username: string;
  password: string;
  clientId?: string;
  clientSecret?: string;
  region?: string;
  protocol?: string;
  notes?: string;
};

const DEMO_CREDENTIALS: Record<string, VendorCredentials> = {
  tuya: {
    endpoint: "https://openapi.tuyaus.com",
    apiKey: "tuya_ak_f8c2e91d4a7b3c5e",
    username: "admin@villa-aurora.io",
    password: "Tuya$ecure2024!",
    clientId: "txkwp8n5rjhvd3f7eq42",
    clientSecret: "d7f9a1b3c5e8024f6a8b1c3d5e7f9a0b",
    region: "us-west-1",
    protocol: "HTTPS / MQTT",
    notes: "Cloud API v2.0 — refresco de token cada 2h automático.",
  },
  smartthings: {
    endpoint: "https://api.smartthings.com/v1",
    apiKey: "st-pat-k7m2n9p4q6r1s8t3u5v0w",
    username: "nexus-hub@villa-aurora.io",
    password: "SmartT#Hub2024",
    clientId: "aef7c2d1-4b8a-4e3f-9a1c-6d5e8f7b2a0c",
    clientSecret: "c0a9b8d7e6f5-4321-8765-abcdef012345",
    region: "NA",
    protocol: "REST / Zigbee / Z-Wave",
    notes: "PAT con scope devices:*, scenes:*. Hub v45.12 firmware.",
  },
  ubiquiti: {
    endpoint: "https://192.168.1.10:7443",
    apiKey: "unifi_api_a3b7c9d2e4f6",
    username: "unifi-admin",
    password: "Un1f1Protect@2024!",
    region: "Local LAN",
    protocol: "HTTPS / RTSP",
    notes: "UniFi OS 3.x. RTSP streams en puerto 7447. SSL auto-firmado.",
  },
  crestron: {
    endpoint: "https://192.168.1.50:41794",
    apiKey: "crestron_xio_9f8e7d6c5b4a",
    username: "crestron-master",
    password: "Cre$tron!2024Pro",
    clientId: "nexus-crestron-bridge",
    protocol: "CIP / REST",
    notes: "Procesador CP4N. Puerto CIP 41794. Auto-discovery activo.",
  },
  rainbird: {
    endpoint: "https://api.rainbird.com/v2",
    apiKey: "rb_live_m4n7p2q9r1s6t8",
    username: "garden@villa-aurora.io",
    password: "Ra1nB!rd2024",
    clientId: "rb-nexus-integration",
    clientSecret: "e5f6a7b8c9d0-1234-5678-9abcdef01234",
    region: "US-Central",
    protocol: "REST / Wi-Fi",
    notes: "ESP-TM2 8 zonas. Sensor lluvia activo. Flow sensor instalado.",
  },
  sonos: {
    endpoint: "https://api.ws.sonos.com/control/api/v1",
    apiKey: "sonos_ak_b2c4d6e8f0a1",
    username: "media@villa-aurora.io",
    password: "Son0s!Audio2024",
    clientId: "sonos-nexus-app-id",
    clientSecret: "a1b2c3d4e5f6-7890-abcd-ef0123456789",
    protocol: "REST / SMAPI",
    notes: "Household con 6 speakers. Agrupación dinámica. S2 firmware.",
  },
};

// ---------- Fila de credencial con copy + reveal ----------
function CredentialRow({
  label,
  value,
  sensitive = false,
  icon: Icon,
  mono = false,
}: {
  label: string;
  value: string;
  sensitive?: boolean;
  icon: typeof KeyRound;
  mono?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const display = sensitive && !revealed ? "•".repeat(Math.min(value.length, 20)) : value;

  return (
    <div className="flex items-center gap-3 group py-2.5 px-3 rounded-xl hover:bg-surface transition">
      <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-ink-soft" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-ink-soft uppercase tracking-wider">{label}</p>
        <p className={cn(
          "text-sm truncate",
          mono && "font-mono text-xs",
          sensitive && !revealed && "text-ink-soft select-none",
        )}>
          {display}
        </p>
      </div>
      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition shrink-0">
        {sensitive && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="p-2 sm:p-1.5 rounded-lg hover:bg-surface-2 transition text-ink-soft hover:text-ink"
            title={revealed ? "Ocultar" : "Mostrar"}
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-2 sm:p-1.5 rounded-lg hover:bg-surface-2 transition text-ink-soft hover:text-ink"
          title="Copiar"
        >
          {copied ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-status-ok" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ---------- Modal de configuración de plataforma ----------
function PlatformConfigModal({
  platform,
  onClose,
}: {
  platform: Platform;
  onClose: () => void;
}) {
  const visual = VENDOR_VISUALS[platform.vendor] ?? DEFAULT_VISUAL;
  const creds = DEMO_CREDENTIALS[platform.vendor];
  const online = platform.status === "online";
  const days = daysUntil(platform.oauthExpiresAt);
  const oauth = oauthUrgency(days);

  if (!creds) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl bg-surface-2 border border-line shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header con gradient */}
        <div className={`relative bg-gradient-to-r ${visual.gradient} p-4 sm:p-5`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white shadow-lg">
                <Cloud className="h-5 w-5" />
              </div>
              <div className="text-white">
                <h2 className="font-display text-xl">{visual.label}</h2>
                <p className="text-white/70 text-xs">{visual.tagline}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative flex items-center gap-2 mt-3">
            <Badge tone={online ? "ok" : "critical"}>
              {online ? "Conectado" : "Desconectado"}
            </Badge>
            <Badge tone={oauth.tone}>OAuth {oauth.label}</Badge>
            {platform.quotaRemaining !== undefined && (
              <Badge tone="sage">Cuota: {platform.quotaRemaining.toLocaleString()}</Badge>
            )}
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Conexión */}
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-ink-soft mb-1 flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              Conexión
            </h3>
            <div className="rounded-xl border border-line divide-y divide-line">
              <CredentialRow label="Endpoint" value={creds.endpoint} icon={ExternalLink} mono />
              {creds.region && (
                <CredentialRow label="Región" value={creds.region} icon={Globe} />
              )}
              {creds.protocol && (
                <CredentialRow label="Protocolo" value={creds.protocol} icon={Wifi} />
              )}
            </div>
          </div>

          {/* Autenticación */}
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-ink-soft mb-1 flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              Autenticación
            </h3>
            <div className="rounded-xl border border-line divide-y divide-line">
              <CredentialRow label="Usuario" value={creds.username} icon={Settings} mono />
              <CredentialRow label="Contraseña" value={creds.password} icon={KeyRound} sensitive mono />
              <CredentialRow label="API Key" value={creds.apiKey} icon={KeyRound} sensitive mono />
              {creds.clientId && (
                <CredentialRow label="Client ID" value={creds.clientId} icon={Shield} mono />
              )}
              {creds.clientSecret && (
                <CredentialRow label="Client Secret" value={creds.clientSecret} icon={Shield} sensitive mono />
              )}
            </div>
          </div>

          {/* Métricas */}
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-ink-soft mb-1 flex items-center gap-1.5">
              <ActivityIcon className="h-3 w-3" />
              Métricas
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-line p-2 sm:p-3 text-center">
                <p className="text-[10px] text-ink-soft uppercase">Latencia</p>
                <p className="text-base sm:text-lg font-bold tabular-nums" style={{ color: latencyTone(platform.latencyMs).color }}>
                  {platform.latencyMs}<span className="text-xs text-ink-soft ml-0.5">ms</span>
                </p>
              </div>
              <div className="rounded-xl border border-line p-2 sm:p-3 text-center">
                <p className="text-[10px] text-ink-soft uppercase">Dispositivos</p>
                <p className="text-base sm:text-lg font-bold tabular-nums" style={{ color: visual.accent }}>
                  {platform.devicesDiscovered}
                </p>
              </div>
              <div className="rounded-xl border border-line p-2 sm:p-3 text-center">
                <p className="text-[10px] text-ink-soft uppercase">Estado</p>
                <p className="text-base sm:text-lg">
                  {online ? "🟢" : "🔴"}
                </p>
              </div>
            </div>
          </div>

          {/* Notas */}
          {creds.notes && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-gold/5 border border-gold-border/20 text-xs text-ink-soft">
              <AlertTriangle className="h-4 w-4 text-gold-border shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-ink text-[11px]">Notas de configuración</p>
                <p className="mt-0.5">{creds.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-line flex items-center justify-between bg-surface/50">
          <p className="text-[10px] text-ink-soft flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Credenciales de demostración
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-navy text-cream hover:bg-navy-soft transition"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- Anillo SVG animado de cuota ----------
function QuotaRing({ remaining, max = 5000, color }: { remaining: number; max?: number; color: string }) {
  const pct = Math.min(100, (remaining / max) * 100);
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={48} height={48} viewBox="0 0 48 48">
        <circle cx={24} cy={24} r={r} stroke="currentColor" strokeWidth={3}
          className="text-line/50" fill="none" />
        <motion.circle
          cx={24} cy={24} r={r} stroke={color} strokeWidth={3} fill="none"
          strokeLinecap="round" transform="rotate(-90 24 24)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
        {Math.round(pct)}%
      </div>
    </div>
  );
}

// ---------- Barra de latencia animada con zonas ----------
function LatencyBar({ ms }: { ms: number }) {
  const { label, color, pct } = latencyTone(ms);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-ink-soft">
        <span className="flex items-center gap-1"><Signal className="h-3 w-3" /> Latencia</span>
        <span className="tabular-nums font-semibold" style={{ color }}>{ms} ms · {label}</span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden relative">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-status-ok/20" />
          <div className="flex-1 bg-status-warn/20" />
          <div className="flex-1 bg-status-critical/20" />
        </div>
        <motion.div
          className="relative h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ---------- Pulso "heartbeat" online ----------
function Heartbeat({ color, online }: { color: string; online: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      {online && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <span
        className="relative w-2 h-2 rounded-full"
        style={{ backgroundColor: online ? color : "#94A3B8" }}
      />
    </div>
  );
}

// ---------- KPI animado del hero ----------
function HeroStat({
  icon: Icon, label, value, suffix, tone,
}: {
  icon: typeof Wifi; label: string; value: string | number; suffix?: string; tone: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-xl border border-line bg-surface-2/60 backdrop-blur p-4 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: tone }} />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-soft">
          <Icon className="h-3 w-3" style={{ color: tone }} />
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums" style={{ color: tone }}>{value}</span>
          {suffix && <span className="text-xs text-ink-soft">{suffix}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ---------- Barra apilada de protocolos ----------
function ProtocolDistribution({ devices }: { devices: Device[] }) {
  const counts = devices.reduce<Record<string, number>>((acc, d) => {
    acc[d.protocol] = (acc[d.protocol] ?? 0) + 1;
    return acc;
  }, {});
  const total = devices.length || 1;
  const entries = (Object.keys(counts) as Protocol[])
    .sort((a, b) => counts[b] - counts[a]);

  return (
    <div className="space-y-3">
      <div className="flex h-8 rounded-lg overflow-hidden border border-line">
        {entries.map((p, i) => {
          const meta = PROTOCOL_META[p];
          const pct = (counts[p] / total) * 100;
          return (
            <motion.div
              key={p}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${pct}%`, opacity: 1 }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
              style={{ backgroundColor: meta.color }}
              className="relative group cursor-help"
              title={`${meta.label}: ${counts[p]} dispositivos`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90 opacity-0 group-hover:opacity-100 transition">
                {counts[p]}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {entries.map((p) => {
          const meta = PROTOCOL_META[p];
          const Icon = meta.Icon;
          return (
            <div key={p} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
              <Icon className="h-3 w-3" style={{ color: meta.color }} />
              <span className="text-ink">{meta.label}</span>
              <span className="text-ink-soft tabular-nums">{counts[p]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Platform card (todo junto + expand) ----------
function PlatformCard({
  platform, inSite, devices, activityCount, expanded, onToggle, onConfigure, index,
}: {
  platform: Platform;
  inSite: number;
  devices: Device[];
  activityCount: number;
  expanded: boolean;
  onToggle: () => void;
  onConfigure: () => void;
  index: number;
}) {
  const visual = VENDOR_VISUALS[platform.vendor] ?? DEFAULT_VISUAL;
  const online = platform.status === "online";
  const days = daysUntil(platform.oauthExpiresAt);
  const oauth = oauthUrgency(days);

  const vendorDevices = devices.filter((d) => d.vendor === platform.vendor);
  const protocols = Array.from(new Set(vendorDevices.map((d) => d.protocol)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
      layout
      className="rounded-2xl border border-line bg-surface-2 shadow-soft overflow-hidden relative"
    >
      {/* Top gradient strip */}
      <div className={`h-1.5 bg-gradient-to-r ${visual.gradient}`} />

      <div className="p-5">
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${visual.gradient} flex items-center justify-center text-white shadow-soft`}
          >
            <Cloud size={20} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-ink truncate">{visual.label}</div>
              <Heartbeat color={visual.accent} online={online} />
            </div>
            <div className="text-[11px] text-ink-soft">{visual.tagline}</div>
          </div>
          <button
            onClick={onToggle}
            className="text-ink-soft hover:text-ink transition p-1 rounded-md hover:bg-surface"
            aria-label={expanded ? "Contraer" : "Expandir"}
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <LatencyBar ms={platform.latencyMs} />

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            <div className={`rounded-lg ${visual.soft} p-1.5 sm:p-2`}>
              <div className="text-[9px] sm:text-[10px] text-ink-soft uppercase tracking-wide">Descubiertos</div>
              <div className="text-base sm:text-lg font-bold tabular-nums" style={{ color: visual.accent }}>
                {platform.devicesDiscovered}
              </div>
            </div>
            <div className="rounded-lg bg-surface p-1.5 sm:p-2">
              <div className="text-[9px] sm:text-[10px] text-ink-soft uppercase tracking-wide">En sitio</div>
              <div className="text-base sm:text-lg font-bold tabular-nums text-ink">{inSite}</div>
            </div>
            <div className="rounded-lg bg-surface p-1.5 sm:p-2">
              <div className="text-[9px] sm:text-[10px] text-ink-soft uppercase tracking-wide">Eventos hoy</div>
              <div className="text-base sm:text-lg font-bold tabular-nums text-ink">{activityCount}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-ink-soft" />
              <span className="text-[11px] text-ink-soft">OAuth</span>
              <Badge tone={oauth.tone}>{oauth.label}</Badge>
            </div>
            {platform.quotaRemaining !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-soft">Cuota</span>
                <QuotaRing remaining={platform.quotaRemaining} color={visual.accent} />
              </div>
            )}
          </div>

          {/* Botón configurar */}
          <button
            onClick={onConfigure}
            className={cn(
              "w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition",
              "border border-line hover:border-gold-border/40 bg-surface hover:bg-gold/5 text-ink-soft hover:text-ink",
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            Configurar
          </button>
        </div>

        {/* Expandable detail */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-line space-y-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-soft mb-1.5">
                    Protocolos en uso ({protocols.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {protocols.map((p) => {
                      const meta = PROTOCOL_META[p];
                      const Icon = meta.Icon;
                      return (
                        <span
                          key={p}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border"
                          style={{ borderColor: `${meta.color}40`, color: meta.color, backgroundColor: `${meta.color}14` }}
                        >
                          <Icon className="h-3 w-3" /> {meta.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {vendorDevices.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-soft mb-1.5">
                      Dispositivos vinculados ({vendorDevices.length})
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {vendorDevices.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-md text-[11px] hover:bg-surface transition"
                        >
                          <CircleDot className="h-3 w-3" style={{ color: visual.accent }} />
                          <span className="flex-1 truncate text-ink">{d.name}</span>
                          <span className="text-ink-soft text-[10px] uppercase">{d.kind}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---------- Network topology (gateways con dispositivos hospedados) ----------
function NetworkTopology({ gateways, devices }: { gateways: GatewayNode[]; devices: Device[] }) {
  if (gateways.length === 0) {
    return (
      <div className="text-sm text-ink-soft text-center py-6">
        Sin gateways locales registrados para esta persona.
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {gateways.map((g, i) => {
        const hosted = devices.filter((d) => g.hostedDeviceIds.includes(d.id));
        const online = g.status === "online";
        const meta = PROTOCOL_META[g.protocol];
        return (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="relative"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl border border-line bg-surface">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-white shadow-soft"
                style={{ backgroundColor: meta.color }}
              >
                <Server className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{g.name}</span>
                  <Heartbeat color={meta.color} online={online} />
                </div>
                <div className="text-[11px] text-ink-soft">
                  {g.kind} · <span style={{ color: meta.color }}>{meta.label}</span> ·{" "}
                  hospeda {hosted.length} dispositivo{hosted.length === 1 ? "" : "s"}
                </div>
              </div>
              <Badge tone={online ? "ok" : "critical"}>{g.status}</Badge>
            </div>

            {hosted.length > 0 && (
              <div className="ml-6 mt-2 relative pl-5 border-l-2 border-dashed"
                style={{ borderColor: `${meta.color}60` }}>
                <div className="space-y-1.5">
                  {hosted.map((d, j) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + j * 0.05 + 0.15 }}
                      className="relative flex items-center gap-2 text-xs"
                    >
                      <span
                        className="absolute -left-[calc(1.25rem+1px)] top-1/2 w-5 h-0.5"
                        style={{ backgroundColor: `${meta.color}80` }}
                      />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="text-ink">{d.name}</span>
                      <span className="text-ink-soft">·</span>
                      <span className="text-ink-soft uppercase text-[10px]">{d.kind}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------- PAGE ----------
export default function IntegrationsPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const devices = selectDevicesByPersona(personaId);
  const gateways = selectGatewaysByPersona(personaId);
  const activity = useNexus((s) => selectActivityByPersona(personaId, s.activity));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [configPlatform, setConfigPlatform] = useState<Platform | null>(null);

  const vendorsInSite = useMemo(() => {
    return devices.reduce<Record<string, number>>((acc, d) => {
      acc[d.vendor] = (acc[d.vendor] ?? 0) + 1;
      return acc;
    }, {});
  }, [devices]);

  const activityByVendor = useMemo(() => {
    return activity.reduce<Record<string, number>>((acc, a) => {
      acc[a.source] = (acc[a.source] ?? 0) + 1;
      return acc;
    }, {});
  }, [activity]);

  const onlinePlatforms = STATIC.platforms.filter((p) => p.status === "online").length;
  const totalDiscovered = STATIC.platforms.reduce((s, p) => s + p.devicesDiscovered, 0);
  const avgLatency = Math.round(
    STATIC.platforms.reduce((s, p) => s + p.latencyMs, 0) / STATIC.platforms.length,
  );
  const oauthExpiringSoon = STATIC.platforms.filter((p) => {
    const d = daysUntil(p.oauthExpiresAt);
    return d !== null && d < 30;
  }).length;

  const healthScore = Math.round(
    (onlinePlatforms / STATIC.platforms.length) * 60 +
    (avgLatency < 500 ? 25 : avgLatency < 1000 ? 15 : 5) +
    (oauthExpiringSoon === 0 ? 15 : oauthExpiringSoon < 2 ? 8 : 0),
  );
  const healthColor = healthScore >= 85 ? "#5BB37F" : healthScore >= 60 ? "#E0A537" : "#D9534F";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl border border-line bg-gradient-to-br from-navy via-navy-soft to-navy p-6 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: healthColor }} />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-cream/60 text-xs uppercase tracking-widest">
              <Share2 className="h-3 w-3" /> Integraciones
            </div>
            <h1 className="font-display text-xl sm:text-3xl text-cream mt-1">Red y adapters</h1>
            <p className="text-cream/70 text-sm mt-1 max-w-xl">
              Plataformas externas, gateways locales y topología de protocolos conectados al núcleo Nexus.
            </p>
          </div>

          {/* Health dial */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg width={96} height={96} viewBox="0 0 96 96">
                <circle cx={48} cy={48} r={40} stroke="rgba(245,242,234,0.15)" strokeWidth={6} fill="none" />
                <motion.circle
                  cx={48} cy={48} r={40} stroke={healthColor} strokeWidth={6} fill="none"
                  strokeLinecap="round" transform="rotate(-90 48 48)"
                  strokeDasharray={2 * Math.PI * 40}
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - healthScore / 100) }}
                  transition={{ duration: 1.3, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums" style={{ color: healthColor }}>
                  {healthScore}
                </span>
                <span className="text-[9px] text-cream/50 uppercase tracking-wider">health</span>
              </div>
            </div>
            <div className="text-cream/80">
              <div className="text-xs uppercase tracking-wide text-cream/50">Red estable</div>
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" style={{ color: healthColor }} />
                {onlinePlatforms}/{STATIC.platforms.length} plataformas online
              </div>
              {oauthExpiringSoon > 0 && (
                <div className="text-xs text-status-warn flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="h-3 w-3" />
                  {oauthExpiringSoon} OAuth próximos a vencer
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <HeroStat icon={Cloud} label="Plataformas" value={STATIC.platforms.length} tone="#A8C090" />
          <HeroStat icon={Rocket} label="Dispositivos" value={totalDiscovered} suffix="descubiertos" tone="#D4A84B" />
          <HeroStat icon={Gauge} label="Latencia avg" value={avgLatency} suffix="ms" tone="#0EA5E9" />
          <HeroStat icon={Plug} label="Gateways locales" value={gateways.length} tone="#A855F7" />
        </div>
      </motion.div>

      {/* Protocol distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4 text-sage-border" />
            Distribución por protocolo ({devices.length} dispositivos)
          </CardTitle>
        </CardHeader>
        <CardBody>
          <ProtocolDistribution devices={devices} />
        </CardBody>
      </Card>

      {/* Platforms grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Plataformas conectadas</h2>
          <span className="text-xs text-ink-soft">Click en una tarjeta para ver detalle</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATIC.platforms.map((p, i) => (
            <PlatformCard
              key={p.id}
              platform={p}
              inSite={vendorsInSite[p.vendor] ?? 0}
              devices={devices}
              activityCount={activityByVendor[p.vendor] ?? 0}
              expanded={expandedId === p.id}
              onToggle={() => setExpandedId((prev) => (prev === p.id ? null : p.id))}
              onConfigure={() => setConfigPlatform(p)}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Network topology */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-4 w-4 text-gold-border" />
            Topología de gateways locales
          </CardTitle>
        </CardHeader>
        <CardBody>
          <NetworkTopology gateways={gateways} devices={devices} />
        </CardBody>
      </Card>

      {/* Activity stream por plataforma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold-border" />
            Actividad reciente por integración
          </CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {activity.length === 0 ? (
            <div className="px-5 py-6 text-sm text-ink-soft text-center">
              Sin actividad registrada para esta persona.
            </div>
          ) : (
            <div className="divide-y divide-line max-h-80 overflow-y-auto">
              {activity.slice(0, 20).map((a, i) => {
                const visual = VENDOR_VISUALS[a.source] ?? DEFAULT_VISUAL;
                const tone =
                  a.severity === "critical" ? "critical" :
                  a.severity === "warn" ? "warn" : "neutral";
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="px-5 py-3 flex items-center gap-3 text-xs hover:bg-surface/50 transition"
                  >
                    <span
                      className="w-1.5 self-stretch rounded-full"
                      style={{ backgroundColor: visual.accent }}
                    />
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                      style={{ backgroundColor: `${visual.accent}18`, color: visual.accent }}
                    >
                      <Cloud className="h-3 w-3" />{a.source}
                    </span>
                    <span className="flex-1 text-ink">{a.summary}</span>
                    <Badge tone={tone}>{a.outcome}</Badge>
                    <span className="text-ink-soft tabular-nums">
                      {new Date(a.ts).toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de configuración */}
      <AnimatePresence>
        {configPlatform && (
          <PlatformConfigModal
            platform={configPlatform}
            onClose={() => setConfigPlatform(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
