"use client";

import { useState, useMemo, useRef, MouseEvent as ReactMouseEvent } from "react";
import type { Device, DeviceKind } from "@/lib/types";
import { useNexus } from "@/lib/store";
import {
  Lightbulb, Camera, Thermometer, Volume2, Radar, Droplets,
  Lock, ToggleLeft, Blinds, RotateCw, Move3D, ZoomIn, ZoomOut,
  Power, Sun, Moon, X,
} from "lucide-react";
import { getRoomTheme } from "./room-themes";
import { Box3D } from "./Box3D";

const ICON: Record<DeviceKind, typeof Lightbulb> = {
  light: Lightbulb, climate: Thermometer, camera: Camera, speaker: Volume2,
  sensor: Radar, valve: Droplets, lock: Lock, switch: ToggleLeft, cover: Blinds,
};

type Marker = {
  id: string;
  kind: DeviceKind;
  name: string;
  isOn: boolean;
  surface: "ceiling" | "floor" | "wallBack" | "wallLeft" | "wallRight";
  x: number; y: number;
  dimCapId?: string;
  dim?: number; // 0-100
  onOffCapId?: string;
};

function hashToUnit(id: string, salt: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i) + salt) | 0;
  return ((h % 1000) + 1000) % 1000 / 1000;
}

function surfaceFor(kind: DeviceKind): Marker["surface"] {
  switch (kind) {
    case "light": return "ceiling";
    case "climate": return "wallBack";
    case "camera": return "wallBack";
    case "sensor": return "wallLeft";
    case "speaker": return "ceiling";
    case "lock": return "wallRight";
    case "switch": return "wallLeft";
    case "cover": return "wallBack";
    case "valve": return "floor";
    default: return "floor";
  }
}

export function Room3D({
  devices,
  roomName,
  roomId,
}: {
  devices: Device[];
  roomName: string;
  roomId: string;
}) {
  const capabilities = useNexus((s) => s.capabilities);
  const toggleDevice = useNexus((s) => s.toggleDevice);
  const setCapability = useNexus((s) => s.setCapability);
  const role = useNexus((s) => s.activeRole);
  const canControl = role !== "viewer";

  const theme = useMemo(() => getRoomTheme(roomId), [roomId]);

  const [rotY, setRotY] = useState(-28);
  const [rotX, setRotX] = useState(18);
  const [zoom, setZoom] = useState(1);
  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; rotY: number; rotX: number } | null>(null);

  const markers: Marker[] = useMemo(() => {
    return devices.map((d) => {
      const caps = d.capabilityIds.map((id) => capabilities[id]).filter(Boolean);
      const onCap = caps.find((c) => c?.kind === "on_off");
      const dimCap = caps.find((c) => c?.kind === "dim");
      return {
        id: d.id,
        kind: d.kind,
        name: d.name,
        isOn: onCap?.value === true,
        onOffCapId: onCap?.id,
        dimCapId: dimCap?.id,
        dim: typeof dimCap?.value === "number" ? (dimCap.value as number) : undefined,
        surface: surfaceFor(d.kind),
        x: 0.1 + hashToUnit(d.id, 7) * 0.8,
        y: 0.1 + hashToUnit(d.id, 13) * 0.8,
      };
    });
  }, [devices, capabilities]);

  const selectedLight = useMemo(
    () => markers.find((m) => m.id === selectedLightId) ?? null,
    [markers, selectedLightId]
  );

  const handleMarkerClick = (m: Marker) => {
    if (!canControl) return;
    if (m.kind === "light") {
      setSelectedLightId((curr) => (curr === m.id ? null : m.id));
    } else {
      toggleDevice(m.id);
    }
  };

  const handleDimChange = (m: Marker, value: number) => {
    if (!canControl || !m.dimCapId) return;
    setCapability(m.dimCapId, value);
    // Auto on/off according to brightness
    if (value === 0 && m.isOn) toggleDevice(m.id);
    else if (value > 0 && !m.isOn) toggleDevice(m.id);
  };

  const onMouseDown = (e: ReactMouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, rotY, rotX };
  };
  const onMouseMove = (e: ReactMouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setRotY(dragRef.current.rotY + dx * 0.35);
    setRotX(Math.max(-5, Math.min(55, dragRef.current.rotX - dy * 0.25)));
  };
  const onMouseUp = () => { dragRef.current = null; };

  // Room dimensions in px
  const W = 420, D = 320, H = 220;

  const surfaceStyle: Record<Marker["surface"], React.CSSProperties> = {
    floor: {
      width: W, height: D,
      transform: `translate3d(${-W / 2}px, ${H / 2}px, ${-D / 2}px) rotateX(90deg)`,
      background: `linear-gradient(135deg, ${theme.floorGradient[0]} 0%, ${theme.floorGradient[1]} 100%)`,
    },
    ceiling: {
      width: W, height: D,
      transform: `translate3d(${-W / 2}px, ${-H / 2}px, ${-D / 2}px) rotateX(-90deg) translateZ(${-D}px)`,
      background: `linear-gradient(135deg, ${theme.ceilingGradient[0]} 0%, ${theme.ceilingGradient[1]} 100%)`,
      opacity: theme.outdoor ? 0.3 : 1,
    },
    wallBack: {
      width: W, height: H,
      transform: `translate3d(${-W / 2}px, ${-H / 2}px, ${-D / 2}px)`,
      background: `linear-gradient(180deg, ${theme.wallGradient[0]} 0%, ${theme.wallGradient[1]} 100%)`,
      opacity: theme.outdoor ? 0.55 : 1,
    },
    wallLeft: {
      width: D, height: H,
      transform: `translate3d(${-W / 2}px, ${-H / 2}px, ${D / 2}px) rotateY(90deg) translateZ(${-D}px)`,
      background: `linear-gradient(180deg, ${theme.wallGradient[0]} 0%, ${theme.wallGradient[1]} 100%)`,
      opacity: theme.outdoor ? 0.55 : 1,
    },
    wallRight: {
      width: D, height: H,
      transform: `translate3d(${W / 2}px, ${-H / 2}px, ${-D / 2}px) rotateY(-90deg)`,
      background: `linear-gradient(180deg, ${theme.wallGradient[0]} 0%, ${theme.wallGradient[1]} 100%)`,
      opacity: theme.outdoor ? 0.55 : 1,
    },
  };

  const surfaceDims: Record<Marker["surface"], { w: number; h: number }> = {
    floor: { w: W, h: D },
    ceiling: { w: W, h: D },
    wallBack: { w: W, h: H },
    wallLeft: { w: D, h: H },
    wallRight: { w: D, h: H },
  };

  const patternOverlay: Record<string, string> = {
    wood: "repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 44px)",
    parquet: "repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0 1px, transparent 1px 36px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 36px)",
    tile: "linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)",
    grass: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 1px, transparent 2px), radial-gradient(circle at 60% 70%, rgba(0,0,0,0.15) 1px, transparent 2px)",
    carpet: "repeating-radial-gradient(circle at 0 0, transparent 0 3px, rgba(0,0,0,0.05) 3px 5px)",
    concrete: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.08) 0 8px, transparent 10px), radial-gradient(circle at 70% 60%, rgba(0,0,0,0.1) 0 6px, transparent 8px)",
    marble: "linear-gradient(105deg, transparent 48%, rgba(255,255,255,0.4) 49%, rgba(255,255,255,0.4) 50%, transparent 51%), linear-gradient(85deg, transparent 60%, rgba(0,0,0,0.08) 62%, transparent 64%)",
  };
  const patternSize: Record<string, string> = {
    wood: "44px 44px", parquet: "36px 36px", tile: "50px 50px",
    grass: "24px 24px", carpet: "6px 6px", concrete: "80px 80px", marble: "140px 140px",
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-sm text-ink-soft">
          <strong className="text-ink">{roomName}</strong>
          <span
            className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{ backgroundColor: `${theme.accent}22`, color: theme.accent, border: `1px solid ${theme.accent}55` }}
          >
            {theme.displayTag}
          </span>
          <span className="ml-2 text-[11px]">· arrastra · scroll=zoom</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            className="text-xs p-1.5 rounded-md border border-line hover:bg-surface-2"
            title="Alejar"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
            className="text-xs p-1.5 rounded-md border border-line hover:bg-surface-2"
            title="Acercar"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setRotY(-28); setRotX(18); setZoom(1); }}
            className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-md border border-line hover:bg-surface-2"
          >
            <RotateCw className="h-3 w-3" /> Resetear
          </button>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-line cursor-grab active:cursor-grabbing select-none"
        style={{
          height: 500,
          perspective: 1400,
          perspectiveOrigin: "50% 45%",
          background: theme.outdoor
            ? `linear-gradient(180deg, ${theme.ceilingGradient[0]} 0%, ${theme.ceilingGradient[1]} 60%, ${theme.floorGradient[0]}66 100%)`
            : `radial-gradient(ellipse at 50% 20%, ${theme.ambient}33 0%, var(--surface) 70%)`,
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={(e) => {
          setZoom((z) => Math.max(0.5, Math.min(1.8, z - e.deltaY * 0.001)));
        }}
      >
        {/* Sun for outdoor scenes */}
        {theme.outdoor && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 90, height: 90, top: 30, right: 60,
              background: "radial-gradient(circle, #FFE7B0 0%, #F5C451 40%, transparent 70%)",
              filter: "blur(2px)",
            }}
          />
        )}

        <div
          className="absolute top-1/2 left-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate(-50%, -50%) scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transition: dragRef.current ? "none" : "transform 0.2s ease-out",
            width: 0, height: 0,
          }}
        >
          {(["floor", "ceiling", "wallBack", "wallLeft", "wallRight"] as const)
            .filter((s) => !(theme.outdoor && s === "ceiling"))
            .map((surface) => (
              <div
                key={surface}
                className="absolute top-0 left-0 border border-black/10 shadow-inner"
                style={{ ...surfaceStyle[surface], backfaceVisibility: "hidden" }}
              >
                {surface === "floor" && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: patternOverlay[theme.floorPattern],
                      backgroundSize: patternSize[theme.floorPattern],
                      opacity: 0.6,
                    }}
                  />
                )}

                {surface === "floor" && (
                  <div
                    className="absolute inset-0 flex items-center justify-center font-display text-4xl pointer-events-none"
                    style={{ color: "rgba(0,0,0,0.10)", letterSpacing: "0.12em" }}
                  >
                    {theme.displayTag.toUpperCase()}
                  </div>
                )}

                {surface === "floor" && theme.rug && (
                  <div
                    className="absolute"
                    style={{
                      left: theme.rug.x * W - theme.rug.w / 2,
                      top: theme.rug.z * D - theme.rug.d / 2,
                      width: theme.rug.w,
                      height: theme.rug.d,
                      background: `linear-gradient(135deg, ${theme.rug.color} 0%, ${theme.rug.color}cc 100%)`,
                      border: `2px solid ${theme.rug.color}`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      borderRadius: 4,
                    }}
                  />
                )}

                {theme.window && (
                  (surface === "wallBack" && theme.window.wall === "back") ||
                  (surface === "wallLeft" && theme.window.wall === "left") ||
                  (surface === "wallRight" && theme.window.wall === "right")
                ) && (
                  <div
                    className="absolute"
                    style={{
                      left: `${theme.window.x * 100}%`,
                      top: `${theme.window.y * 100}%`,
                      width: theme.window.w,
                      height: theme.window.h,
                      transform: "translate(-50%, 0)",
                      background: `linear-gradient(135deg, ${theme.window.color} 0%, ${theme.window.color}99 100%)`,
                      border: "4px solid #5A4632",
                      boxShadow: `inset 0 0 24px rgba(0,0,0,0.25), 0 0 40px ${theme.window.color}66`,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, transparent 48%, #5A4632 48%, #5A4632 52%, transparent 52%), linear-gradient(to bottom, transparent 48%, #5A4632 48%, #5A4632 52%, transparent 52%)",
                      }}
                    />
                  </div>
                )}

                {theme.door && (
                  (surface === "wallBack" && theme.door.wall === "back") ||
                  (surface === "wallLeft" && theme.door.wall === "left") ||
                  (surface === "wallRight" && theme.door.wall === "right")
                ) && (
                  <div
                    className="absolute"
                    style={{
                      left: `${theme.door.x * 100}%`,
                      bottom: 0,
                      width: theme.door.w,
                      height: theme.door.h,
                      transform: "translate(-50%, 0)",
                      background: "linear-gradient(180deg, #6B4A2E 0%, #4E3420 100%)",
                      borderTop: "3px solid #3A2814",
                      boxShadow: "inset 0 0 14px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div className="absolute right-2 top-1/2 w-2 h-2 rounded-full bg-gold" />
                  </div>
                )}

                {markers.filter((m) => m.surface === surface).map((m) => {
                  const Icon = ICON[m.kind];
                  const { w, h } = surfaceDims[surface];
                  const isLight = m.kind === "light";
                  const isSelected = selectedLightId === m.id;
                  // Brightness 0-1 (lights use dim if available; non-lights and dimless lights use 1)
                  const brightness = isLight && m.isOn
                    ? (typeof m.dim === "number" ? m.dim / 100 : 1)
                    : m.isOn ? 1 : 0;
                  const glowStrength = Math.max(0.15, brightness);
                  const lightColor = isLight ? "#FFD98A" : theme.accent;
                  return (
                    <button
                      key={m.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkerClick(m);
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-transform hover:scale-125 group"
                      style={{
                        left: m.x * w,
                        top: m.y * h,
                        width: 34,
                        height: 34,
                        background: m.isOn
                          ? (isLight
                              ? `radial-gradient(circle, #FFF4C4 0%, ${lightColor} ${30 + brightness * 40}%, ${theme.accent} 100%)`
                              : theme.accent)
                          : "rgba(255,255,255,0.92)",
                        border: `2px solid ${m.isOn ? lightColor : "#8B95A8"}${isSelected ? "" : ""}`,
                        outline: isSelected ? `3px solid ${theme.accent}` : "none",
                        outlineOffset: isSelected ? 2 : 0,
                        boxShadow: m.isOn
                          ? `0 0 ${18 + glowStrength * 30}px ${lightColor}${Math.round(glowStrength * 240).toString(16).padStart(2, "0")}, 0 0 ${28 + glowStrength * 60}px ${lightColor}${Math.round(glowStrength * 128).toString(16).padStart(2, "0")}`
                          : "0 2px 6px rgba(0,0,0,0.25)",
                        cursor: canControl ? "pointer" : "not-allowed",
                        zIndex: isSelected ? 20 : 10,
                      }}
                      title={`${m.name} · ${m.isOn ? "ON" : "OFF"}${isLight && typeof m.dim === "number" ? ` · ${m.dim}%` : ""}`}
                    >
                      <Icon className="h-4 w-4" style={{ color: "#1E2A44" }} />
                      {isLight && m.isOn && typeof m.dim === "number" && (
                        <span
                          className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1 py-px rounded-full bg-navy text-cream border border-white/40"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          {m.dim}
                        </span>
                      )}
                      <span
                        className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-2 py-0.5 rounded bg-navy text-cream opacity-0 group-hover:opacity-100 transition pointer-events-none"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        {m.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}

          {/* Furniture as 3D cuboids */}
          {theme.furniture.map((piece) => (
            <Box3D key={piece.id} piece={piece} roomW={W} roomD={D} />
          ))}
        </div>

        <div className="absolute bottom-3 left-3 flex gap-2 text-[10px] text-ink-soft bg-surface/85 backdrop-blur px-3 py-2 rounded-lg border border-line">
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: theme.accent, boxShadow: `0 0 8px ${theme.accent}` }}
            />
            Encendido
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-smoke" />
            Apagado
          </span>
          <span>·</span>
          <span>{markers.length} dispositivos</span>
          <span>·</span>
          <span>{theme.furniture.length} piezas</span>
        </div>

        <div className="absolute top-3 right-3 text-[10px] font-mono text-ink-soft bg-surface/85 backdrop-blur px-2 py-1 rounded border border-line flex items-center gap-2">
          <Move3D className="h-3 w-3" />
          {Math.round(rotY)}° · {Math.round(rotX)}° · {zoom.toFixed(1)}x
        </div>

        {/* Dimmer panel for selected light */}
        {selectedLight && (
          <div
            className="absolute bottom-3 right-3 w-64 bg-surface/95 backdrop-blur border border-line rounded-xl shadow-xl p-3"
            style={{ zIndex: 30 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: selectedLight.isOn
                      ? `radial-gradient(circle, #FFF4C4 0%, #FFD98A 60%, ${theme.accent} 100%)`
                      : "rgba(255,255,255,0.9)",
                    boxShadow: selectedLight.isOn
                      ? `0 0 12px #FFD98Acc`
                      : "inset 0 0 0 1px #8B95A8",
                  }}
                >
                  <Lightbulb className="h-3.5 w-3.5" style={{ color: "#1E2A44" }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">{selectedLight.name}</div>
                  <div className="text-[10px] text-ink-soft">
                    {selectedLight.isOn ? "Encendida" : "Apagada"}
                    {typeof selectedLight.dim === "number" && ` · ${selectedLight.dim}%`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLightId(null)}
                className="p-1 rounded hover:bg-surface-2 text-ink-soft"
                title="Cerrar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => {
                  if (!canControl) return;
                  toggleDevice(selectedLight.id);
                }}
                disabled={!canControl}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition"
                style={{
                  background: selectedLight.isOn ? theme.accent : "transparent",
                  borderColor: selectedLight.isOn ? theme.accent : "var(--line)",
                  color: selectedLight.isOn ? "#1E2A44" : "var(--ink)",
                  fontWeight: 600,
                }}
              >
                <Power className="h-3 w-3" />
                {selectedLight.isOn ? "ON" : "OFF"}
              </button>
              {typeof selectedLight.dim === "number" && (
                <div className="flex items-center gap-1 ml-auto">
                  {[25, 50, 75, 100].map((p) => (
                    <button
                      key={p}
                      onClick={() => handleDimChange(selectedLight, p)}
                      disabled={!canControl}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-line hover:bg-surface-2 text-ink-soft"
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              )}
            </div>

            {typeof selectedLight.dim === "number" ? (
              <div>
                <div className="flex items-center gap-2">
                  <Moon className="h-3 w-3 text-ink-soft" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={selectedLight.dim}
                    disabled={!canControl}
                    onChange={(e) => handleDimChange(selectedLight, Number(e.target.value))}
                    className="flex-1 accent-gold"
                    style={{
                      accentColor: theme.accent,
                    }}
                  />
                  <Sun className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                </div>
                <div
                  className="mt-2 h-2 rounded-full overflow-hidden border border-line"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${selectedLight.dim}%`,
                      background: `linear-gradient(90deg, #1E2A44 0%, ${theme.accent} 100%)`,
                      boxShadow: selectedLight.isOn ? `0 0 8px ${theme.accent}` : "none",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-ink-soft italic">
                Esta luz no soporta atenuación (solo ON/OFF).
              </div>
            )}

            {!canControl && (
              <div className="mt-2 text-[10px] text-ink-soft italic">
                Modo viewer: control deshabilitado.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
