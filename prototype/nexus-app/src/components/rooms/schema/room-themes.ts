// Room presets migrated from the legacy CSS-3D format to the Three.js RoomSpec contract.
// All dimensions in meters; origin at the center of the floor, +Y up.

import type { Furniture, RoomSpec } from "./room-schema";

const M = {
  floorWood:    { kind: "wood",    color: "#8B6F4E", roughness: 0.8 } as const,
  floorParquet: { kind: "wood",    color: "#9B7A55", roughness: 0.7 } as const,
  floorMarble:  { kind: "stone",   color: "#E8E8EA", roughness: 0.25, metalness: 0.1 } as const,
  floorTile:    { kind: "stone",   color: "#D8D0BC", roughness: 0.5 } as const,
  floorConcrete:{ kind: "stone",   color: "#6B6E72", roughness: 0.9 } as const,
  floorCarpet:  { kind: "fabric",  color: "#F5D8A8", roughness: 0.95 } as const,
  floorGrass:   { kind: "fabric",  color: "#4E7A32", roughness: 1.0 } as const,
  wallCream:    { kind: "plaster", color: "#F0EBDF", roughness: 0.9 } as const,
  wallWarm:     { kind: "plaster", color: "#E8DDC7", roughness: 0.9 } as const,
  wallCool:     { kind: "plaster", color: "#E8EDF0", roughness: 0.9 } as const,
  wallBlue:     { kind: "plaster", color: "#B8E6F0", roughness: 0.9 } as const,
  wallGarden:   { kind: "plaster", color: "#87CEEB", roughness: 0.9 } as const,
  ceilWhite:    { kind: "plaster", color: "#FAF8F2", roughness: 0.95 } as const,
  sofaNavy:     { kind: "fabric",  color: "#4A5F6D" } as const,
  cushionSage:  { kind: "fabric",  color: "#5B7385" } as const,
  wood:         { kind: "wood",    color: "#6B4A2E" } as const,
  woodDark:     { kind: "wood",    color: "#3A2E22" } as const,
  woodLight:    { kind: "wood",    color: "#B08968" } as const,
  white:        { kind: "plastic", color: "#FFFFFF", roughness: 0.4 } as const,
  black:        { kind: "plastic", color: "#1A1A1A", roughness: 0.3 } as const,
  gold:         { kind: "metal",   color: "#D4A84B", metalness: 0.9, roughness: 0.3 } as const,
  steel:        { kind: "metal",   color: "#C9CED4" } as const,
  screenOn:     { kind: "screen",  color: "#5EC7E8", emissive: "#2E4A6B", emissiveIntensity: 0.8 } as const,
  leaf:         { kind: "fabric",  color: "#7FA071" } as const,
  leafDeep:     { kind: "fabric",  color: "#4E7A55" } as const,
  water:        { kind: "glass",   color: "#5EC7E8", opacity: 0.6 } as const,
};

// Small helper to author furniture quickly.
function f(
  id: string,
  type: Furniture["type"],
  pos: [number, number, number],
  size: [number, number, number],
  primary: Furniture["primary"],
  opts?: Partial<Omit<Furniture, "id" | "type" | "position" | "size" | "primary">>,
): Furniture {
  return {
    id,
    type,
    position: pos,
    rotation: opts?.rotation ?? 0,
    size,
    primary,
    secondary: opts?.secondary,
    accent: opts?.accent,
    label: opts?.label,
  };
}

// ═══════════════════════ VILLA AURORA ═══════════════════════

const ROOM_SALA: RoomSpec = {
  id: "room-sala",
  displayName: "Sala",
  displayTag: "Sala",
  dimensions: [6, 2.7, 5],
  floor: M.floorParquet,
  walls: M.wallCream,
  ceiling: M.ceilWhite,
  accent: "#D4A84B",
  openings: [
    { wall: "north", kind: "window", u: 0.65, v: 0.55, width: 1.8, height: 1.2 },
    { wall: "east",  kind: "door",   u: 0.15, v: 0.40, width: 0.9, height: 2.1 },
  ],
  furniture: [
    f("rug",      "rug",         [0, 0.005, 0.3],   [3.2, 0.01, 2.2],  { kind: "fabric", color: "#6A5641" }),
    f("sofa",     "sofa",         [-1.8, 0.45, 1.5], [2.4, 0.9, 0.95], M.sofaNavy, { secondary: M.cushionSage, rotation: -Math.PI / 2 }),
    f("sofa-r",   "sofa",         [1.9, 0.45, 0.3],  [0.95, 0.9, 2.2], M.sofaNavy, { secondary: M.cushionSage, rotation: Math.PI / 2 }),
    f("coffee",   "table_coffee", [-0.4, 0.22, 0.4], [1.2, 0.45, 0.7], M.woodDark, { secondary: M.wood, label: "Mesa" }),
    f("tv-stand", "tv_stand",     [-0.3, 0.22, -2.25], [2.0, 0.45, 0.35], M.black),
    f("tv",       "tv",           [-0.3, 1.2, -2.45], [1.6, 0.95, 0.08], M.black, { accent: M.screenOn, label: "TV" }),
    f("plant",    "plant",        [2.5, 0.45, -1.8],  [0.5, 0.9, 0.5], { kind: "wood", color: "#8B6F4E" }, { secondary: M.leaf }),
    f("floor-lamp", "lamp_floor", [-2.6, 0.75, -1.5], [0.55, 1.5, 0.55], M.gold),
  ],
  lighting: { ambientIntensity: 0.4, sunIntensity: 1.4, sunDirection: [6, 10, 4], sunColor: "#FFF4E0", envPreset: "apartment" },
  outdoor: false,
};

const ROOM_COCINA: RoomSpec = {
  id: "room-cocina",
  displayName: "Cocina",
  displayTag: "Cocina",
  dimensions: [4.5, 2.6, 3.5],
  floor: M.floorTile,
  walls: M.wallCool,
  ceiling: M.ceilWhite,
  accent: "#EF6A5E",
  openings: [
    { wall: "north", kind: "window", u: 0.5, v: 0.65, width: 1.8, height: 1.1 },
  ],
  furniture: [
    f("island",  "kitchen_island", [0, 0.45, 0.2], [2.2, 0.9, 0.9], { kind: "wood", color: "#D8CDB8" }, { secondary: { kind: "stone", color: "#2A2620" }, label: "Isla" }),
    f("counter-l","counter",       [-2.05, 0.45, 0], [0.4, 0.9, 2.8], { kind: "wood", color: "#E5DCC8" }, { secondary: { kind: "stone", color: "#3A3024" } }),
    f("stove",   "stove",          [-2.05, 0.92, -0.8], [0.4, 0.05, 0.6], M.black, { accent: { kind: "screen", color: "#EF6A5E", emissive: "#EF6A5E", emissiveIntensity: 0.4 } }),
    f("fridge",  "fridge",         [-2.05, 0.9, 1.1], [0.4, 1.8, 0.75], { kind: "plastic", color: "#C9CED4" }, { label: "Refri", accent: { kind: "metal", color: "#9FA4A8" } }),
    f("pend-1",  "pendant_lamp",   [-0.4, 2.0, 0.2], [0.3, 0.35, 0.3], M.gold, { accent: { kind: "metal", color: "#D4A84B", emissive: "#F5C451", emissiveIntensity: 0.9 } }),
    f("pend-2",  "pendant_lamp",   [ 0.4, 2.0, 0.2], [0.3, 0.35, 0.3], M.gold, { accent: { kind: "metal", color: "#D4A84B", emissive: "#F5C451", emissiveIntensity: 0.9 } }),
  ],
  lighting: { ambientIntensity: 0.45, sunIntensity: 1.2, sunDirection: [4, 8, 5], sunColor: "#FFF6D6", envPreset: "apartment" },
  outdoor: false,
};

const ROOM_COMEDOR: RoomSpec = {
  id: "room-comedor",
  displayName: "Comedor",
  displayTag: "Comedor",
  dimensions: [5.5, 2.7, 4],
  floor: M.floorWood,
  walls: M.wallWarm,
  ceiling: M.ceilWhite,
  accent: "#B08968",
  openings: [
    { wall: "north", kind: "window", u: 0.5, v: 0.55, width: 2.0, height: 1.1 },
  ],
  furniture: [
    f("rug-c",   "rug",         [0, 0.005, 0],   [3.4, 0.01, 2.3], { kind: "fabric", color: "#8B4513" }),
    f("table",   "table_dining",[0, 0.38, 0],    [2.6, 0.76, 1.1], M.woodDark, { secondary: M.wood, label: "Mesa" }),
    // Chairs around the table
    ...([-1.0, -0.35, 0.35, 1.0].flatMap((x) =>
      [-0.8, 0.8].map((z) => f(`chair-${x}-${z}`, "chair", [x, 0.27, z], [0.45, 0.9, 0.45], M.woodDark, { rotation: z < 0 ? 0 : Math.PI })),
    )),
    f("chand",   "pendant_lamp",[0, 2.35, 0],    [0.7, 0.35, 0.7], M.gold),
    f("buffet",  "dresser",     [0, 0.4, -1.8],  [2.2, 0.8, 0.5],  M.woodDark, { label: "Buffet" }),
  ],
  lighting: { ambientIntensity: 0.35, sunIntensity: 1.3, sunDirection: [5, 9, 4], sunColor: "#FFE6A8", envPreset: "sunset" },
  outdoor: false,
};

const ROOM_JARDIN: RoomSpec = {
  id: "room-jardin",
  displayName: "Jardín",
  displayTag: "Jardín",
  dimensions: [10, 3, 8],
  floor: M.floorGrass,
  walls: M.wallGarden,
  accent: "#7FA071",
  openings: [],
  furniture: [
    f("tree-1", "tree", [-3.5, 1.8, -3.0], [1.4, 3.6, 1.4], M.leafDeep, { secondary: M.leaf }),
    f("tree-2", "tree", [ 3.5, 1.6, -2.0], [1.2, 3.2, 1.2], M.leafDeep, { secondary: M.leaf }),
    f("tree-3", "tree", [ 3.8, 2.0, 2.8],  [1.5, 4.0, 1.5], M.leafDeep, { secondary: M.leaf }),
    f("pool",   "pool", [0, 0.25, 0.5],    [4.5, 0.5, 2.8], { kind: "stone", color: "#1E4A6B" }, { secondary: M.water, label: "Piscina" }),
    f("bench-j","bench",[-3.5, 0.3, 3.0],  [2.2, 0.6, 0.5], M.wood, { label: "Banca" }),
    f("fire",   "fireplace", [3.2, 0.3, 1.8], [1.2, 0.6, 1.2], { kind: "stone", color: "#3A3A3A" }, { accent: { kind: "fabric", color: "#EF6A5E", emissive: "#F5C451", emissiveIntensity: 1.6 }, label: "Fogata" }),
  ],
  lighting: { ambientIntensity: 0.55, sunIntensity: 2.2, sunDirection: [6, 12, 5], sunColor: "#FFF0C8", envPreset: "park" },
  outdoor: true,
};

const ROOM_MASTER: RoomSpec = {
  id: "room-master",
  displayName: "Suite principal",
  displayTag: "Suite",
  dimensions: [5, 2.7, 4.5],
  floor: M.floorWood,
  walls: { kind: "plaster", color: "#E8DED0", roughness: 0.9 },
  ceiling: M.ceilWhite,
  accent: "#C9A0DC",
  openings: [
    { wall: "west", kind: "window", u: 0.3, v: 0.55, width: 1.6, height: 1.2 },
    { wall: "east", kind: "door",   u: 0.15, v: 0.45, width: 0.9, height: 2.1 },
  ],
  furniture: [
    f("rug-m", "rug", [0, 0.005, 0.2], [3.2, 0.01, 2.4], { kind: "fabric", color: "#4A3A6B" }),
    f("bed",   "bed", [0, 0.3, 0.3],   [2.2, 0.6, 2.0], { kind: "wood", color: "#EFE5D5" }, { secondary: { kind: "fabric", color: "#F5F0E3" }, accent: { kind: "fabric", color: "#4A3A6B" }, label: "Cama king" }),
    f("nst-l", "nightstand", [-1.5, 0.3, -0.4], [0.55, 0.6, 0.45], { kind: "wood", color: "#5A4632" }, { accent: { kind: "metal", color: "#C9B06B" } }),
    f("nst-r", "nightstand", [ 1.5, 0.3, -0.4], [0.55, 0.6, 0.45], { kind: "wood", color: "#5A4632" }, { accent: { kind: "metal", color: "#C9B06B" } }),
    f("lamp-l","lamp_table", [-1.5, 0.85, -0.4], [0.4, 0.5, 0.4], { kind: "metal", color: "#3A3024" }, { accent: { kind: "fabric", color: "#F5E6B8", emissive: "#F5C451", emissiveIntensity: 0.5 } }),
    f("lamp-r","lamp_table", [ 1.5, 0.85, -0.4], [0.4, 0.5, 0.4], { kind: "metal", color: "#3A3024" }, { accent: { kind: "fabric", color: "#F5E6B8", emissive: "#F5C451", emissiveIntensity: 0.5 } }),
    f("dress-m","dresser", [0, 0.4, 1.9], [1.8, 0.8, 0.5], { kind: "wood", color: "#5A4632" }, { accent: { kind: "metal", color: "#C9B06B" } }),
    f("mirror-m","mirror", [0, 1.2, 2.15], [1.2, 0.9, 0.05], { kind: "metal", color: "#D8E8F0" }),
  ],
  lighting: { ambientIntensity: 0.3, sunIntensity: 1.0, sunDirection: [-5, 9, 3], sunColor: "#FFE0CF", envPreset: "dawn" },
  outdoor: false,
};

const ROOM_HIJOS: RoomSpec = {
  id: "room-hijos",
  displayName: "Dormitorio niños",
  displayTag: "Niños",
  dimensions: [4.2, 2.6, 4.2],
  floor: M.floorCarpet,
  walls: M.wallBlue,
  ceiling: M.ceilWhite,
  accent: "#EF6A5E",
  openings: [{ wall: "north", kind: "window", u: 0.7, v: 0.55, width: 1.3, height: 1.1 }],
  furniture: [
    f("rug-k", "rug", [-0.6, 0.005, -0.4], [1.8, 0.01, 1.8], { kind: "fabric", color: "#EF6A5E" }),
    f("bunk",  "bed", [-1.0, 0.45, 1.0],   [1.6, 0.9, 1.9], { kind: "wood", color: "#D4A84B" }, { secondary: { kind: "fabric", color: "#F5F0E3" }, label: "Litera" }),
    f("desk-k","desk", [1.6, 0.38, -1.5],  [1.3, 0.76, 0.6], { kind: "wood", color: "#6FD38F" }, { secondary: { kind: "wood", color: "#88DEA3" }, label: "Escritorio" }),
    f("chair-k","chair",[1.6, 0.22, -0.8], [0.45, 0.8, 0.45], { kind: "plastic", color: "#5EC7E8" }),
    f("toybox","box",  [-1.6, 0.2, -1.6],  [0.9, 0.4, 0.5], { kind: "wood", color: "#C9A0DC" }, { label: "Juguetes" }),
    f("lamp-k","lamp_table", [1.6, 0.9, -1.7], [0.3, 0.4, 0.3], M.gold, { accent: { kind: "fabric", color: "#F5E6B8", emissive: "#F5C451", emissiveIntensity: 0.6 } }),
  ],
  lighting: { ambientIntensity: 0.45, sunIntensity: 1.1, sunDirection: [4, 8, -4], sunColor: "#FFEEC0", envPreset: "apartment" },
  outdoor: false,
};

const ROOM_ESTUDIO: RoomSpec = {
  id: "room-estudio",
  displayName: "Estudio",
  displayTag: "Estudio",
  dimensions: [4.5, 2.7, 4],
  floor: M.floorWood,
  walls: { kind: "plaster", color: "#D4C8B0", roughness: 0.9 },
  ceiling: M.ceilWhite,
  accent: "#8B6F4E",
  openings: [{ wall: "north", kind: "window", u: 0.5, v: 0.55, width: 1.5, height: 1.2 }],
  furniture: [
    f("desk-e", "desk",  [-0.6, 0.38, -1.2], [1.8, 0.76, 0.8], M.woodDark, { secondary: M.wood, label: "Escritorio" }),
    f("mon-1",  "tv",    [-1.0, 1.0, -1.5],  [0.55, 0.35, 0.05], M.black, { accent: { kind: "screen", color: "#5EC7E8", emissive: "#2E4A6B", emissiveIntensity: 0.7 } }),
    f("mon-2",  "tv",    [-0.2, 1.0, -1.5],  [0.55, 0.35, 0.05], M.black, { accent: { kind: "screen", color: "#5EC7E8", emissive: "#2E4A6B", emissiveIntensity: 0.7 } }),
    f("chair-e","chair", [-0.6, 0.32, -0.4], [0.6, 1.0, 0.6], M.black),
    f("books",  "bookshelf", [1.9, 0.9, 0], [0.4, 1.8, 1.8], M.woodDark, { secondary: M.wood, label: "Librería" }),
    f("armch",  "armchair",  [-1.6, 0.38, 1.4], [0.9, 0.85, 0.9], { kind: "fabric", color: "#5A3E30" }),
    f("lamp-e", "lamp_floor",[-1.9, 0.75, 1.7], [0.45, 1.5, 0.45], M.gold, { accent: { kind: "fabric", color: "#F5E6B8", emissive: "#F5C451", emissiveIntensity: 0.55 } }),
  ],
  lighting: { ambientIntensity: 0.3, sunIntensity: 0.9, sunDirection: [5, 8, -4], sunColor: "#FFE0B0", envPreset: "apartment" },
  outdoor: false,
};

const ROOM_BANO_MASTER: RoomSpec = {
  id: "room-bano-master",
  displayName: "Baño de la suite",
  displayTag: "Baño Suite",
  dimensions: [3.2, 2.6, 3],
  floor: M.floorMarble,
  walls: { kind: "plaster", color: "#F0EDE8", roughness: 0.9 },
  ceiling: M.ceilWhite,
  accent: "#5EC7E8",
  openings: [{ wall: "north", kind: "window", u: 0.3, v: 0.65, width: 1.2, height: 0.8 }],
  furniture: [
    f("tub",     "bathtub", [-0.7, 0.2, 0],   [1.8, 0.5, 0.9], M.white, { accent: { kind: "metal", color: "#5EC7E8" }, label: "Tina" }),
    f("vanity",  "sink",    [1.1, 0.4, -0.9], [0.6, 0.85, 1.4], M.white, { label: "Vanity" }),
    f("mirror-b","mirror",  [1.3, 1.6, -0.95],[0.05, 0.9, 1.2], M.wood),
    f("toilet",  "toilet",  [-1.1, 0.25, -1.2], [0.5, 0.55, 0.7], M.white, { label: "WC" }),
    f("shower",  "shower",  [1.1, 1.05, 1.0],  [1.0, 2.0, 1.0], { kind: "glass", color: "#A8D0E8", opacity: 0.35 }),
  ],
  lighting: { ambientIntensity: 0.5, sunIntensity: 1.0, sunDirection: [4, 9, 3], sunColor: "#F0FAFF", envPreset: "studio" },
  outdoor: false,
};

const ROOM_TERRAZA: RoomSpec = {
  id: "room-terraza",
  displayName: "Terraza",
  displayTag: "Terraza",
  dimensions: [6, 3, 4.5],
  floor: M.floorWood,
  walls: { kind: "plaster", color: "#FFB97A" },
  accent: "#F0B85C",
  openings: [],
  furniture: [
    f("lng-1",   "sofa",     [-2.0, 0.3, 0.3], [1.0, 0.6, 1.8], { kind: "fabric", color: "#E8DFC8" }),
    f("lng-2",   "sofa",     [ 2.0, 0.3, 0.3], [1.0, 0.6, 1.8], { kind: "fabric", color: "#E8DFC8" }),
    f("umbrella","umbrella", [0, 1.5, 0.3],   [2.4, 3.0, 2.4], { kind: "fabric", color: "#EF6A5E" }),
    f("tbl-t",   "table_coffee", [0, 0.2, 0.3], [0.8, 0.4, 0.8], { kind: "wood", color: "#3A3024" }, { secondary: M.wood, label: "Mesa" }),
    f("plt-1",   "plant",    [-2.6, 0.35, -1.5], [0.55, 0.7, 0.55], { kind: "wood", color: "#8B6F4E" }, { secondary: M.leaf }),
  ],
  lighting: { ambientIntensity: 0.55, sunIntensity: 1.8, sunDirection: [-6, 10, 2], sunColor: "#FFD896", envPreset: "sunset" },
  outdoor: true,
};

const ROOM_ENTRADA: RoomSpec = {
  id: "room-entrada",
  displayName: "Entrada",
  displayTag: "Entrada",
  dimensions: [4, 2.8, 3],
  floor: M.floorTile,
  walls: M.wallWarm,
  ceiling: M.ceilWhite,
  accent: "#D4A84B",
  openings: [
    { wall: "north", kind: "door", u: 0.5, v: 0.45, width: 1.2, height: 2.2 },
  ],
  furniture: [
    f("rug-e",   "rug",     [0, 0.005, 0.2], [1.8, 0.01, 1.0], { kind: "fabric", color: "#6B4A2E" }),
    f("console", "dresser", [0, 0.4, -1.2],  [1.8, 0.8, 0.4], M.woodDark, { secondary: M.wood, label: "Consola" }),
    f("mirror-e","mirror",  [0, 1.85, -1.4], [1.2, 1.1, 0.05], M.wood),
    f("plant-e", "plant",   [-1.5, 0.5, 1.0],[0.5, 1.0, 0.5], { kind: "wood", color: "#8B6F4E" }, { secondary: M.leaf }),
    f("bench-e", "bench",   [-1.3, 0.2, -0.9],[1.1, 0.4, 0.4], M.woodDark),
  ],
  lighting: { ambientIntensity: 0.4, sunIntensity: 1.0, sunDirection: [4, 9, 2], sunColor: "#FFE0B0", envPreset: "apartment" },
  outdoor: false,
};

const ROOM_BANO_SOCIAL: RoomSpec = {
  id: "room-bano-social",
  displayName: "Baño social",
  displayTag: "Baño social",
  dimensions: [2.5, 2.6, 2.5],
  floor: M.floorTile,
  walls: M.wallCool,
  ceiling: M.ceilWhite,
  accent: "#5EC7E8",
  openings: [],
  furniture: [
    f("sink-s",   "sink",   [-0.7, 0.4, -0.9], [0.7, 0.85, 0.5], M.white, { label: "Lavatorio" }),
    f("toilet-s", "toilet", [ 0.7, 0.25, -0.9], [0.5, 0.55, 0.7], M.white),
    f("mirror-s", "mirror", [-0.7, 1.7, -1.2], [0.05, 0.7, 0.8], M.wood),
    f("shelf-s",  "cabinet", [0.9, 0.5, 0.9], [0.5, 1.0, 0.2], M.woodDark),
  ],
  lighting: { ambientIntensity: 0.5, sunIntensity: 0.6, sunDirection: [3, 8, 2], sunColor: "#F0FAFF", envPreset: "studio" },
  outdoor: false,
};

const ROOM_PASILLO: RoomSpec = {
  id: "room-pasillo-alto",
  displayName: "Pasillo",
  displayTag: "Pasillo",
  dimensions: [2.5, 2.7, 6],
  floor: M.floorWood,
  walls: M.wallWarm,
  ceiling: M.ceilWhite,
  accent: "#D4A84B",
  openings: [],
  furniture: [
    f("rug-p", "rug", [0, 0.005, 0], [1.0, 0.01, 3.2], { kind: "fabric", color: "#6B3A2A" }),
    f("art-1", "mirror", [0, 1.6, -2.2], [1.0, 0.05, 0.8], { kind: "fabric", color: "#EF6A5E" }),
    f("art-2", "mirror", [0, 1.6, -0.7], [1.0, 0.05, 0.8], { kind: "fabric", color: "#5EC7E8" }),
    f("art-3", "mirror", [0, 1.6,  0.8], [1.0, 0.05, 0.8], { kind: "fabric", color: "#6FD38F" }),
    f("tbl-p", "table_side", [-1.0, 0.4, 0.2], [0.7, 0.8, 0.3], M.woodDark, { secondary: M.wood }),
  ],
  lighting: { ambientIntensity: 0.4, sunIntensity: 0.7, sunDirection: [4, 8, 0], sunColor: "#FFE0B0", envPreset: "apartment" },
  outdoor: false,
};

const ROOM_GARAGE: RoomSpec = {
  id: "room-garage",
  displayName: "Cochera",
  displayTag: "Cochera",
  dimensions: [6, 3, 5.5],
  floor: M.floorConcrete,
  walls: { kind: "plaster", color: "#A8ADB3", roughness: 0.95 },
  ceiling: { kind: "plaster", color: "#96A0A9", roughness: 0.95 },
  accent: "#F5C451",
  openings: [{ wall: "north", kind: "door", u: 0.5, v: 0.5, width: 2.5, height: 2.3 }],
  furniture: [
    // Simplified car body
    f("car",   "box", [0, 0.5, 0.2], [2.8, 1.0, 1.6], { kind: "paint", color: "#2E4A6B" }, { label: "Auto" }),
    f("shelf-g","bookshelf", [-2.5, 0.9, -2.0], [0.4, 1.8, 1.4], { kind: "metal", color: "#5A5A5A" }, { label: "Estante" }),
    f("tool",  "box", [2.6, 0.2, -2.2], [0.7, 0.4, 0.5], { kind: "plastic", color: "#EF6A5E" }),
  ],
  lighting: { ambientIntensity: 0.35, sunIntensity: 0.6, sunDirection: [2, 6, 4], sunColor: "#FFFFFF", envPreset: "warehouse" },
  outdoor: false,
};

const ROOM_LAV: RoomSpec = {
  id: "room-lavanderia",
  displayName: "Lavandería",
  displayTag: "Lavandería",
  dimensions: [3, 2.6, 2.5],
  floor: M.floorTile,
  walls: M.wallCool,
  ceiling: M.ceilWhite,
  accent: "#5EC7E8",
  openings: [],
  furniture: [
    f("washer", "fridge", [-0.8, 0.45, -0.8], [0.7, 0.9, 0.65], M.white, { accent: { kind: "screen", color: "#5EC7E8", emissive: "#5EC7E8", emissiveIntensity: 0.4 }, label: "Lavadora" }),
    f("dryer",  "fridge", [ 0.0, 0.45, -0.8], [0.7, 0.9, 0.65], M.white, { label: "Secadora" }),
    f("counter-lav","counter", [-0.4, 0.925, -0.8],[1.5, 0.05, 0.7], M.woodDark, { secondary: M.wood }),
    f("basket1","box", [1.1, 0.22, 0.3],  [0.5, 0.45, 0.5], { kind: "plastic", color: "#D4A84B" }),
    f("basket2","box", [1.1, 0.22, -0.5], [0.5, 0.45, 0.5], { kind: "plastic", color: "#EF6A5E" }),
  ],
  lighting: { ambientIntensity: 0.5, sunIntensity: 0.6, sunDirection: [3, 8, 2], sunColor: "#F0FAFF", envPreset: "studio" },
  outdoor: false,
};

// ═══════════════════════ NEXUS HQ ═══════════════════════

const ROOM_HQ_RECEP: RoomSpec = {
  id: "room-hq-recep",
  displayName: "Recepción",
  displayTag: "Recepción",
  dimensions: [8, 3.2, 6],
  floor: M.floorMarble,
  walls: M.wallCool,
  ceiling: M.ceilWhite,
  accent: "#6E8BFF",
  openings: [],
  furniture: [
    f("desk-rec", "counter", [0, 0.5, -1.8], [3.5, 1.0, 0.8], { kind: "stone", color: "#2E4A6B" }, { secondary: { kind: "metal", color: "#6E8BFF" }, label: "Recepción" }),
    f("logo", "mirror", [0, 1.8, -2.9], [3.0, 1.0, 0.05], { kind: "plaster", color: "#1E2A44" }),
    f("sofa-r1", "sofa", [-3.0, 0.3, 1.8], [0.9, 0.6, 2.2], { kind: "fabric", color: "#3E5085" }, { rotation: Math.PI / 2 }),
    f("sofa-r2", "sofa", [ 3.0, 0.3, 1.8], [0.9, 0.6, 2.2], { kind: "fabric", color: "#3E5085" }, { rotation: -Math.PI / 2 }),
    f("plant-r1", "plant", [-3.5, 0.65, -2.2], [0.5, 1.3, 0.5], { kind: "wood", color: "#8B6F4E" }, { secondary: M.leaf }),
    f("plant-r2", "plant", [ 3.5, 0.65, -2.2], [0.5, 1.3, 0.5], { kind: "wood", color: "#8B6F4E" }, { secondary: M.leaf }),
  ],
  lighting: { ambientIntensity: 0.6, sunIntensity: 1.0, sunDirection: [5, 10, 3], sunColor: "#F0F2FF", envPreset: "lobby" },
  outdoor: false,
};

const ROOM_HQ_JUNTA: RoomSpec = {
  id: "room-hq-junta",
  displayName: "Sala de juntas",
  displayTag: "Juntas",
  dimensions: [6, 2.9, 4.5],
  floor: M.floorCarpet,
  walls: M.wallWarm,
  ceiling: M.ceilWhite,
  accent: "#F0B85C",
  openings: [],
  furniture: [
    f("table-j", "table_dining", [0, 0.4, 0], [3.8, 0.8, 1.2], { kind: "wood", color: "#1E1E1E" }, { secondary: M.woodDark, label: "Mesa juntas" }),
    ...([-1.2, -0.4, 0.4, 1.2].flatMap((x) =>
      [-0.85, 0.85].map((z) => f(`ch-j-${x}-${z}`, "chair", [x, 0.35, z], [0.5, 1.0, 0.5], M.black, { rotation: z < 0 ? 0 : Math.PI })),
    )),
    f("screen-j", "tv", [0, 1.5, -2.15], [2.6, 1.3, 0.1], M.black, { accent: { kind: "screen", color: "#5EC7E8", emissive: "#2E4A6B", emissiveIntensity: 0.8 }, label: "Pantalla" }),
  ],
  lighting: { ambientIntensity: 0.4, sunIntensity: 0.9, sunDirection: [4, 8, 3], sunColor: "#FFEBC0", envPreset: "apartment" },
  outdoor: false,
};

const ROOM_HQ_OPEN: RoomSpec = {
  id: "room-hq-open",
  displayName: "Open Space",
  displayTag: "Open Space",
  dimensions: [9, 2.8, 7],
  floor: M.floorConcrete,
  walls: { kind: "plaster", color: "#C9CED4", roughness: 0.9 },
  ceiling: { kind: "plaster", color: "#E0E4E8", roughness: 0.9 },
  accent: "#5EC7E8",
  openings: [],
  furniture: [
    // 2x3 grid of desks
    ...([-3, 0, 3].flatMap((x) =>
      [-2, 2].map((z) => f(`desk-${x}-${z}`, "desk", [x, 0.38, z], [1.4, 0.76, 0.8], M.white, { secondary: { kind: "wood", color: "#E8E8E0" } })),
    )),
    // Chairs
    ...([-3, 0, 3].flatMap((x) =>
      [-1.2, 1.2].map((z) => f(`ch-${x}-${z}`, "chair", [x, 0.3, z], [0.5, 0.95, 0.5], M.black)),
    )),
    // Monitors
    ...([-3, 0, 3].flatMap((x) =>
      [-2.3, 2.3].map((z) => f(`mon-${x}-${z}`, "tv", [x, 0.95, z], [0.6, 0.4, 0.05], M.black, { accent: { kind: "screen", color: "#5EC7E8", emissive: "#2E4A6B", emissiveIntensity: 0.7 } })),
    )),
    f("rack", "server_rack", [4.2, 1.0, 0], [0.8, 2.0, 1.4], M.black, { accent: { kind: "screen", color: "#6FD38F", emissive: "#6FD38F", emissiveIntensity: 1.0 }, label: "Rack" }),
  ],
  lighting: { ambientIntensity: 0.5, sunIntensity: 1.2, sunDirection: [5, 10, 4], sunColor: "#FFFFFF", envPreset: "warehouse" },
  outdoor: false,
};

// ═══════════════════════ FINCA LAS PALMAS ═══════════════════════

const ROOM_FINCA_CASA: RoomSpec = {
  id: "room-finca-casa",
  displayName: "Casa finca",
  displayTag: "Casa finca",
  dimensions: [6, 2.8, 5],
  floor: M.floorWood,
  walls: { kind: "plaster", color: "#E8D0A0", roughness: 0.9 },
  ceiling: M.ceilWhite,
  accent: "#D4A84B",
  openings: [{ wall: "west", kind: "window", u: 0.35, v: 0.55, width: 1.6, height: 1.1 }],
  furniture: [
    f("rug-f",   "rug",     [0, 0.005, 0.2], [2.8, 0.01, 2.0], { kind: "fabric", color: "#8B3A1E" }),
    f("chimney", "fireplace",[0, 1.0, -2.25],[1.8, 2.0, 0.5], M.wood, { accent: { kind: "fabric", color: "#EF6A5E", emissive: "#F5C451", emissiveIntensity: 1.4 }, label: "Chimenea" }),
    f("rocker",  "armchair", [-1.6, 0.4, 0.3], [0.9, 1.0, 0.9], { kind: "wood", color: "#5A4632" }, { label: "Mecedora" }),
    f("sofa-f",  "sofa",     [1.2, 0.35, 0.3], [1.8, 0.75, 0.9], { kind: "fabric", color: "#B07050" }),
    f("tbl-f",   "table_coffee", [-0.1, 0.15, 0.3], [1.1, 0.3, 0.7], M.woodDark, { secondary: M.wood }),
    f("lamp-f",  "lamp_floor",[-2.4, 0.75, -1.8], [0.45, 1.5, 0.45], M.gold, { accent: { kind: "fabric", color: "#F5E6B8", emissive: "#F5C451", emissiveIntensity: 0.55 } }),
  ],
  lighting: { ambientIntensity: 0.35, sunIntensity: 1.1, sunDirection: [-5, 8, 2], sunColor: "#FFDAA0", envPreset: "sunset" },
  outdoor: false,
};

const ROOM_FINCA_Z1: RoomSpec = {
  id: "room-finca-z1",
  displayName: "Riego Zona 1",
  displayTag: "Riego Z1",
  dimensions: [12, 3, 10],
  floor: { kind: "fabric", color: "#6B5038" },
  walls: M.wallGarden,
  accent: "#6FD38F",
  openings: [],
  furniture: [
    // Crop rows
    ...Array.from({ length: 5 }).flatMap((_, row) =>
      Array.from({ length: 8 }).map((_, col) =>
        f(
          `crop-${row}-${col}`,
          "plant",
          [-5.2 + col * 1.5, 0.25, -4.0 + row * 1.8],
          [0.35, 0.5, 0.35],
          { kind: "wood", color: "#5A4028" },
          { secondary: { kind: "fabric", color: "#9BE8B5" } },
        ),
      ),
    ),
    f("spr-1", "lamp_floor", [-2.5, 0.5, 0], [0.2, 1.0, 0.2], { kind: "metal", color: "#7A8288" }, { accent: { kind: "metal", color: "#5EC7E8" }, label: "Aspersor" }),
    f("spr-2", "lamp_floor", [ 2.5, 0.5, 0], [0.2, 1.0, 0.2], { kind: "metal", color: "#7A8288" }, { accent: { kind: "metal", color: "#5EC7E8" } }),
    f("shed",  "box",        [5.0, 0.75, 4.0], [1.4, 1.5, 1.2], M.wood, { label: "Bodega" }),
  ],
  lighting: { ambientIntensity: 0.6, sunIntensity: 2.4, sunDirection: [6, 14, 5], sunColor: "#FFF0C8", envPreset: "park" },
  outdoor: true,
};

const ROOM_FINCA_Z2: RoomSpec = {
  id: "room-finca-z2",
  displayName: "Riego Zona 2",
  displayTag: "Riego Z2",
  dimensions: [12, 3, 10],
  floor: { kind: "fabric", color: "#5A4028" },
  walls: M.wallGarden,
  accent: "#F0B85C",
  openings: [],
  furniture: [
    ...Array.from({ length: 3 }).flatMap((_, row) =>
      Array.from({ length: 3 }).map((_, col) =>
        f(`tree-${row}-${col}`, "tree",
          [-3.6 + col * 3.6, 1.3, -3.0 + row * 3.0],
          [1.3, 2.6, 1.3],
          M.leafDeep,
          { secondary: { kind: "fabric", color: row === 0 ? "#EF6A5E" : row === 1 ? "#F0B85C" : "#D4A84B" } },
        ),
      ),
    ),
    f("tank", "umbrella", [5.0, 1.0, -4.0], [0.9, 2.0, 0.9], { kind: "metal", color: "#A8B0B8" }, { accent: { kind: "metal", color: "#5EC7E8" }, label: "Tanque" }),
  ],
  lighting: { ambientIntensity: 0.6, sunIntensity: 2.4, sunDirection: [6, 14, -4], sunColor: "#FFF0C8", envPreset: "park" },
  outdoor: true,
};

// ═══════════════════════ Registry ═══════════════════════

const ROOM_SPECS: Record<string, RoomSpec> = {
  [ROOM_SALA.id]: ROOM_SALA,
  [ROOM_COCINA.id]: ROOM_COCINA,
  [ROOM_COMEDOR.id]: ROOM_COMEDOR,
  [ROOM_JARDIN.id]: ROOM_JARDIN,
  [ROOM_MASTER.id]: ROOM_MASTER,
  [ROOM_HIJOS.id]: ROOM_HIJOS,
  [ROOM_ESTUDIO.id]: ROOM_ESTUDIO,
  [ROOM_BANO_MASTER.id]: ROOM_BANO_MASTER,
  [ROOM_TERRAZA.id]: ROOM_TERRAZA,
  [ROOM_ENTRADA.id]: ROOM_ENTRADA,
  [ROOM_BANO_SOCIAL.id]: ROOM_BANO_SOCIAL,
  [ROOM_PASILLO.id]: ROOM_PASILLO,
  [ROOM_GARAGE.id]: ROOM_GARAGE,
  [ROOM_LAV.id]: ROOM_LAV,
  [ROOM_HQ_RECEP.id]: ROOM_HQ_RECEP,
  [ROOM_HQ_JUNTA.id]: ROOM_HQ_JUNTA,
  [ROOM_HQ_OPEN.id]: ROOM_HQ_OPEN,
  [ROOM_FINCA_CASA.id]: ROOM_FINCA_CASA,
  [ROOM_FINCA_Z1.id]: ROOM_FINCA_Z1,
  [ROOM_FINCA_Z2.id]: ROOM_FINCA_Z2,
};

const DEFAULT_SPEC: RoomSpec = {
  id: "default",
  displayName: "Ambiente",
  displayTag: "Ambiente",
  dimensions: [5, 2.7, 4],
  floor: M.floorWood,
  walls: M.wallCream,
  ceiling: M.ceilWhite,
  accent: "#D4A84B",
  openings: [
    { wall: "north", kind: "window", u: 0.65, v: 0.6, width: 1.4, height: 1.0 },
    { wall: "east", kind: "door",   u: 0.15, v: 0.45, width: 0.9, height: 2.1 },
  ],
  furniture: [],
  lighting: { ambientIntensity: 0.4, sunIntensity: 1.2, sunDirection: [5, 9, 3], sunColor: "#FFF4E0", envPreset: "apartment" },
  outdoor: false,
};

export function getRoomSpec(roomId: string): RoomSpec {
  return ROOM_SPECS[roomId] ?? { ...DEFAULT_SPEC, id: roomId || DEFAULT_SPEC.id };
}

export const ALL_ROOM_SPECS = ROOM_SPECS;
