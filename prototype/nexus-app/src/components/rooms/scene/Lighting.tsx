"use client";

import { Environment } from "@react-three/drei";
import type { Lighting as LightingSpec } from "../schema/room-schema";

export function Lighting({ lighting, outdoor }: { lighting: LightingSpec; outdoor?: boolean }) {
  const [sx, sy, sz] = lighting.sunDirection;
  const dist = 20;
  return (
    <>
      <ambientLight intensity={lighting.ambientIntensity * 0.55} color={outdoor ? "#E8F0FF" : "#FFFFFF"} />
      {/* Hemisphere fill for softer, more natural indirect bounce */}
      <hemisphereLight
        args={[outdoor ? "#B8D8FF" : "#FFF4DC", outdoor ? "#6B5A3E" : "#2E2620", lighting.ambientIntensity * 0.75]}
      />
      <directionalLight
        castShadow
        color={lighting.sunColor}
        intensity={lighting.sunIntensity}
        position={[sx * dist, Math.abs(sy) * dist + 5, sz * dist]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-bias={-0.0005}
      />
      <Environment preset={lighting.envPreset} />
    </>
  );
}
