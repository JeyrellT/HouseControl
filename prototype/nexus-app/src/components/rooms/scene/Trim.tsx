"use client";

import type { Material, Opening, RoomSpec, Trim, WallSide } from "../schema/room-schema";
import { resolveMaterialProps } from "./materials";

// A thin box used as molding / sill / threshold / casing strip.
function Strip({
  size,
  position,
  rotation = [0, 0, 0],
  material,
}: {
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  material: Material;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial {...resolveMaterialProps(material)} />
    </mesh>
  );
}

// Defaults derived from the room palette when the spec doesn't override.
export function resolveTrim(spec: RoomSpec): Required<Trim> {
  const t = spec.trim ?? ({} as Trim);
  const baseboard: Material = t.baseboard ?? { kind: "wood", color: "#3A2E22", roughness: 0.6 };
  const crown: Material = t.crown ?? (spec.ceiling ?? spec.walls);
  const casing: Material = t.casing ?? { kind: "wood", color: "#3A2E22", roughness: 0.55 };
  const sill: Material = t.sill ?? { kind: "stone", color: "#D8D0C2", roughness: 0.5 };
  return {
    baseboard,
    baseboardHeight: t.baseboardHeight ?? 0.12,
    crown,
    crownHeight: t.crownHeight ?? 0.08,
    casing,
    sill,
    sillDepth: t.sillDepth ?? 0.09,
  };
}

// Render baseboard + crown molding as 4 strips each (one per wall).
export function PerimeterMoldings({
  spec,
  trim,
  hiddenWall = null,
}: {
  spec: RoomSpec;
  trim: Required<Trim>;
  hiddenWall?: WallSide | null;
}) {
  const [w, h, d] = spec.dimensions;
  const bbH = trim.baseboardHeight;
  const bbT = 0.02; // thickness sticking out from wall
  const crH = trim.crownHeight;
  const crT = 0.04;

  // Four walls: north (-Z), south (+Z), east (+X), west (-X).
  // We make the strip length = wall span so the corners overlap slightly (looks fine).
  return (
    <group>
      {/* Baseboards at y = bbH/2 */}
      {hiddenWall !== "north" && (
        <Strip size={[w, bbH, bbT]} position={[0, bbH / 2, -d / 2 + bbT / 2]} material={trim.baseboard} />
      )}
      {hiddenWall !== "south" && (
        <Strip size={[w, bbH, bbT]} position={[0, bbH / 2,  d / 2 - bbT / 2]} material={trim.baseboard} />
      )}
      {hiddenWall !== "east" && (
        <Strip size={[bbT, bbH, d]} position={[ w / 2 - bbT / 2, bbH / 2, 0]} material={trim.baseboard} />
      )}
      {hiddenWall !== "west" && (
        <Strip size={[bbT, bbH, d]} position={[-w / 2 + bbT / 2, bbH / 2, 0]} material={trim.baseboard} />
      )}

      {/* Crown molding at y = h - crH/2 */}
      {hiddenWall !== "north" && (
        <Strip size={[w, crH, crT]} position={[0, h - crH / 2, -d / 2 + crT / 2]} material={trim.crown} />
      )}
      {hiddenWall !== "south" && (
        <Strip size={[w, crH, crT]} position={[0, h - crH / 2,  d / 2 - crT / 2]} material={trim.crown} />
      )}
      {hiddenWall !== "east" && (
        <Strip size={[crT, crH, d]} position={[ w / 2 - crT / 2, h - crH / 2, 0]} material={trim.crown} />
      )}
      {hiddenWall !== "west" && (
        <Strip size={[crT, crH, d]} position={[-w / 2 + crT / 2, h - crH / 2, 0]} material={trim.crown} />
      )}
    </group>
  );
}

// For each opening, render casing (thick architrave) + sill (windows) / threshold (doors).
export function OpeningTrims({
  spec,
  trim,
  hiddenWall = null,
}: {
  spec: RoomSpec;
  trim: Required<Trim>;
  hiddenWall?: WallSide | null;
}) {
  const [w, h, d] = spec.dimensions;

  function wallFrame(side: WallSide): {
    spanH: number;
    pos: [number, number, number];
    rotY: number;
    // outward direction (unit vector in world XZ) away from room interior.
    outward: [number, number];
  } {
    switch (side) {
      case "north": return { spanH: w, pos: [0, h / 2, -d / 2], rotY: 0,            outward: [0, -1] };
      case "south": return { spanH: w, pos: [0, h / 2,  d / 2], rotY: Math.PI,      outward: [0,  1] };
      case "east":  return { spanH: d, pos: [ w / 2, h / 2, 0], rotY: -Math.PI / 2, outward: [ 1, 0] };
      case "west":  return { spanH: d, pos: [-w / 2, h / 2, 0], rotY:  Math.PI / 2, outward: [-1, 0] };
    }
  }

  return (
    <group>
      {spec.openings.map((op: Opening, idx) => {
        if (hiddenWall === op.wall) return null;
        const f = wallFrame(op.wall);
        const spanH = f.spanH;
        const spanV = h;
        // Opening center in wall-local coords.
        const cx = (op.u - 0.5) * spanH;
        const cy = (op.v - 0.5) * spanV;
        // World position = rotated(localX) + wallCenter. Local X maps to world via rotY.
        const cos = Math.cos(f.rotY);
        const sin = Math.sin(f.rotY);
        const wx = f.pos[0] + cos * cx;
        const wz = f.pos[2] - sin * cx;
        const wy = f.pos[1] + cy;

        const isDoor = op.kind === "door";
        const casingT = 0.06; // thickness sticking out
        const casingW = 0.09; // perpendicular width (visible as architrave)

        // Bottom of opening in world Y.
        const yBottom = wy - op.height / 2;
        const yTop = wy + op.height / 2;

        // Push trims slightly outward so they sit on the interior face.
        const eps = 0.011;

        return (
          <group key={idx} position={[wx, 0, wz]} rotation={[0, f.rotY, 0]}>
            {/* Casing: top + left + right (door) / top + left + right + header (window). */}
            {/* top header */}
            <Strip
              size={[op.width + casingW * 2, casingW, casingT]}
              position={[0, yTop + casingW / 2, eps]}
              material={trim.casing}
            />
            {/* left jamb */}
            <Strip
              size={[casingW, op.height, casingT]}
              position={[-op.width / 2 - casingW / 2, (yBottom + yTop) / 2, eps]}
              material={trim.casing}
            />
            {/* right jamb */}
            <Strip
              size={[casingW, op.height, casingT]}
              position={[ op.width / 2 + casingW / 2, (yBottom + yTop) / 2, eps]}
              material={trim.casing}
            />
            {!isDoor && (
              <>
                {/* bottom sill base (between jambs) */}
                <Strip
                  size={[op.width + casingW * 2, casingW, casingT]}
                  position={[0, yBottom - casingW / 2, eps]}
                  material={trim.casing}
                />
                {/* protruding sill shelf (stone) */}
                <Strip
                  size={[op.width + casingW * 2 + 0.04, 0.03, trim.sillDepth]}
                  position={[0, yBottom - casingW - 0.015, trim.sillDepth / 2]}
                  material={trim.sill}
                />
              </>
            )}
            {isDoor && (
              <Strip
                size={[op.width + casingW * 2, 0.02, 0.18]}
                position={[0, 0.01, 0.09]}
                material={trim.sill}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}
