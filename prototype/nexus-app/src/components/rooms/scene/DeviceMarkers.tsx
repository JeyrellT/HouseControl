"use client";

import { useMemo } from "react";
import type { Device, DeviceKind } from "@/lib/types";
import { useNexus } from "@/lib/store";
import type { RoomSpec } from "../schema/room-schema";

// Markers are placed on the surfaces of the room (walls/ceiling/floor) in world coords.
// This keeps the device list independent of the room's furniture layout.

type Surface = "ceiling" | "floor" | "north" | "south" | "east" | "west";

function surfaceFor(kind: DeviceKind): Surface {
  switch (kind) {
    case "light":   return "ceiling";
    case "climate": return "north";
    case "camera":  return "north";
    case "sensor":  return "west";
    case "speaker": return "ceiling";
    case "lock":    return "east";
    case "switch":  return "west";
    case "cover":   return "north";
    case "valve":   return "floor";
    default:        return "floor";
  }
}

function hashToUnit(id: string, salt: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i) + salt) | 0;
  return ((h % 1000) + 1000) % 1000 / 1000;
}

function positionFor(
  surface: Surface,
  dims: [number, number, number],
  u: number,
  v: number,
): [number, number, number] {
  const [w, h, d] = dims;
  // Inset so markers don't clip the wall/floor edge.
  const pad = 0.2;
  const uu = pad + u * (1 - 2 * pad);
  const vv = pad + v * (1 - 2 * pad);
  switch (surface) {
    case "floor":   return [(uu - 0.5) * w, 0.02,       (vv - 0.5) * d];
    case "ceiling": return [(uu - 0.5) * w, h - 0.05,   (vv - 0.5) * d];
    case "north":   return [(uu - 0.5) * w, vv * h,     -d / 2 + 0.05];
    case "south":   return [(uu - 0.5) * w, vv * h,      d / 2 - 0.05];
    case "west":    return [-w / 2 + 0.05, vv * h,      (uu - 0.5) * d];
    case "east":    return [ w / 2 - 0.05, vv * h,      (uu - 0.5) * d];
  }
}

export interface MarkerMeta {
  id: string;
  kind: DeviceKind;
  name: string;
  isOn: boolean;
  position: [number, number, number];
  dim?: number;
  accent: string;
}

export function useDeviceMarkers(devices: Device[], spec: RoomSpec): MarkerMeta[] {
  const capabilities = useNexus((s) => s.capabilities);
  return useMemo(() => {
    return devices.map((d) => {
      const caps = d.capabilityIds.map((id) => capabilities[id]).filter(Boolean);
      const onCap = caps.find((c) => c?.kind === "on_off");
      const dimCap = caps.find((c) => c?.kind === "dim");
      const surface = surfaceFor(d.kind);
      const position = positionFor(surface, spec.dimensions, hashToUnit(d.id, 7), hashToUnit(d.id, 13));
      return {
        id: d.id,
        kind: d.kind,
        name: d.name,
        isOn: onCap?.value === true,
        dim: typeof dimCap?.value === "number" ? (dimCap.value as number) : undefined,
        position,
        accent: d.kind === "light" ? "#FFD98A" : spec.accent,
      };
    });
  }, [devices, capabilities, spec.dimensions, spec.accent]);
}

export function DeviceMarkers({
  markers,
  selectedId,
  onSelect,
}: {
  markers: MarkerMeta[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <group>
      {markers.map((m) => {
        const isLight = m.kind === "light";
        const brightness = isLight && m.isOn
          ? (typeof m.dim === "number" ? Math.max(0.1, m.dim / 100) : 1)
          : m.isOn ? 1 : 0.05;
        const isSelected = m.id === selectedId;
        const baseColor = m.isOn ? m.accent : "#BFC6D0";
        return (
          <group key={m.id} position={m.position}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(m.id);
              }}
              onPointerOver={(e) => { e.stopPropagation(); (document.body.style.cursor = "pointer"); }}
              onPointerOut={() => { document.body.style.cursor = ""; }}
            >
              <sphereGeometry args={[isSelected ? 0.11 : 0.08, 20, 12]} />
              <meshStandardMaterial
                color={baseColor}
                emissive={m.isOn ? m.accent : "#000000"}
                emissiveIntensity={m.isOn ? brightness * 1.6 : 0}
                roughness={0.35}
                metalness={0.1}
              />
            </mesh>
            {/* Point light for enabled lights — gives real illumination to the scene */}
            {isLight && m.isOn && (
              <pointLight
                color={m.accent}
                intensity={brightness * 2.2}
                distance={5}
                decay={2}
              />
            )}
            {/* Selection ring */}
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <ringGeometry args={[0.14, 0.18, 32]} />
                <meshBasicMaterial color={m.accent} transparent opacity={0.8} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
