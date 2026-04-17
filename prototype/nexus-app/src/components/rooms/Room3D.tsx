"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ChevronLeft, ChevronRight, Lightbulb, Maximize2, Moon, Power, RotateCw, Sun, X } from "lucide-react";

import type { Device } from "@/lib/types";
import { useNexus } from "@/lib/store";
import type { WallSide } from "./schema/room-schema";

import { Lighting } from "./scene/Lighting";
import { RoomShell } from "./scene/RoomShell";
import { Furniture } from "./scene/Furniture";
import { DeviceMarkers, useDeviceMarkers } from "./scene/DeviceMarkers";
import { getRoomSpec } from "./schema/room-themes";

type ViewMode = "aerial" | "north" | "south" | "east" | "west";

// Order used by the left/right arrows. "Aerial" is the default and sits first.
const VIEW_ORDER: ViewMode[] = ["aerial", "north", "east", "south", "west"];
const VIEW_LABEL: Record<ViewMode, string> = {
  aerial: "Vista aérea",
  north: "Pared Norte",
  south: "Pared Sur",
  east: "Pared Este",
  west: "Pared Oeste",
};

/**
 * Computes the camera position + controls target for a given view mode.
 * - aerial: straight-down top view showing the whole floor + 3D volume below.
 * - wall modes: camera sits OUTSIDE the named wall looking toward the opposite wall.
 *   The named wall is hidden so the user sees the interior + the other 3 walls.
 */
function viewFor(mode: ViewMode, dims: [number, number, number]) {
  const [w, h, d] = dims;
  const longSide = Math.max(w, d);
  switch (mode) {
    case "aerial": {
      // Top-down, tilted slightly so walls still read as 3D.
      const y = Math.max(10, longSide * 1.8);
      return {
        position: [0.0001, y, 0.0001] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
        hiddenWall: null as WallSide | null,
      };
    }
    case "north": {
      // North wall is at -Z. Stand outside (more negative Z) looking toward +Z.
      const dist = Math.max(d * 1.15, 6);
      return {
        position: [0, h * 0.6, -dist] as [number, number, number],
        target: [0, h * 0.45, d * 0.25] as [number, number, number],
        hiddenWall: "north" as WallSide,
      };
    }
    case "south": {
      const dist = Math.max(d * 1.15, 6);
      return {
        position: [0, h * 0.6, dist] as [number, number, number],
        target: [0, h * 0.45, -d * 0.25] as [number, number, number],
        hiddenWall: "south" as WallSide,
      };
    }
    case "east": {
      const dist = Math.max(w * 1.15, 6);
      return {
        position: [dist, h * 0.6, 0] as [number, number, number],
        target: [-w * 0.25, h * 0.45, 0] as [number, number, number],
        hiddenWall: "east" as WallSide,
      };
    }
    case "west": {
      const dist = Math.max(w * 1.15, 6);
      return {
        position: [-dist, h * 0.6, 0] as [number, number, number],
        target: [w * 0.25, h * 0.45, 0] as [number, number, number],
        hiddenWall: "west" as WallSide,
      };
    }
  }
}

/**
 * Imperatively moves the camera + orbit target whenever the view mode changes.
 * Must live inside <Canvas> so it has access to the default camera.
 */
function ViewController({
  mode,
  dims,
  controlsRef,
}: {
  mode: ViewMode;
  dims: [number, number, number];
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    const v = viewFor(mode, dims);
    camera.position.set(v.position[0], v.position[1], v.position[2]);
    camera.lookAt(v.target[0], v.target[1], v.target[2]);
    const ctrl = controlsRef.current;
    if (ctrl) {
      ctrl.target.set(v.target[0], v.target[1], v.target[2]);
      ctrl.update();
    }
  }, [mode, dims, camera, controlsRef]);
  return null;
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

  const spec = useMemo(() => getRoomSpec(roomId), [roomId]);
  const markers = useDeviceMarkers(devices, spec);

  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("aerial");
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // Reset to aerial every time the room changes.
  useEffect(() => {
    setViewMode("aerial");
    setSelectedLightId(null);
  }, [roomId]);

  const cycleView = useCallback((dir: 1 | -1) => {
    setViewMode((curr) => {
      const idx = VIEW_ORDER.indexOf(curr);
      const next = (idx + dir + VIEW_ORDER.length) % VIEW_ORDER.length;
      return VIEW_ORDER[next]!;
    });
  }, []);

  // Keyboard arrows: ← → cycle walls, ↑ go aerial.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") { cycleView(-1); e.preventDefault(); }
      else if (e.key === "ArrowRight") { cycleView(1); e.preventDefault(); }
      else if (e.key === "ArrowUp") { setViewMode("aerial"); e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleView]);

  const selectedMarker = useMemo(
    () => markers.find((m) => m.id === selectedLightId) ?? null,
    [markers, selectedLightId],
  );
  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selectedLightId) ?? null,
    [devices, selectedLightId],
  );
  const selectedDimCapId = useMemo(() => {
    if (!selectedDevice) return undefined;
    return selectedDevice.capabilityIds.find((id) => capabilities[id]?.kind === "dim");
  }, [selectedDevice, capabilities]);
  const selectedDim = typeof selectedMarker?.dim === "number" ? selectedMarker.dim : undefined;

  const handleMarkerSelect = (id: string) => {
    const m = markers.find((x) => x.id === id);
    if (!m) return;
    if (!canControl) return;
    if (m.kind === "light") {
      setSelectedLightId((curr) => (curr === id ? null : id));
    } else {
      toggleDevice(id);
    }
  };

  const handleDimChange = (value: number) => {
    if (!canControl || !selectedMarker || !selectedDimCapId) return;
    setCapability(selectedDimCapId, value);
    if (value === 0 && selectedMarker.isOn) toggleDevice(selectedMarker.id);
    else if (value > 0 && !selectedMarker.isOn) toggleDevice(selectedMarker.id);
  };

  const resetView = () => {
    setViewMode("aerial");
    controlsRef.current?.reset();
  };

  const [w, h, d] = spec.dimensions;
  const initial = useMemo(() => viewFor("aerial", spec.dimensions), [spec.dimensions]);
  const hiddenWall = useMemo(() => viewFor(viewMode, spec.dimensions).hiddenWall, [viewMode, spec.dimensions]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-sm text-ink-soft">
          <strong className="text-ink">{roomName}</strong>
          <span
            className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{
              backgroundColor: `${spec.accent}22`,
              color: spec.accent,
              border: `1px solid ${spec.accent}55`,
            }}
          >
            {spec.displayTag}
          </span>
          <span className="ml-2 text-[11px]">· arrastra · scroll=zoom · ← → cambiar pared</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetView}
            className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-md border border-line hover:bg-surface-2"
          >
            <RotateCw className="h-3 w-3" /> Resetear
          </button>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-line"
        style={{
          height: 500,
          background: spec.outdoor
            ? `linear-gradient(180deg, #87CEEB 0%, #B8D8E8 55%, #4E7A3255 100%)`
            : `radial-gradient(ellipse at 50% 20%, ${spec.accent}22 0%, var(--surface) 70%)`,
        }}
      >
        <Canvas
          shadows
          camera={{ position: initial.position, fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, toneMappingExposure: 1.0 }}
        >
          <Suspense fallback={null}>
            <Lighting lighting={spec.lighting} />
            <RoomShell spec={spec} hiddenWall={hiddenWall} />
            <Furniture items={spec.furniture} />
            <DeviceMarkers
              markers={markers}
              selectedId={selectedLightId}
              onSelect={handleMarkerSelect}
            />
            <ContactShadows
              position={[0, 0.001, 0]}
              opacity={0.55}
              scale={Math.max(w, d) * 1.8}
              blur={2.2}
              far={3}
              resolution={1024}
              frames={1}
            />
          </Suspense>
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={3}
            maxDistance={Math.max(20, Math.max(w, d) * 2.5)}
            maxPolarAngle={Math.PI / 2 - 0.02}
            target={[initial.target[0], initial.target[1], initial.target[2]]}
          />
          <ViewController mode={viewMode} dims={spec.dimensions} controlsRef={controlsRef} />
        </Canvas>

        {/* View-mode switcher: prev / label / next */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-surface/90 backdrop-blur border border-line rounded-full shadow-md px-1 py-1">
          <button
            onClick={() => cycleView(-1)}
            className="p-1.5 rounded-full hover:bg-surface-2 text-ink-soft"
            title="Pared anterior (←)"
            aria-label="Pared anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("aerial")}
            className="text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"
            style={{
              color: viewMode === "aerial" ? "#1E2A44" : "var(--ink)",
              background: viewMode === "aerial" ? spec.accent : "transparent",
              minWidth: 130,
              justifyContent: "center",
            }}
            title="Vista aérea (↑)"
          >
            <Maximize2 className="h-3 w-3" />
            {VIEW_LABEL[viewMode]}
          </button>
          <button
            onClick={() => cycleView(1)}
            className="p-1.5 rounded-full hover:bg-surface-2 text-ink-soft"
            title="Pared siguiente (→)"
            aria-label="Pared siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex gap-2 text-[10px] text-ink-soft bg-surface/85 backdrop-blur px-3 py-2 rounded-lg border border-line pointer-events-none">
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: spec.accent, boxShadow: `0 0 8px ${spec.accent}` }}
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
          <span>{spec.furniture.length} piezas</span>
        </div>

        {/* Dimmer popover for the selected light */}
        {selectedMarker && (
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
                    background: selectedMarker.isOn
                      ? `radial-gradient(circle, #FFF4C4 0%, #FFD98A 60%, ${spec.accent} 100%)`
                      : "rgba(255,255,255,0.9)",
                    boxShadow: selectedMarker.isOn
                      ? `0 0 12px #FFD98Acc`
                      : "inset 0 0 0 1px #8B95A8",
                  }}
                >
                  <Lightbulb className="h-3.5 w-3.5" style={{ color: "#1E2A44" }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">{selectedMarker.name}</div>
                  <div className="text-[10px] text-ink-soft">
                    {selectedMarker.isOn ? "Encendida" : "Apagada"}
                    {typeof selectedDim === "number" && ` · ${selectedDim}%`}
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
                  toggleDevice(selectedMarker.id);
                }}
                disabled={!canControl}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition"
                style={{
                  background: selectedMarker.isOn ? spec.accent : "transparent",
                  borderColor: selectedMarker.isOn ? spec.accent : "var(--line)",
                  color: selectedMarker.isOn ? "#1E2A44" : "var(--ink)",
                  fontWeight: 600,
                }}
              >
                <Power className="h-3 w-3" />
                {selectedMarker.isOn ? "ON" : "OFF"}
              </button>
              {selectedDimCapId && (
                <div className="flex items-center gap-1 ml-auto">
                  {[25, 50, 75, 100].map((p) => (
                    <button
                      key={p}
                      onClick={() => handleDimChange(p)}
                      disabled={!canControl}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-line hover:bg-surface-2 text-ink-soft"
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDimCapId && typeof selectedDim === "number" ? (
              <div>
                <div className="flex items-center gap-2">
                  <Moon className="h-3 w-3 text-ink-soft" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={selectedDim}
                    disabled={!canControl}
                    onChange={(e) => handleDimChange(Number(e.target.value))}
                    className="flex-1"
                    style={{ accentColor: spec.accent }}
                  />
                  <Sun className="h-3.5 w-3.5" style={{ color: spec.accent }} />
                </div>
                <div
                  className="mt-2 h-2 rounded-full overflow-hidden border border-line"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${selectedDim}%`,
                      background: `linear-gradient(90deg, #1E2A44 0%, ${spec.accent} 100%)`,
                      boxShadow: selectedMarker.isOn ? `0 0 8px ${spec.accent}` : "none",
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
