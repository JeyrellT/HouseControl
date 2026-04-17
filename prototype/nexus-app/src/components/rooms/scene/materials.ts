import type { Material, MaterialKind } from "../schema/room-schema";

// Sensible PBR defaults per material kind. These get overridden if the spec provides
// explicit roughness/metalness/emissive/opacity.
const DEFAULTS: Record<MaterialKind, { roughness: number; metalness: number; opacity?: number; transparent?: boolean }> = {
  wood:    { roughness: 0.75, metalness: 0.00 },
  fabric:  { roughness: 0.95, metalness: 0.00 },
  metal:   { roughness: 0.35, metalness: 0.90 },
  glass:   { roughness: 0.05, metalness: 0.00, opacity: 0.35, transparent: true },
  plastic: { roughness: 0.45, metalness: 0.00 },
  screen:  { roughness: 0.20, metalness: 0.10 },
  stone:   { roughness: 0.85, metalness: 0.00 },
  plaster: { roughness: 0.95, metalness: 0.00 },
  leather: { roughness: 0.55, metalness: 0.05 },
  paint:   { roughness: 0.60, metalness: 0.00 },
};

export interface ResolvedMaterialProps {
  color: string;
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
}

/** Build props ready to spread onto a <meshStandardMaterial />. */
export function resolveMaterialProps(mat: Material): ResolvedMaterialProps {
  const base = DEFAULTS[mat.kind];
  const props: ResolvedMaterialProps = {
    color: mat.color,
    roughness: mat.roughness ?? base.roughness,
    metalness: mat.metalness ?? base.metalness,
  };
  if (mat.emissive) {
    props.emissive = mat.emissive;
    props.emissiveIntensity = mat.emissiveIntensity ?? 0.8;
  } else if (mat.kind === "screen") {
    // Screens glow subtly by default using their own color.
    props.emissive = mat.color;
    props.emissiveIntensity = mat.emissiveIntensity ?? 0.4;
  }
  const opacity = mat.opacity ?? base.opacity;
  if (opacity !== undefined) {
    props.opacity = opacity;
    props.transparent = true;
  } else if (base.transparent) {
    props.transparent = true;
  }
  return props;
}
