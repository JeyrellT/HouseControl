// RoomSpec: contract describing a 3D room in real-world units (meters).
//
// Coordinate system (Three.js default):
//   - Origin at the center of the floor.
//   - +Y up (towards ceiling).
//   - Room extends from -dimensions[i]/2 to +dimensions[i]/2 on X (width) and Z (depth).
//   - Floor plane is at y = 0, ceiling at y = dimensions[1].
//
// Walls:
//   - "north" is the wall at -Z (back), "south" at +Z (front / towards camera default),
//     "east" at +X, "west" at -X.
//
// Openings (windows / doors) use normalized coordinates along the wall:
//   - u: 0..1 horizontal offset (center of the opening) along the wall's horizontal span.
//   - v: 0..1 vertical offset (center) along the wall's vertical span (0 = floor, 1 = ceiling).
//   - width / height: opening size in meters.
//
// Furniture:
//   - position: world-space [x, y, z] in meters, at the CENTER of the bounding box.
//   - rotation: radians around +Y.
//   - size: [w, h, d] bounding box in meters.

import { z } from "zod";

// ────────────────────────── Materials ──────────────────────────

export const MaterialKindSchema = z.enum([
  "wood",
  "fabric",
  "metal",
  "glass",
  "plastic",
  "screen",
  "stone",
  "plaster",
  "leather",
  "paint",
]);
export type MaterialKind = z.infer<typeof MaterialKindSchema>;

const HexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, "Color must be a hex string like #AABBCC");

export const MaterialSchema = z.object({
  kind: MaterialKindSchema,
  color: HexColor,
  roughness: z.number().min(0).max(1).optional(),
  metalness: z.number().min(0).max(1).optional(),
  emissive: HexColor.optional(),
  emissiveIntensity: z.number().min(0).max(8).optional(),
  opacity: z.number().min(0).max(1).optional(),
});
export type Material = z.infer<typeof MaterialSchema>;

// ────────────────────────── Openings ──────────────────────────

export const WallSideSchema = z.enum(["north", "south", "east", "west"]);
export type WallSide = z.infer<typeof WallSideSchema>;

export const OpeningSchema = z.object({
  wall: WallSideSchema,
  kind: z.enum(["window", "door"]),
  u: z.number().min(0).max(1),
  v: z.number().min(0).max(1),
  width: z.number().positive(),
  height: z.number().positive(),
  frameColor: HexColor.optional(),
  glassColor: HexColor.optional(),
});
export type Opening = z.infer<typeof OpeningSchema>;

// ────────────────────────── Furniture ──────────────────────────

export const FurnitureTypeSchema = z.enum([
  "sofa",
  "armchair",
  "bed",
  "nightstand",
  "dresser",
  "table_dining",
  "table_coffee",
  "table_side",
  "chair",
  "stool",
  "tv",
  "tv_stand",
  "bookshelf",
  "lamp_floor",
  "lamp_table",
  "pendant_lamp",
  "plant",
  "rug",
  "kitchen_island",
  "counter",
  "fridge",
  "stove",
  "cabinet",
  "bathtub",
  "toilet",
  "sink",
  "shower",
  "mirror",
  "fireplace",
  "desk",
  "server_rack",
  "pool",
  "tree",
  "bench",
  "umbrella",
  "box",
]);
export type FurnitureType = z.infer<typeof FurnitureTypeSchema>;

export const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof Vec3Schema>;

export const FurnitureSchema = z.object({
  id: z.string().min(1),
  type: FurnitureTypeSchema,
  position: Vec3Schema,
  rotation: z.number().default(0),
  size: Vec3Schema,
  primary: MaterialSchema,
  secondary: MaterialSchema.optional(),
  accent: MaterialSchema.optional(),
  label: z.string().optional(),
});
export type Furniture = z.infer<typeof FurnitureSchema>;

// ────────────────────────── Lighting ──────────────────────────

export const EnvPresetSchema = z.enum([
  "apartment",
  "city",
  "dawn",
  "forest",
  "lobby",
  "night",
  "park",
  "studio",
  "sunset",
  "warehouse",
]);
export type EnvPreset = z.infer<typeof EnvPresetSchema>;

export const LightingSchema = z.object({
  ambientIntensity: z.number().min(0).max(4).default(0.35),
  sunIntensity: z.number().min(0).max(8).default(1.2),
  sunDirection: Vec3Schema.default([6, 10, 4]),
  sunColor: HexColor.default("#FFF4E0"),
  envPreset: EnvPresetSchema.default("apartment"),
});
export type Lighting = z.infer<typeof LightingSchema>;

// ────────────────────────── Room ──────────────────────────

// Architectural trim: baseboards, crown molding, window sills, door casings.
// All fields optional — sensible defaults are derived from wall/floor colors.
export const TrimSchema = z.object({
  baseboard: MaterialSchema.optional(),
  baseboardHeight: z.number().positive().default(0.12),
  crown: MaterialSchema.optional(),
  crownHeight: z.number().positive().default(0.08),
  casing: MaterialSchema.optional(),
  sill: MaterialSchema.optional(),
  sillDepth: z.number().positive().default(0.09),
});
export type Trim = z.infer<typeof TrimSchema>;

export const RoomSpecSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  displayTag: z.string().min(1).optional(),
  dimensions: Vec3Schema, // [width, height, depth] in meters
  floor: MaterialSchema,
  walls: MaterialSchema,
  ceiling: MaterialSchema.optional(),
  openings: z.array(OpeningSchema).default([]),
  furniture: z.array(FurnitureSchema).default([]),
  lighting: LightingSchema.default(LightingSchema.parse({})),
  outdoor: z.boolean().default(false),
  accent: HexColor.default("#D4A84B"),
  trim: TrimSchema.optional(),
});
export type RoomSpec = z.infer<typeof RoomSpecSchema>;

// Helper: safeParse wrapper with a clean error message.
export function parseRoomSpec(input: unknown):
  | { ok: true; spec: RoomSpec }
  | { ok: false; error: string } {
  const r = RoomSpecSchema.safeParse(input);
  if (r.success) return { ok: true, spec: r.data };
  return { ok: false, error: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
}
