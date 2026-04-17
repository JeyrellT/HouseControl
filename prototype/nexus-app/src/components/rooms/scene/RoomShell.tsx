"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Opening, RoomSpec, WallSide } from "../schema/room-schema";
import { resolveMaterialProps } from "./materials";
import { OpeningTrims, PerimeterMoldings, resolveTrim } from "./Trim";

interface WallLayout {
  side: WallSide;
  /** Horizontal span of the wall (X on back/front, Z on side walls). */
  spanH: number;
  /** Vertical span (room height). */
  spanV: number;
  /** Position of the wall's center in world space. */
  position: [number, number, number];
  /** Rotation around Y so the wall's +Z local axis points into the room. */
  rotationY: number;
}

function buildWallLayouts(dims: [number, number, number]): WallLayout[] {
  const [w, h, d] = dims;
  return [
    { side: "north", spanH: w, spanV: h, position: [0, h / 2, -d / 2], rotationY: 0 },
    { side: "south", spanH: w, spanV: h, position: [0, h / 2,  d / 2], rotationY: Math.PI },
    { side: "east",  spanH: d, spanV: h, position: [ w / 2, h / 2, 0], rotationY: -Math.PI / 2 },
    { side: "west",  spanH: d, spanV: h, position: [-w / 2, h / 2, 0], rotationY:  Math.PI / 2 },
  ];
}

/**
 * Build a wall geometry with rectangular holes for each opening.
 * The wall's local frame is centered at (0, 0, 0), lying on the XY plane
 * (normal pointing along +Z). X = horizontal, Y = vertical.
 */
function buildWallGeometry(spanH: number, spanV: number, openings: Opening[]): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-spanH / 2, -spanV / 2);
  shape.lineTo( spanH / 2, -spanV / 2);
  shape.lineTo( spanH / 2,  spanV / 2);
  shape.lineTo(-spanH / 2,  spanV / 2);
  shape.lineTo(-spanH / 2, -spanV / 2);

  for (const op of openings) {
    // Opening center in wall-local coords.
    const cx = (op.u - 0.5) * spanH;
    const cy = (op.v - 0.5) * spanV;
    const hw = Math.min(op.width, spanH * 0.95) / 2;
    const hh = Math.min(op.height, spanV * 0.95) / 2;
    const hole = new THREE.Path();
    hole.moveTo(cx - hw, cy - hh);
    hole.lineTo(cx + hw, cy - hh);
    hole.lineTo(cx + hw, cy + hh);
    hole.lineTo(cx - hw, cy + hh);
    hole.lineTo(cx - hw, cy - hh);
    shape.holes.push(hole);
  }

  return new THREE.ShapeGeometry(shape);
}

function Wall({ layout, openings, material }: {
  layout: WallLayout;
  openings: Opening[];
  material: RoomSpec["walls"];
}) {
  const geom = useMemo(
    () => buildWallGeometry(layout.spanH, layout.spanV, openings),
    [layout.spanH, layout.spanV, openings],
  );
  const matProps = resolveMaterialProps(material);
  return (
    <mesh
      position={layout.position}
      rotation={[0, layout.rotationY, 0]}
      geometry={geom}
      receiveShadow
      castShadow={false}
    >
      <meshStandardMaterial {...matProps} side={THREE.DoubleSide} />
    </mesh>
  );
}

function OpeningFill({ layout, opening }: { layout: WallLayout; opening: Opening }) {
  // A thin pane placed slightly inside the wall so both sides render the glass/door.
  const cx = (opening.u - 0.5) * layout.spanH;
  const cy = (opening.v - 0.5) * layout.spanV;
  const isDoor = opening.kind === "door";
  const glassColor = opening.glassColor ?? (isDoor ? "#6B4A2E" : "#A8D0E8");
  const frameColor = opening.frameColor ?? (isDoor ? "#3A2814" : "#5A4632");
  // Convert from wall-local to world-space.
  const localX = cx;
  const localY = cy;
  const cos = Math.cos(layout.rotationY);
  const sin = Math.sin(layout.rotationY);
  const wx = layout.position[0] + cos * localX;
  const wz = layout.position[2] - sin * localX;
  const wy = layout.position[1] + localY;

  const frameThickness = 0.06;
  const frameDepth = 0.08;
  return (
    <group position={[wx, wy, wz]} rotation={[0, layout.rotationY, 0]}>
      {/* Glass / door slab */}
      <mesh>
        <boxGeometry args={[opening.width, opening.height, 0.03]} />
        {isDoor ? (
          <meshStandardMaterial color={glassColor} roughness={0.6} metalness={0.05} />
        ) : (
          <meshStandardMaterial
            color={glassColor}
            roughness={0.05}
            metalness={0.1}
            transparent
            opacity={0.45}
          />
        )}
      </mesh>
      {/* Frame: top / bottom / left / right strips */}
      {[
        { p: [0,  opening.height / 2, 0], s: [opening.width + frameThickness * 2, frameThickness, frameDepth] },
        { p: [0, -opening.height / 2, 0], s: [opening.width + frameThickness * 2, frameThickness, frameDepth] },
        { p: [-opening.width / 2, 0, 0],  s: [frameThickness, opening.height, frameDepth] },
        { p: [ opening.width / 2, 0, 0],  s: [frameThickness, opening.height, frameDepth] },
      ].map((f, i) => (
        <mesh key={i} position={f.p as [number, number, number]}>
          <boxGeometry args={f.s as [number, number, number]} />
          <meshStandardMaterial color={frameColor} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

export function RoomShell({ spec, hiddenWall }: { spec: RoomSpec; hiddenWall?: WallSide | null }) {
  const [w, h, d] = spec.dimensions;
  const layouts = useMemo(() => buildWallLayouts(spec.dimensions), [spec.dimensions]);
  const floorProps = resolveMaterialProps(spec.floor);
  const ceilingMat = spec.ceiling ?? spec.walls;
  const ceilingProps = resolveMaterialProps(ceilingMat);
  const trim = useMemo(() => resolveTrim(spec), [spec]);

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial {...floorProps} />
      </mesh>

      {/* Ceiling (skipped for outdoor scenes or when a wall is hidden so we see inside from above) */}
      {!spec.outdoor && !hiddenWall && (
        <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial {...ceilingProps} />
        </mesh>
      )}

      {/* Walls with holes for each opening */}
      {layouts.map((layout) => {
        const wallOpenings = spec.openings.filter((o) => o.wall === layout.side);
        if (spec.outdoor) return null;
        if (hiddenWall === layout.side) return null;
        return (
          <group key={layout.side}>
            <Wall layout={layout} openings={wallOpenings} material={spec.walls} />
            {wallOpenings.map((op, i) => (
              <OpeningFill key={`${layout.side}-${i}`} layout={layout} opening={op} />
            ))}
          </group>
        );
      })}

      {/* Architectural trim: baseboards, crown molding, casings, sills */}
      {!spec.outdoor && (
        <>
          <PerimeterMoldings spec={spec} trim={trim} hiddenWall={hiddenWall ?? null} />
          <OpeningTrims spec={spec} trim={trim} hiddenWall={hiddenWall ?? null} />
        </>
      )}
    </group>
  );
}
