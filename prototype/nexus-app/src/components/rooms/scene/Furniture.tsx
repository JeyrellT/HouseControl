"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Furniture, FurnitureType, Material } from "../schema/room-schema";
import { resolveMaterialProps } from "./materials";

// A standard box mesh with a material. Used as primitive building block.
function Box({
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  material,
  castShadow = true,
  receiveShadow = true,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  material: Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const props = resolveMaterialProps(material);
  return (
    <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={size} />
      <meshStandardMaterial {...props} />
    </mesh>
  );
}

function Cyl({
  radius,
  height,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  material,
  radialSegments = 24,
}: {
  radius: number;
  height: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  material: Material;
  radialSegments?: number;
}) {
  const props = resolveMaterialProps(material);
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, radialSegments]} />
      <meshStandardMaterial {...props} />
    </mesh>
  );
}

function Sph({
  radius,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  material,
}: {
  radius: number;
  position?: [number, number, number];
  scale?: [number, number, number];
  material: Material;
}) {
  const props = resolveMaterialProps(material);
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <sphereGeometry args={[radius, 24, 16]} />
      <meshStandardMaterial {...props} />
    </mesh>
  );
}

// ────────────────────────── Type builders ──────────────────────────
// Each builder assumes piece is centered at origin with size = [w, h, d].
// The parent <group> handles world translation + rotation.

function defaultWood(): Material { return { kind: "wood", color: "#8B6F4E" }; }
function defaultFabric(): Material { return { kind: "fabric", color: "#4A5F6D" }; }
function defaultMetal(): Material { return { kind: "metal", color: "#B0B4B8" }; }

const builders: Partial<Record<FurnitureType, (f: Furniture) => JSX.Element>> = {
  sofa: (f) => {
    const [w, h, d] = f.size;
    const prim = f.primary;
    const sec = f.secondary ?? prim;
    const accent = f.accent ?? { kind: "fabric", color: "#C9A673" } as Material;
    const legH = Math.min(0.08, h * 0.12);
    const baseH = h * 0.3;
    const backH = h * 0.58;
    const armW = Math.min(0.18, w * 0.1);
    const armH = baseH + backH * 0.35;
    const legMat: Material = { kind: "wood", color: "#3A2814", roughness: 0.55 };
    return (
      <group>
        {/* Legs (4) */}
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
          <Box key={`lg-${i}`} size={[0.06, legH, 0.06]}
            position={[sx * (w / 2 - 0.08), legH / 2, sz * (d / 2 - 0.08)]} material={legMat} />
        ))}
        {/* Base seat box */}
        <Box size={[w, baseH, d]} position={[0, legH + baseH / 2, 0]} material={prim} />
        {/* Backrest */}
        <Box size={[w, backH, d * 0.22]}
          position={[0, legH + baseH + backH / 2, -d / 2 + (d * 0.22) / 2]} material={prim} />
        {/* Arms */}
        <Box size={[armW, armH, d]} position={[-w / 2 + armW / 2, legH + armH / 2, 0]} material={prim} />
        <Box size={[armW, armH, d]} position={[ w / 2 - armW / 2, legH + armH / 2, 0]} material={prim} />
        {/* Seat cushions */}
        {[-1, 0, 1].map((i) => (
          <Box key={`sc-${i}`}
            size={[(w - armW * 2) / 3.15, baseH * 0.45, d * 0.78]}
            position={[i * ((w - armW * 2) / 3), legH + baseH + baseH * 0.22, d * 0.08]}
            material={sec} />
        ))}
        {/* Back cushions */}
        {[-1, 1].map((i) => (
          <Box key={`bc-${i}`}
            size={[(w - armW * 2) / 2.3, backH * 0.55, d * 0.18]}
            position={[i * (w * 0.22), legH + baseH + backH * 0.55, -d / 2 + d * 0.2]}
            material={sec} />
        ))}
        {/* Accent throw pillows */}
        {[-1, 1].map((i) => (
          <Box key={`tp-${i}`} rotation={[0, i * 0.2, 0]}
            size={[d * 0.35, d * 0.3, d * 0.12]}
            position={[i * (w * 0.32), legH + baseH + d * 0.18, d * 0.12]}
            material={accent} />
        ))}
      </group>
    );
  },
  armchair: (f) => {
    const [w, h, d] = f.size;
    const prim = f.primary;
    const baseH = h * 0.4;
    const backH = h * 0.6;
    return (
      <group>
        <Box size={[w, baseH, d]} position={[0, baseH / 2, 0]} material={prim} />
        <Box size={[w, backH, d * 0.2]} position={[0, baseH + backH / 2, -d / 2 + (d * 0.2) / 2]} material={prim} />
        <Box size={[w * 0.12, h * 0.6, d]} position={[-w / 2 + (w * 0.12) / 2, (h * 0.6) / 2, 0]} material={prim} />
        <Box size={[w * 0.12, h * 0.6, d]} position={[ w / 2 - (w * 0.12) / 2, (h * 0.6) / 2, 0]} material={prim} />
      </group>
    );
  },
  bed: (f) => {
    const [w, h, d] = f.size;
    const prim = f.primary;
    const sec = f.secondary ?? { kind: "fabric", color: "#F5F0E3" } as Material;
    const accent = f.accent ?? { kind: "wood", color: "#4A3A6B" } as Material;
    const legH = 0.08;
    const frameH = h * 0.32;
    const mattressH = h * 0.38;
    const headH = h * 2.0;
    const duvet: Material = { kind: "fabric", color: "#ECE4D2", roughness: 0.9 };
    const legMat: Material = { kind: "wood", color: "#2E2216", roughness: 0.55 };
    return (
      <group>
        {/* Legs */}
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
          <Box key={`bl-${i}`} size={[0.07, legH, 0.07]}
            position={[sx * (w / 2 - 0.06), legH / 2, sz * (d / 2 - 0.06)]} material={legMat} />
        ))}
        {/* Frame box */}
        <Box size={[w, frameH, d]} position={[0, legH + frameH / 2, 0]} material={prim} />
        {/* Mattress */}
        <Box size={[w * 0.97, mattressH, d * 0.97]}
          position={[0, legH + frameH + mattressH / 2, 0]} material={sec} />
        {/* Duvet (lower 2/3 of bed, slightly thicker) */}
        <Box size={[w * 0.98, mattressH * 0.55, d * 0.65]}
          position={[0, legH + frameH + mattressH + mattressH * 0.2, d * 0.15]} material={duvet} />
        {/* Duvet fold strip near pillows */}
        <Box size={[w * 0.98, 0.04, d * 0.06]}
          position={[0, legH + frameH + mattressH + mattressH * 0.5, -d * 0.2]} material={duvet} />
        {/* Headboard (padded, tall) */}
        <Box size={[w * 1.04, headH, 0.14]}
          position={[0, headH / 2, -d / 2 - 0.07]} material={accent} />
        {/* 4 pillows: 2 back + 2 front */}
        {[[-1, -0.32, 0.22, 0.28], [1, -0.32, 0.22, 0.28], [-1, -0.18, 0.18, 0.24], [1, -0.18, 0.18, 0.24]].map(
          ([sx, z, ph, pd], i) => (
            <Box key={`pl-${i}`}
              size={[w * 0.4, h * (ph as number), d * (pd as number)]}
              position={[(sx as number) * w * 0.23,
                         legH + frameH + mattressH + h * (ph as number) / 2,
                         d * (z as number)]}
              material={{ kind: "fabric", color: i < 2 ? "#FFFFFF" : "#F2E8D0" }} />
          ))}
      </group>
    );
  },
  nightstand: (f) => {
    const [w, h, d] = f.size;
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={f.primary} />
        <Box
          size={[w * 0.5, h * 0.05, 0.02]}
          position={[0, h * 0.5, d / 2 + 0.01]}
          material={f.accent ?? { kind: "metal", color: "#C9B06B" }}
        />
      </group>
    );
  },
  dresser: (f) => {
    const [w, h, d] = f.size;
    const knob: Material = f.accent ?? { kind: "metal", color: "#C9B06B" };
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={f.primary} />
        {[0.2, 0.5, 0.8].map((y) => (
          [-0.25, 0.25].map((x) => (
            <mesh key={`${y}-${x}`} position={[x * w, y * h, d / 2 + 0.02]} castShadow>
              <sphereGeometry args={[0.025, 12, 8]} />
              <meshStandardMaterial {...resolveMaterialProps(knob)} />
            </mesh>
          ))
        ))}
      </group>
    );
  },
  table_dining: (f) => {
    const [w, h, d] = f.size;
    const top = f.secondary ?? f.primary;
    const leg: Material = f.primary;
    const topH = h * 0.08;
    const apronH = h * 0.1;
    const legH = h - topH - apronH * 0.1;
    const inset = 0.15;
    return (
      <group>
        {/* Top slab */}
        <Box size={[w, topH, d]} position={[0, h - topH / 2, 0]} material={top} />
        {/* Top lip / chamfer fake */}
        <Box size={[w * 1.02, topH * 0.35, d * 1.02]}
          position={[0, h - topH / 2, 0]} material={top} />
        {/* Apron (skirt under the top, between legs) */}
        <Box size={[w - inset * 1.6, apronH, 0.06]}
          position={[0, h - topH - apronH / 2, -d / 2 + inset - 0.03]} material={leg} />
        <Box size={[w - inset * 1.6, apronH, 0.06]}
          position={[0, h - topH - apronH / 2,  d / 2 - inset + 0.03]} material={leg} />
        <Box size={[0.06, apronH, d - inset * 1.6]}
          position={[-w / 2 + inset - 0.03, h - topH - apronH / 2, 0]} material={leg} />
        <Box size={[0.06, apronH, d - inset * 1.6]}
          position={[ w / 2 - inset + 0.03, h - topH - apronH / 2, 0]} material={leg} />
        {/* Legs */}
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
          <Box key={i} size={[0.09, legH, 0.09]}
            position={[sx * (w / 2 - inset), legH / 2, sz * (d / 2 - inset)]} material={leg} />
        ))}
      </group>
    );
  },
  table_coffee: (f) => {
    const [w, h, d] = f.size;
    const top = f.secondary ?? f.primary;
    const topH = h * 0.15;
    return (
      <group>
        <Box size={[w, topH, d]} position={[0, h - topH / 2, 0]} material={top} />
        <Box size={[w * 0.9, h - topH, d * 0.9]} position={[0, (h - topH) / 2, 0]} material={f.primary} />
      </group>
    );
  },
  table_side: (f) => builders.table_coffee!(f),
  chair: (f) => {
    const [w, h, d] = f.size;
    const prim = f.primary;
    const seatH = h * 0.45;
    const backH = h * 0.55;
    const legT = 0.05;
    return (
      <group>
        {/* Seat */}
        <Box size={[w, h * 0.08, d]} position={[0, seatH, 0]} material={prim} />
        {/* Back top rail */}
        <Box size={[w, h * 0.06, 0.06]}
          position={[0, seatH + backH * 0.92, -d / 2 + 0.03]} material={prim} />
        {/* Back bottom rail */}
        <Box size={[w, h * 0.04, 0.04]}
          position={[0, seatH + backH * 0.3, -d / 2 + 0.03]} material={prim} />
        {/* Vertical spindles (3) */}
        {[-1, 0, 1].map((i) => (
          <Box key={`sp-${i}`} size={[0.025, backH * 0.7, 0.025]}
            position={[i * (w * 0.3), seatH + backH * 0.58, -d / 2 + 0.03]} material={prim} />
        ))}
        {/* Legs */}
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
          <Box key={`cl-${i}`} size={[legT, seatH, legT]}
            position={[sx * (w / 2 - legT), seatH / 2, sz * (d / 2 - legT)]} material={prim} />
        ))}
        {/* Stretcher rail between front legs */}
        <Box size={[w - legT * 2, 0.025, 0.025]}
          position={[0, seatH * 0.35, d / 2 - legT]} material={prim} />
      </group>
    );
  },
  stool: (f) => {
    const [w, h, d] = f.size;
    const radius = Math.min(w, d) / 2;
    return (
      <group>
        <Cyl radius={radius} height={0.05} position={[0, h - 0.025, 0]} material={f.primary} />
        <Cyl radius={radius * 0.15} height={h - 0.05} position={[0, (h - 0.05) / 2, 0]} material={f.primary} />
      </group>
    );
  },
  tv: (f) => {
    const [w, h, d] = f.size;
    const screen: Material = f.accent ?? { kind: "screen", color: "#5EC7E8", emissive: "#2A5F7A", emissiveIntensity: 0.6 };
    const bezel: Material = f.primary;
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={bezel} />
        <mesh position={[0, h / 2, d / 2 + 0.002]} castShadow>
          <planeGeometry args={[w * 0.95, h * 0.9]} />
          <meshStandardMaterial {...resolveMaterialProps(screen)} />
        </mesh>
      </group>
    );
  },
  tv_stand: (f) => {
    const [w, h, d] = f.size;
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={f.primary} />
      </group>
    );
  },
  bookshelf: (f) => {
    const [w, h, d] = f.size;
    const shelves = 4;
    const sideT = 0.04;
    const backMat: Material = f.secondary ?? { kind: "wood", color: "#6B4A2E" };
    return (
      <group>
        {/* Back panel (thin) */}
        <Box size={[w, h, sideT * 0.5]} position={[0, h / 2, -d / 2 + sideT * 0.25]} material={backMat} />
        {/* Left & right sides */}
        <Box size={[sideT, h, d]} position={[-w / 2 + sideT / 2, h / 2, 0]} material={f.primary} />
        <Box size={[sideT, h, d]} position={[ w / 2 - sideT / 2, h / 2, 0]} material={f.primary} />
        {/* Top & bottom */}
        <Box size={[w, sideT, d]} position={[0, h - sideT / 2, 0]} material={f.primary} />
        <Box size={[w, sideT, d]} position={[0, sideT / 2, 0]} material={f.primary} />
        {/* Inner shelves */}
        {Array.from({ length: shelves }).map((_, i) => {
          const y = (i + 1) * (h / (shelves + 1));
          return (
            <Box key={`sh-${i}`} size={[w - sideT * 2, 0.028, d * 0.94]}
              position={[0, y, 0]} material={f.primary} />
          );
        })}
        {/* Book rows with varied height */}
        {Array.from({ length: shelves + 1 }).map((_, row) => {
          const yTop = row < shelves
            ? (row + 1) * (h / (shelves + 1))
            : h - sideT;
          const yBase = row === 0 ? sideT : row * (h / (shelves + 1));
          const shelfH = yTop - yBase;
          return Array.from({ length: 6 }).map((_, col) => {
            const colors = ["#6B3A2A", "#2E4A6B", "#5A4632", "#3A5F4A", "#4A3A6B", "#C9A673"];
            const bh = shelfH * (0.65 + ((row * 7 + col * 11) % 30) / 100);
            const bw = (w - sideT * 2 - 0.06) / 6.2;
            const x = -w / 2 + sideT + 0.03 + col * ((w - sideT * 2 - 0.06) / 6) + bw / 2;
            return (
              <Box key={`bk-${row}-${col}`} size={[bw, bh, d * 0.35]}
                position={[x, yBase + bh / 2, 0]}
                material={{ kind: "paint", color: colors[(row * 3 + col) % colors.length] }} />
            );
          });
        })}
      </group>
    );
  },
  lamp_floor: (f) => {
    const [w, h, d] = f.size;
    const shadeR = Math.max(w, d) / 2;
    const shadeH = Math.max(0.28, h * 0.22);
    const accent: Material = f.accent ?? { kind: "fabric", color: "#F5E6B8", emissive: "#F5C451", emissiveIntensity: 0.5 };
    const metal: Material = f.primary.kind === "metal" ? f.primary : { kind: "metal", color: "#3A3024" };
    return (
      <group>
        {/* Weighted base disc */}
        <Cyl radius={shadeR * 0.9} height={0.03} position={[0, 0.015, 0]} material={metal} />
        <Cyl radius={shadeR * 0.6} height={0.04} position={[0, 0.05, 0]} material={metal} />
        {/* Stem */}
        <Cyl radius={0.025} height={h - shadeH - 0.07} position={[0, 0.07 + (h - shadeH - 0.07) / 2, 0]} material={metal} />
        {/* Socket / neck */}
        <Cyl radius={0.045} height={0.06} position={[0, h - shadeH - 0.03, 0]} material={metal} />
        {/* Shade (slightly conical via two cylinders) */}
        <Cyl radius={shadeR * 0.85} height={shadeH} position={[0, h - shadeH / 2, 0]} material={accent} />
        <Cyl radius={shadeR} height={0.03} position={[0, h - shadeH + 0.01, 0]} material={accent} />
      </group>
    );
  },
  lamp_table: (f) => {
    const [w, h, d] = f.size;
    const shadeR = Math.max(w, d) / 2;
    const shadeH = h * 0.5;
    const accent: Material = f.accent ?? { kind: "fabric", color: "#F5E6B8", emissive: "#F5C451", emissiveIntensity: 0.5 };
    const metal: Material = f.primary.kind === "metal" ? f.primary : { kind: "metal", color: "#3A3024" };
    return (
      <group>
        {/* Base disc */}
        <Cyl radius={shadeR * 0.5} height={0.03} position={[0, 0.015, 0]} material={metal} />
        {/* Body / stem */}
        <Cyl radius={shadeR * 0.18} height={h * 0.42}
          position={[0, 0.03 + h * 0.42 / 2, 0]} material={metal} />
        {/* Socket */}
        <Cyl radius={0.03} height={0.05} position={[0, h - shadeH - 0.01, 0]} material={metal} />
        {/* Shade: tapered via two cyls */}
        <Cyl radius={shadeR * 0.8} height={shadeH} position={[0, h - shadeH / 2, 0]} material={accent} />
        <Cyl radius={shadeR} height={0.025} position={[0, h - shadeH + 0.01, 0]} material={accent} />
      </group>
    );
  },
  pendant_lamp: (f) => {
    const [w, h, d] = f.size;
    const shadeR = Math.max(w, d) / 2;
    const accent: Material = f.accent ?? { kind: "metal", color: "#D4A84B", emissive: "#F5C451", emissiveIntensity: 0.8 };
    const metal: Material = { kind: "metal", color: "#1E1E1E" };
    return (
      <group>
        {/* Ceiling rose (canopy) */}
        <Cyl radius={0.06} height={0.03} position={[0, 1.5 + h - 0.015, 0]} material={metal} />
        {/* Cord */}
        <Cyl radius={0.006} height={1.45} position={[0, h + 0.72, 0]} material={metal} />
        {/* Shade body: dome + rim */}
        <Cyl radius={shadeR * 0.95} height={h * 0.85} position={[0, h * 0.425, 0]} material={accent} />
        <Cyl radius={shadeR} height={h * 0.12} position={[0, h * 0.06, 0]} material={accent} />
        {/* Glowing bulb underneath */}
        <Sph radius={shadeR * 0.35}
          position={[0, 0, 0]}
          material={{ kind: "screen", color: "#FFF4C4", emissive: "#FFEA9E", emissiveIntensity: 1.2 }} />
      </group>
    );
  },
  plant: (f) => {
    const [w, h, d] = f.size;
    const potH = Math.min(h * 0.3, 0.25);
    const potR = Math.min(w, d) / 2 * 0.75;
    const foliageR = Math.min(w, d) / 2;
    const foliage: Material = f.secondary ?? { kind: "fabric", color: "#7FA071" };
    const pot: Material = f.primary;
    const soilMat: Material = { kind: "stone", color: "#3A2E22", roughness: 1 };
    const darker: Material = { kind: "fabric", color: "#4E7A55" };
    const foliageH = h - potH;
    return (
      <group>
        {/* Tapered pot: wider rim + narrower base */}
        <Cyl radius={potR} height={potH * 0.9} position={[0, potH * 0.45, 0]} material={pot} />
        <Cyl radius={potR * 1.05} height={potH * 0.1}
          position={[0, potH - potH * 0.05, 0]} material={pot} />
        {/* Soil */}
        <Cyl radius={potR * 0.92} height={0.02}
          position={[0, potH, 0]} material={soilMat} />
        {/* Two layered foliage blobs for depth */}
        <Sph radius={foliageR * 0.85}
          position={[0, potH + foliageH * 0.4, 0]}
          scale={[1, foliageH * 0.7 / (foliageR * 0.85 * 2), 1]}
          material={darker} />
        <Sph radius={foliageR}
          position={[0, potH + foliageH * 0.6, 0]}
          scale={[1, foliageH * 0.65 / (foliageR * 2), 1]}
          material={foliage} />
      </group>
    );
  },
  tree: (f) => {
    const [w, h, d] = f.size;
    const trunkH = h * 0.45;
    const trunkR = Math.min(w, d) * 0.08;
    const crownR = Math.min(w, d) / 2;
    const trunk: Material = { kind: "wood", color: "#5A3E1E" };
    const crown: Material = f.secondary ?? f.primary;
    return (
      <group>
        <Cyl radius={trunkR} height={trunkH} position={[0, trunkH / 2, 0]} material={trunk} />
        <Sph radius={crownR} position={[0, trunkH + (h - trunkH) / 2, 0]} scale={[1, (h - trunkH) / (crownR * 2), 1]} material={crown} />
      </group>
    );
  },
  rug: (f) => {
    const [w, h, d] = f.size;
    const y = Math.max(0.005, h / 2);
    const fringe: Material = { kind: "fabric", color: "#E8D8B0", roughness: 1 };
    const border: Material = f.secondary ?? { kind: "fabric", color: "#3A2E22" };
    return (
      <group>
        {/* Main field */}
        <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial {...resolveMaterialProps(f.primary)} />
        </mesh>
        {/* Border */}
        <mesh position={[0, y + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[Math.min(w, d) * 0.42, Math.min(w, d) * 0.48, 4]} />
          <meshStandardMaterial {...resolveMaterialProps(border)} />
        </mesh>
        {/* Fringe strips on both short ends */}
        <mesh position={[0, y + 0.002, -d / 2 - 0.015]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w * 0.96, 0.04]} />
          <meshStandardMaterial {...resolveMaterialProps(fringe)} />
        </mesh>
        <mesh position={[0, y + 0.002, d / 2 + 0.015]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w * 0.96, 0.04]} />
          <meshStandardMaterial {...resolveMaterialProps(fringe)} />
        </mesh>
      </group>
    );
  },
  kitchen_island: (f) => {
    const [w, h, d] = f.size;
    const top = f.secondary ?? { kind: "stone", color: "#2A2620" } as Material;
    const topH = 0.05;
    return (
      <group>
        <Box size={[w, h - topH, d]} position={[0, (h - topH) / 2, 0]} material={f.primary} />
        <Box size={[w * 1.03, topH, d * 1.03]} position={[0, h - topH / 2, 0]} material={top} />
      </group>
    );
  },
  counter: (f) => builders.kitchen_island!(f),
  fridge: (f) => {
    const [w, h, d] = f.size;
    const handle: Material = f.accent ?? { kind: "metal", color: "#C0C0C0" };
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={f.primary} />
        {/* Door split */}
        <Box size={[w * 1.01, 0.01, d * 1.01]} position={[0, h * 0.55, 0]} material={{ kind: "metal", color: "#9FA4A8" }} />
        {/* Handles */}
        <Box size={[0.04, h * 0.3, 0.04]} position={[w / 2 - 0.08, h * 0.75, d / 2 + 0.02]} material={handle} />
        <Box size={[0.04, h * 0.3, 0.04]} position={[w / 2 - 0.08, h * 0.25, d / 2 + 0.02]} material={handle} />
      </group>
    );
  },
  stove: (f) => {
    const [w, h, d] = f.size;
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={f.primary} />
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
          <Cyl
            key={i}
            radius={Math.min(w, d) * 0.12}
            height={0.01}
            position={[sx * w * 0.25, h + 0.005, sz * d * 0.22]}
            material={f.accent ?? { kind: "metal", color: "#2A2A2A", emissive: "#EF6A5E", emissiveIntensity: 0.3 }}
          />
        ))}
      </group>
    );
  },
  cabinet: (f) => {
    const [w, h, d] = f.size;
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={f.primary} />
        <Box size={[w * 0.02, h * 0.8, 0.01]} position={[0, h / 2, d / 2 + 0.005]} material={f.accent ?? { kind: "metal", color: "#C9B06B" }} />
      </group>
    );
  },
  bathtub: (f) => {
    const [w, h, d] = f.size;
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={f.primary} />
        <Box
          size={[w * 0.9, 0.03, d * 0.9]}
          position={[0, h - 0.015, 0]}
          material={f.secondary ?? { kind: "glass", color: "#A8D0E8", opacity: 0.55 }}
        />
      </group>
    );
  },
  toilet: (f) => {
    const [w, h, d] = f.size;
    const bowlH = h * 0.55;
    return (
      <group>
        <Box size={[w * 0.9, bowlH, d * 0.8]} position={[0, bowlH / 2, 0]} material={f.primary} />
        <Box size={[w * 0.9, h - bowlH, d * 0.25]} position={[0, bowlH + (h - bowlH) / 2, -d * 0.3]} material={f.primary} />
      </group>
    );
  },
  sink: (f) => {
    const [w, h, d] = f.size;
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={f.primary} />
        <Box
          size={[w * 0.75, 0.02, d * 0.6]}
          position={[0, h - 0.01, 0]}
          material={{ kind: "metal", color: "#9FA4A8" }}
        />
        <Cyl radius={0.02} height={0.15} position={[0, h + 0.07, -d * 0.2]} material={{ kind: "metal", color: "#C0C0C0" }} />
      </group>
    );
  },
  shower: (f) => {
    const [w, h, d] = f.size;
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={{ kind: "glass", color: "#A8D0E8", opacity: 0.35 }} />
        <Box size={[w * 0.95, 0.02, d * 0.95]} position={[0, 0.01, 0]} material={f.primary} />
      </group>
    );
  },
  mirror: (f) => {
    const [w, h, d] = f.size;
    const frame: Material = f.accent ?? f.primary ?? { kind: "wood", color: "#5A4632" };
    const glass: Material = { kind: "metal", color: "#D8E8F0", roughness: 0.08, metalness: 0.95 };
    const frameT = 0.06;
    return (
      <group>
        {/* Stepped outer frame */}
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={frame} />
        <Box size={[w * 1.03, frameT, d * 1.15]} position={[0, h * 0.5 + h / 2 - frameT / 2, 0]} material={frame} />
        <Box size={[w * 1.03, frameT, d * 1.15]} position={[0, -h / 2 + h / 2 + frameT / 2, 0]} material={frame} />
        {/* Glass */}
        <Box size={[w * 0.9, h * 0.9, d * 1.05]} position={[0, h / 2, 0]} material={glass} />
      </group>
    );
  },
  fireplace: (f) => {
    const [w, h, d] = f.size;
    const fire: Material = f.accent ?? { kind: "fabric", color: "#EF6A5E", emissive: "#F5C451", emissiveIntensity: 1.2 };
    const mantel: Material = f.secondary ?? { kind: "wood", color: "#5A4632" };
    const opening: Material = { kind: "stone", color: "#1A1612", roughness: 0.95 };
    const hearthH = 0.08;
    const mantelY = h * 0.55;
    return (
      <group>
        {/* Hearth (stone base) */}
        <Box size={[w * 1.1, hearthH, d * 1.15]}
          position={[0, hearthH / 2, 0]} material={f.primary} />
        {/* Main body */}
        <Box size={[w, h - hearthH, d]}
          position={[0, hearthH + (h - hearthH) / 2, 0]} material={f.primary} />
        {/* Firebox opening (dark recess) */}
        <Box size={[w * 0.58, h * 0.42, d * 0.2]}
          position={[0, hearthH + h * 0.22, d / 2 - 0.04]} material={opening} />
        {/* Flames */}
        <Box size={[w * 0.48, h * 0.3, d * 0.15]}
          position={[0, hearthH + h * 0.18, d / 2 - 0.02]} material={fire} />
        {/* Mantel shelf */}
        <Box size={[w * 1.15, 0.05, d * 1.2]}
          position={[0, mantelY, 0]} material={mantel} />
        {/* Mantel underside trim */}
        <Box size={[w * 1.05, 0.03, d * 1.05]}
          position={[0, mantelY - 0.04, 0]} material={mantel} />
      </group>
    );
  },
  desk: (f) => builders.table_dining!(f),
  server_rack: (f) => {
    const [w, h, d] = f.size;
    const accent: Material = f.accent ?? { kind: "screen", color: "#6FD38F", emissive: "#6FD38F", emissiveIntensity: 0.9 };
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={f.primary} />
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            size={[w * 0.85, 0.02, 0.005]}
            position={[0, (i + 1) * (h / 9), d / 2 + 0.003]}
            material={accent}
          />
        ))}
      </group>
    );
  },
  pool: (f) => {
    const [w, h, d] = f.size;
    const water: Material = f.secondary ?? { kind: "glass", color: "#5EC7E8", opacity: 0.6 };
    return (
      <group>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={f.primary} />
        <Box size={[w * 0.92, 0.04, d * 0.92]} position={[0, h - 0.02, 0]} material={water} />
      </group>
    );
  },
  bench: (f) => {
    const [w, h, d] = f.size;
    return (
      <group>
        <Box size={[w, h * 0.2, d]} position={[0, h * 0.9, 0]} material={f.primary} />
        <Box size={[0.06, h * 0.8, d]} position={[-w / 2 + 0.04, h * 0.4, 0]} material={f.primary} />
        <Box size={[0.06, h * 0.8, d]} position={[ w / 2 - 0.04, h * 0.4, 0]} material={f.primary} />
      </group>
    );
  },
  umbrella: (f) => {
    const [w, h, d] = f.size;
    const poleR = 0.04;
    const canopyH = h * 0.1;
    return (
      <group>
        <Cyl radius={poleR} height={h} position={[0, h / 2, 0]} material={{ kind: "metal", color: "#3A3024" }} />
        <Cyl radius={Math.max(w, d) / 2} height={canopyH} position={[0, h - canopyH / 2, 0]} material={f.primary} radialSegments={32} />
      </group>
    );
  },
  box: (f) => (
    <Box size={f.size} position={[0, f.size[1] / 2, 0]} material={f.primary} />
  ),
};

export function FurniturePiece({ spec }: { spec: Furniture }) {
  const builder = builders[spec.type] ?? builders.box!;
  const [px, py, pz] = spec.position;
  // position is the center of the bounding box; our builders place the piece with its
  // base at y=0 in group-local coords. So subtract size[1]/2 from py so callers can
  // use the absolute Y center.
  const groupY = py - spec.size[1] / 2;
  return (
    <group position={[px, groupY, pz]} rotation={[0, spec.rotation ?? 0, 0]}>
      {builder(spec)}
    </group>
  );
}

export function Furniture({ items }: { items: Furniture[] }) {
  const rendered = useMemo(() => items.map((f) => (
    <FurniturePiece key={f.id} spec={f} />
  )), [items]);
  return <>{rendered}</>;
}

// Avoid tree-shake of THREE namespace if consumers ever need it.
export type { FurnitureType };
void THREE;
