// Per-room 3D theme definitions.
// Each theme overrides colors, materials and furniture pieces for a room.
// Coordinates are normalized to the floor plane (x: 0..1 across W, z: 0..1 across D),
// sizes are in the same relative px units used by Room3D (W=420, D=320, H=220).

export type SurfaceKind = "wood" | "tile" | "grass" | "carpet" | "concrete" | "marble" | "parquet";

export interface Furniture3D {
  id: string;
  x: number;   // 0..1 center on floor width
  z: number;   // 0..1 center on floor depth
  w: number;   // width in px (along room X)
  d: number;   // depth in px (along room Z)
  h: number;   // height in px
  yOffset?: number; // lift above floor
  color: string;      // side color
  topColor?: string;  // top face
  label?: string;
  accent?: string;    // optional glow / trim color
  shape?: "box" | "cylinder";
}

export interface RoomTheme {
  displayTag: string;          // small badge rendered on-scene ("Sala", "Cocina", etc.)
  floorGradient: [string, string];
  floorPattern: SurfaceKind;
  wallGradient: [string, string];
  ceilingGradient: [string, string];
  accent: string;              // theme accent color
  ambient: string;             // skydome / glow tint
  furniture: Furniture3D[];
  window?: { wall: "back" | "left" | "right"; x: number; y: number; w: number; h: number; color: string };
  door?: { wall: "back" | "left" | "right"; x: number; w: number; h: number };
  outdoor?: boolean;           // hide ceiling, green floor, add sky
  rug?: { x: number; z: number; w: number; d: number; color: string };
}

const DEFAULT: RoomTheme = {
  displayTag: "Ambiente",
  floorGradient: ["#B08968", "#8B6F4E"],
  floorPattern: "wood",
  wallGradient: ["#E8E2D5", "#D4CFC1"],
  ceilingGradient: ["#F5F2EA", "#E8E2D5"],
  accent: "#D4A84B",
  ambient: "#FFE7B0",
  furniture: [],
  window: { wall: "back", x: 0.65, y: 0.25, w: 110, h: 90, color: "#A8C5D8" },
  door: { wall: "right", x: 0.15, w: 60, h: 150 },
};

// ─────────────────────────────────────────────────────────────
// VILLA AURORA
// ─────────────────────────────────────────────────────────────
const ROOM_THEMES: Record<string, RoomTheme> = {
  "room-sala": {
    displayTag: "Sala",
    floorGradient: ["#C9A27A", "#9B7A55"],
    floorPattern: "parquet",
    wallGradient: ["#F0EBDF", "#D9D3C2"],
    ceilingGradient: ["#FBF9F3", "#EFEADC"],
    accent: "#D4A84B",
    ambient: "#F7E7B8",
    rug: { x: 0.5, z: 0.55, w: 220, d: 140, color: "#6A5641" },
    furniture: [
      { id: "sofa-l",      x: 0.25, z: 0.80, w: 150, d: 55,  h: 55, color: "#4A5F6D", topColor: "#5B7385", label: "Sofá" },
      { id: "sofa-r",      x: 0.78, z: 0.55, w: 55,  d: 110, h: 55, color: "#4A5F6D", topColor: "#5B7385" },
      { id: "coffee",      x: 0.45, z: 0.55, w: 90,  d: 55,  h: 18, color: "#3A2E22", topColor: "#6B4A2E", label: "Mesa" },
      { id: "tv-stand",    x: 0.40, z: 0.10, w: 160, d: 22,  h: 30, color: "#1E1E1E", topColor: "#2E2E2E" },
      { id: "tv",          x: 0.40, z: 0.05, w: 130, d: 6,   h: 70, yOffset: 30, color: "#0A0A0A", topColor: "#1A1A1A", accent: "#5EC7E8", label: "TV" },
      { id: "plant",       x: 0.92, z: 0.18, w: 38,  d: 38,  h: 90, color: "#7FA071", topColor: "#9BB890", shape: "cylinder" },
    ],
    window: { wall: "back", x: 0.65, y: 0.22, w: 140, h: 110, color: "#A8D0E8" },
  },
  "room-cocina": {
    displayTag: "Cocina",
    floorGradient: ["#E8E0D4", "#C9BFAD"],
    floorPattern: "tile",
    wallGradient: ["#F5F5F0", "#E0DCD0"],
    ceilingGradient: ["#FFFFFF", "#EFEFEA"],
    accent: "#EF6A5E",
    ambient: "#FFF4D6",
    furniture: [
      { id: "island",   x: 0.50, z: 0.55, w: 180, d: 70, h: 85, color: "#D8CDB8", topColor: "#2A2620", label: "Isla" },
      { id: "counter-l",x: 0.10, z: 0.50, w: 35,  d: 220,h: 85, color: "#E5DCC8", topColor: "#3A3024" },
      { id: "stove",    x: 0.10, z: 0.25, w: 35,  d: 55, h: 10, yOffset: 85, color: "#1E1E1E", topColor: "#2A2A2A", accent: "#EF6A5E", label: "Estufa" },
      { id: "fridge",   x: 0.10, z: 0.85, w: 35,  d: 70, h: 160, color: "#C9CED4", topColor: "#B5BAC0", label: "Refri" },
      { id: "pendant1", x: 0.42, z: 0.55, w: 22, d: 22, h: 8, yOffset: 130, color: "#D4A84B", topColor: "#F5C451", shape: "cylinder", accent: "#F5C451" },
      { id: "pendant2", x: 0.58, z: 0.55, w: 22, d: 22, h: 8, yOffset: 130, color: "#D4A84B", topColor: "#F5C451", shape: "cylinder", accent: "#F5C451" },
    ],
    window: { wall: "back", x: 0.50, y: 0.20, w: 160, h: 100, color: "#B8D8E8" },
  },
  "room-comedor": {
    displayTag: "Comedor",
    floorGradient: ["#9B7A55", "#6B5038"],
    floorPattern: "wood",
    wallGradient: ["#E8DDC7", "#C9BBA0"],
    ceilingGradient: ["#F5EDD9", "#DCD0B5"],
    accent: "#B08968",
    ambient: "#FFD896",
    rug: { x: 0.5, z: 0.5, w: 240, d: 150, color: "#8B4513" },
    furniture: [
      { id: "table", x: 0.50, z: 0.50, w: 200, d: 90, h: 38, color: "#3A2E22", topColor: "#6B4A2E", label: "Mesa comedor" },
      { id: "chair1",x: 0.30, z: 0.35, w: 40, d: 40, h: 55, color: "#4A3426", topColor: "#6B4A2E" },
      { id: "chair2",x: 0.42, z: 0.35, w: 40, d: 40, h: 55, color: "#4A3426", topColor: "#6B4A2E" },
      { id: "chair3",x: 0.58, z: 0.35, w: 40, d: 40, h: 55, color: "#4A3426", topColor: "#6B4A2E" },
      { id: "chair4",x: 0.70, z: 0.35, w: 40, d: 40, h: 55, color: "#4A3426", topColor: "#6B4A2E" },
      { id: "chair5",x: 0.30, z: 0.70, w: 40, d: 40, h: 55, color: "#4A3426", topColor: "#6B4A2E" },
      { id: "chair6",x: 0.42, z: 0.70, w: 40, d: 40, h: 55, color: "#4A3426", topColor: "#6B4A2E" },
      { id: "chair7",x: 0.58, z: 0.70, w: 40, d: 40, h: 55, color: "#4A3426", topColor: "#6B4A2E" },
      { id: "chair8",x: 0.70, z: 0.70, w: 40, d: 40, h: 55, color: "#4A3426", topColor: "#6B4A2E" },
      { id: "chandelier", x: 0.5, z: 0.5, w: 50, d: 50, h: 30, yOffset: 150, color: "#D4A84B", topColor: "#F5C451", accent: "#F5C451" },
      { id: "buffet", x: 0.50, z: 0.95, w: 170, d: 35, h: 75, color: "#3A2E22", topColor: "#5A4632", label: "Buffet" },
    ],
    window: { wall: "back", x: 0.50, y: 0.25, w: 180, h: 95, color: "#A8C5D8" },
  },
  "room-jardin": {
    displayTag: "Jardín",
    floorGradient: ["#5B8A3A", "#3E6626"],
    floorPattern: "grass",
    wallGradient: ["#87CEEB", "#4A90C9"],
    ceilingGradient: ["#BFE4F5", "#87CEEB"],
    accent: "#7FA071",
    ambient: "#BFE4F5",
    outdoor: true,
    furniture: [
      { id: "tree1", x: 0.15, z: 0.20, w: 55, d: 55, h: 140, color: "#7FA071", topColor: "#9BB890", shape: "cylinder", label: "Árbol" },
      { id: "tree2", x: 0.85, z: 0.30, w: 48, d: 48, h: 120, color: "#6B8A5E", topColor: "#88A87B", shape: "cylinder" },
      { id: "tree3", x: 0.90, z: 0.80, w: 60, d: 60, h: 150, color: "#7FA071", topColor: "#9BB890", shape: "cylinder" },
      { id: "pool",  x: 0.50, z: 0.55, w: 180, d: 110, h: 8, color: "#2E7FB3", topColor: "#5EC7E8", accent: "#5EC7E8", label: "Piscina" },
      { id: "bench", x: 0.20, z: 0.85, w: 90, d: 28, h: 32, color: "#6B4A2E", topColor: "#8B6F4E", label: "Banca" },
      { id: "firepit", x: 0.78, z: 0.65, w: 50, d: 50, h: 18, color: "#3A3A3A", topColor: "#EF6A5E", shape: "cylinder", accent: "#F5C451" },
    ],
  },
  "room-master": {
    displayTag: "Suite",
    floorGradient: ["#A08870", "#705844"],
    floorPattern: "wood",
    wallGradient: ["#E8DED0", "#C9BBA8"],
    ceilingGradient: ["#F5EFE3", "#DCD2BF"],
    accent: "#C9A0DC",
    ambient: "#E8D5F5",
    rug: { x: 0.50, z: 0.58, w: 260, d: 180, color: "#4A3A6B" },
    furniture: [
      { id: "bed",     x: 0.50, z: 0.55, w: 200, d: 140, h: 45, color: "#EFE5D5", topColor: "#F5F0E3", label: "Cama king" },
      { id: "head",    x: 0.50, z: 0.88, w: 210, d: 12, h: 90, color: "#4A3A6B", topColor: "#6B5488" },
      { id: "pillow1", x: 0.38, z: 0.75, w: 50, d: 28, h: 15, yOffset: 45, color: "#FFFFFF", topColor: "#F5F0E3" },
      { id: "pillow2", x: 0.62, z: 0.75, w: 50, d: 28, h: 15, yOffset: 45, color: "#FFFFFF", topColor: "#F5F0E3" },
      { id: "nst-l",   x: 0.18, z: 0.85, w: 55, d: 40, h: 50, color: "#5A4632", topColor: "#8B6F4E", label: "Noche" },
      { id: "nst-r",   x: 0.82, z: 0.85, w: 55, d: 40, h: 50, color: "#5A4632", topColor: "#8B6F4E" },
      { id: "lamp-l",  x: 0.18, z: 0.85, w: 20, d: 20, h: 30, yOffset: 50, color: "#F5E6B8", topColor: "#F5E6B8", shape: "cylinder", accent: "#F5C451" },
      { id: "lamp-r",  x: 0.82, z: 0.85, w: 20, d: 20, h: 30, yOffset: 50, color: "#F5E6B8", topColor: "#F5E6B8", shape: "cylinder", accent: "#F5C451" },
      { id: "dresser", x: 0.50, z: 0.10, w: 150, d: 35, h: 70, color: "#5A4632", topColor: "#8B6F4E" },
      { id: "mirror",  x: 0.50, z: 0.08, w: 100, d: 4, h: 80, yOffset: 70, color: "#B8D8E8", topColor: "#D8E8F0" },
    ],
    window: { wall: "left", x: 0.3, y: 0.2, w: 140, h: 110, color: "#A8C5D8" },
  },
  "room-hijos": {
    displayTag: "Niños",
    floorGradient: ["#F5D8A8", "#D4A87C"],
    floorPattern: "carpet",
    wallGradient: ["#B8E6F0", "#87CEEB"],
    ceilingGradient: ["#E8F5FB", "#BFE4F5"],
    accent: "#EF6A5E",
    ambient: "#FFE7B0",
    rug: { x: 0.4, z: 0.4, w: 150, d: 150, color: "#EF6A5E" },
    furniture: [
      { id: "bunk-lower", x: 0.25, z: 0.75, w: 170, d: 90, h: 40, color: "#D4A84B", topColor: "#F5C451", label: "Litera" },
      { id: "bunk-upper", x: 0.25, z: 0.75, w: 170, d: 90, h: 25, yOffset: 70, color: "#EF6A5E", topColor: "#F08A7C" },
      { id: "bunk-posts1", x: 0.12, z: 0.65, w: 10, d: 10, h: 105, color: "#B8902F", topColor: "#D4A84B" },
      { id: "bunk-posts2", x: 0.38, z: 0.85, w: 10, d: 10, h: 105, color: "#B8902F", topColor: "#D4A84B" },
      { id: "desk", x: 0.80, z: 0.25, w: 110, d: 50, h: 38, color: "#6FD38F", topColor: "#88DEA3", label: "Escritorio" },
      { id: "chair-k", x: 0.80, z: 0.45, w: 35, d: 35, h: 40, color: "#5EC7E8", topColor: "#7DD4EE" },
      { id: "toybox", x: 0.20, z: 0.20, w: 80, d: 40, h: 35, color: "#C9A0DC", topColor: "#D4B5E4", label: "Juguetes" },
      { id: "lamp-k", x: 0.80, z: 0.25, w: 18, d: 18, h: 28, yOffset: 38, color: "#F5E6B8", shape: "cylinder", accent: "#F5C451" },
    ],
    window: { wall: "back", x: 0.7, y: 0.22, w: 110, h: 100, color: "#A8D0E8" },
  },
  "room-estudio": {
    displayTag: "Estudio",
    floorGradient: ["#6B4A2E", "#3E2A17"],
    floorPattern: "wood",
    wallGradient: ["#D4C8B0", "#A8987A"],
    ceilingGradient: ["#E8DFC8", "#C9BBA0"],
    accent: "#8B6F4E",
    ambient: "#FFD896",
    furniture: [
      { id: "desk-e",  x: 0.35, z: 0.30, w: 160, d: 70, h: 42, color: "#3E2A17", topColor: "#6B4A2E", label: "Escritorio" },
      { id: "mon1",    x: 0.25, z: 0.30, w: 50,  d: 4, h: 40, yOffset: 42, color: "#0A0A0A", topColor: "#1A1A1A", accent: "#5EC7E8" },
      { id: "mon2",    x: 0.45, z: 0.30, w: 50,  d: 4, h: 40, yOffset: 42, color: "#0A0A0A", topColor: "#1A1A1A", accent: "#5EC7E8" },
      { id: "chair-e", x: 0.35, z: 0.50, w: 50,  d: 50, h: 65, color: "#1E1E1E", topColor: "#2E2E2E" },
      { id: "bkshf-1", x: 0.85, z: 0.30, w: 22,  d: 160, h: 160, color: "#3E2A17", topColor: "#6B4A2E", label: "Librería" },
      { id: "books-1", x: 0.85, z: 0.15, w: 18,  d: 28, h: 35, yOffset: 25, color: "#6B3A2A" },
      { id: "books-2", x: 0.85, z: 0.40, w: 18,  d: 28, h: 30, yOffset: 60, color: "#2E4A6B" },
      { id: "books-3", x: 0.85, z: 0.30, w: 18,  d: 28, h: 28, yOffset: 95, color: "#5A4632" },
      { id: "books-4", x: 0.85, z: 0.50, w: 18,  d: 28, h: 32, yOffset: 125, color: "#3A5F4A" },
      { id: "armchair", x: 0.20, z: 0.80, w: 70, d: 70, h: 55, color: "#5A3E30", topColor: "#8B6F4E", label: "Sillón" },
      { id: "lamp-e",  x: 0.20, z: 0.92, w: 22, d: 22, h: 110, color: "#D4A84B", topColor: "#F5E6B8", shape: "cylinder", accent: "#F5C451" },
    ],
    window: { wall: "back", x: 0.50, y: 0.18, w: 130, h: 110, color: "#A8C5D8" },
  },
  "room-bano-master": {
    displayTag: "Baño Suite",
    floorGradient: ["#E8E8EA", "#BFC5CC"],
    floorPattern: "marble",
    wallGradient: ["#F0EDE8", "#C9C5BE"],
    ceilingGradient: ["#FFFFFF", "#E8E8EA"],
    accent: "#5EC7E8",
    ambient: "#D8F0F8",
    furniture: [
      { id: "tub",     x: 0.30, z: 0.55, w: 160, d: 80, h: 38, color: "#F5F5F5", topColor: "#E8EEF0", accent: "#5EC7E8", label: "Tina" },
      { id: "vanity",  x: 0.80, z: 0.25, w: 32, d: 170, h: 75, color: "#FFFFFF", topColor: "#2E2E2E", label: "Vanity" },
      { id: "mirror-b",x: 0.80, z: 0.25, w: 12, d: 140, h: 90, yOffset: 75, color: "#B8D8E8", topColor: "#D8EEF5" },
      { id: "toilet",  x: 0.20, z: 0.15, w: 40, d: 55, h: 45, color: "#FFFFFF", topColor: "#E8E8E8", label: "WC" },
      { id: "shower",  x: 0.80, z: 0.85, w: 90, d: 90, h: 200, color: "#5EC7E8", topColor: "#7DD4EE", accent: "#5EC7E8" },
    ],
    window: { wall: "back", x: 0.30, y: 0.30, w: 140, h: 70, color: "#B8E0F0" },
  },
  "room-terraza": {
    displayTag: "Terraza",
    floorGradient: ["#8B6F4E", "#5A4632"],
    floorPattern: "wood",
    wallGradient: ["#FFB97A", "#F08A5C"],
    ceilingGradient: ["#BFE4F5", "#6FB5DC"],
    accent: "#F0B85C",
    ambient: "#FFD896",
    outdoor: true,
    furniture: [
      { id: "lounge1", x: 0.20, z: 0.55, w: 80, d: 150, h: 30, color: "#E8DFC8", topColor: "#F5EDD9", label: "Lounge" },
      { id: "lounge2", x: 0.80, z: 0.55, w: 80, d: 150, h: 30, color: "#E8DFC8", topColor: "#F5EDD9" },
      { id: "umbrella-base", x: 0.50, z: 0.55, w: 18, d: 18, h: 180, color: "#3A3024", topColor: "#5A4632", shape: "cylinder" },
      { id: "umbrella-top",  x: 0.50, z: 0.55, w: 160, d: 160, h: 20, yOffset: 160, color: "#EF6A5E", topColor: "#F08A7C", shape: "cylinder" },
      { id: "table-t", x: 0.50, z: 0.55, w: 60, d: 60, h: 38, color: "#3A3024", topColor: "#6B4A2E", shape: "cylinder", label: "Mesa" },
      { id: "planter1", x: 0.10, z: 0.10, w: 40, d: 40, h: 60, color: "#8B6F4E", topColor: "#A8967A" },
      { id: "plant1",   x: 0.10, z: 0.10, w: 35, d: 35, h: 60, yOffset: 60, color: "#7FA071", topColor: "#9BB890", shape: "cylinder" },
    ],
  },
  "room-entrada": {
    displayTag: "Entrada",
    floorGradient: ["#D8D0BC", "#B0A88A"],
    floorPattern: "tile",
    wallGradient: ["#F0E8D4", "#D4C8A8"],
    ceilingGradient: ["#FAF5E8", "#E0D8BC"],
    accent: "#D4A84B",
    ambient: "#FFE7B0",
    furniture: [
      { id: "console", x: 0.50, z: 0.10, w: 140, d: 32, h: 80, color: "#5A4632", topColor: "#8B6F4E", label: "Consola" },
      { id: "mirror-e", x: 0.50, z: 0.08, w: 90, d: 6, h: 110, yOffset: 85, color: "#B8D8E8", topColor: "#D8E8F0" },
      { id: "plant-e", x: 0.15, z: 0.80, w: 38, d: 38, h: 100, color: "#7FA071", topColor: "#9BB890", shape: "cylinder" },
      { id: "rug-e",   x: 0.50, z: 0.55, w: 140, d: 80, h: 2, color: "#6B4A2E" },
      { id: "umbrella-stand", x: 0.85, z: 0.15, w: 22, d: 22, h: 55, color: "#3A3024", topColor: "#5A4632", shape: "cylinder" },
      { id: "bench-e", x: 0.20, z: 0.20, w: 90, d: 28, h: 35, color: "#3A2E22", topColor: "#6B4A2E" },
    ],
    door: { wall: "back", x: 0.5, w: 80, h: 170 },
  },
  "room-bano-social": {
    displayTag: "Baño social",
    floorGradient: ["#D4DCE0", "#A8B3BC"],
    floorPattern: "tile",
    wallGradient: ["#E8EDF0", "#B8C3CC"],
    ceilingGradient: ["#FFFFFF", "#E8EDF0"],
    accent: "#5EC7E8",
    ambient: "#D8EEF5",
    furniture: [
      { id: "sink", x: 0.25, z: 0.15, w: 80, d: 45, h: 80, color: "#FFFFFF", topColor: "#E8EDF0", label: "Lavatorio" },
      { id: "toilet-s", x: 0.70, z: 0.20, w: 40, d: 55, h: 45, color: "#FFFFFF", topColor: "#E8E8E8" },
      { id: "mirror-s", x: 0.25, z: 0.08, w: 80, d: 4, h: 70, yOffset: 85, color: "#B8D8E8", topColor: "#D8E8F0" },
      { id: "shelf-s", x: 0.80, z: 0.80, w: 50, d: 18, h: 90, color: "#5A4632", topColor: "#8B6F4E" },
    ],
  },
  "room-pasillo-alto": {
    displayTag: "Pasillo",
    floorGradient: ["#8B6F4E", "#5A4632"],
    floorPattern: "wood",
    wallGradient: ["#E8DDC7", "#C9BBA0"],
    ceilingGradient: ["#F5EDD9", "#DCD0B5"],
    accent: "#D4A84B",
    ambient: "#FFD896",
    rug: { x: 0.5, z: 0.5, w: 80, d: 260, color: "#6B3A2A" },
    furniture: [
      { id: "art1", x: 0.5, z: 0.10, w: 60, d: 3, h: 80, yOffset: 55, color: "#EF6A5E", topColor: "#F08A7C" },
      { id: "art2", x: 0.5, z: 0.35, w: 60, d: 3, h: 80, yOffset: 55, color: "#5EC7E8", topColor: "#7DD4EE" },
      { id: "art3", x: 0.5, z: 0.65, w: 60, d: 3, h: 80, yOffset: 55, color: "#6FD38F", topColor: "#88DEA3" },
      { id: "table-p", x: 0.15, z: 0.50, w: 70, d: 28, h: 70, color: "#5A4632", topColor: "#8B6F4E" },
      { id: "vase-p",  x: 0.15, z: 0.50, w: 20, d: 20, h: 35, yOffset: 70, color: "#C9A0DC", topColor: "#D4B5E4", shape: "cylinder" },
    ],
  },
  "room-garage": {
    displayTag: "Cochera",
    floorGradient: ["#6B6E72", "#3E4046"],
    floorPattern: "concrete",
    wallGradient: ["#A8ADB3", "#72767E"],
    ceilingGradient: ["#C9CED4", "#96A0A9"],
    accent: "#F5C451",
    ambient: "#C9D0D8",
    furniture: [
      { id: "car-body",  x: 0.50, z: 0.50, w: 230, d: 100, h: 50, color: "#2E4A6B", topColor: "#3E5F85", label: "Auto" },
      { id: "car-roof",  x: 0.50, z: 0.50, w: 130, d: 80, h: 35, yOffset: 50, color: "#2E4A6B", topColor: "#3E5F85" },
      { id: "wheel1", x: 0.32, z: 0.35, w: 22, d: 22, h: 28, color: "#0A0A0A", topColor: "#2E2E2E", shape: "cylinder" },
      { id: "wheel2", x: 0.68, z: 0.35, w: 22, d: 22, h: 28, color: "#0A0A0A", topColor: "#2E2E2E", shape: "cylinder" },
      { id: "wheel3", x: 0.32, z: 0.65, w: 22, d: 22, h: 28, color: "#0A0A0A", topColor: "#2E2E2E", shape: "cylinder" },
      { id: "wheel4", x: 0.68, z: 0.65, w: 22, d: 22, h: 28, color: "#0A0A0A", topColor: "#2E2E2E", shape: "cylinder" },
      { id: "shelf-g", x: 0.10, z: 0.10, w: 35, d: 80, h: 170, color: "#5A5A5A", topColor: "#7A7A7A", label: "Estante" },
      { id: "tool-box", x: 0.90, z: 0.10, w: 60, d: 40, h: 30, color: "#EF6A5E", topColor: "#F08A7C" },
    ],
    door: { wall: "back", x: 0.5, w: 200, h: 180 },
  },
  "room-lavanderia": {
    displayTag: "Lavandería",
    floorGradient: ["#E0E4E8", "#B0B5BC"],
    floorPattern: "tile",
    wallGradient: ["#F0F3F5", "#C9CED4"],
    ceilingGradient: ["#FFFFFF", "#E8EDF0"],
    accent: "#5EC7E8",
    ambient: "#E8F0F5",
    furniture: [
      { id: "washer", x: 0.25, z: 0.30, w: 65, d: 60, h: 90, color: "#FFFFFF", topColor: "#E8E8E8", accent: "#5EC7E8", label: "Lavadora" },
      { id: "dryer",  x: 0.45, z: 0.30, w: 65, d: 60, h: 90, color: "#FFFFFF", topColor: "#E8E8E8", label: "Secadora" },
      { id: "counter-lav", x: 0.35, z: 0.30, w: 150, d: 60, h: 8, yOffset: 90, color: "#3A3024", topColor: "#6B4A2E" },
      { id: "basket1", x: 0.80, z: 0.60, w: 50, d: 50, h: 45, color: "#D4A84B", topColor: "#F5C451" },
      { id: "basket2", x: 0.80, z: 0.80, w: 50, d: 50, h: 45, color: "#EF6A5E", topColor: "#F08A7C" },
      { id: "rack",    x: 0.20, z: 0.80, w: 120, d: 25, h: 100, color: "#A8A8A8", topColor: "#C0C0C0", label: "Tendedero" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // NEXUS HQ
  // ─────────────────────────────────────────────────────────────
  "room-hq-recep": {
    displayTag: "Recepción",
    floorGradient: ["#D8DCE0", "#A8ADB3"],
    floorPattern: "marble",
    wallGradient: ["#F0F3F5", "#C9CED4"],
    ceilingGradient: ["#FFFFFF", "#E8EDF0"],
    accent: "#6E8BFF",
    ambient: "#D8E0FF",
    furniture: [
      { id: "desk-rec", x: 0.5, z: 0.35, w: 230, d: 65, h: 100, color: "#2E4A6B", topColor: "#6E8BFF", label: "Recepción" },
      { id: "logo-wall", x: 0.5, z: 0.02, w: 200, d: 8, h: 80, yOffset: 60, color: "#1E2A44", topColor: "#2E4A6B", accent: "#6E8BFF" },
      { id: "sofa-rec", x: 0.15, z: 0.85, w: 55, d: 170, h: 45, color: "#3E5085", topColor: "#5B7385" },
      { id: "sofa-rec2", x: 0.85, z: 0.85, w: 55, d: 170, h: 45, color: "#3E5085", topColor: "#5B7385" },
      { id: "plant-rec", x: 0.08, z: 0.18, w: 42, d: 42, h: 110, color: "#7FA071", topColor: "#9BB890", shape: "cylinder" },
      { id: "plant-rec2", x: 0.92, z: 0.18, w: 42, d: 42, h: 110, color: "#7FA071", topColor: "#9BB890", shape: "cylinder" },
    ],
  },
  "room-hq-junta": {
    displayTag: "Juntas",
    floorGradient: ["#4A3A2A", "#2E241A"],
    floorPattern: "carpet",
    wallGradient: ["#E8E0D0", "#A8987A"],
    ceilingGradient: ["#F0E8D8", "#C9BBA0"],
    accent: "#F0B85C",
    ambient: "#FFE7B0",
    furniture: [
      { id: "table-j", x: 0.5, z: 0.5, w: 260, d: 90, h: 40, color: "#1E1E1E", topColor: "#3A2E22", label: "Mesa juntas" },
      { id: "ch-j1", x: 0.22, z: 0.30, w: 40, d: 40, h: 70, color: "#0A0A0A", topColor: "#2E2E2E" },
      { id: "ch-j2", x: 0.38, z: 0.30, w: 40, d: 40, h: 70, color: "#0A0A0A", topColor: "#2E2E2E" },
      { id: "ch-j3", x: 0.54, z: 0.30, w: 40, d: 40, h: 70, color: "#0A0A0A", topColor: "#2E2E2E" },
      { id: "ch-j4", x: 0.70, z: 0.30, w: 40, d: 40, h: 70, color: "#0A0A0A", topColor: "#2E2E2E" },
      { id: "ch-j5", x: 0.22, z: 0.75, w: 40, d: 40, h: 70, color: "#0A0A0A", topColor: "#2E2E2E" },
      { id: "ch-j6", x: 0.38, z: 0.75, w: 40, d: 40, h: 70, color: "#0A0A0A", topColor: "#2E2E2E" },
      { id: "ch-j7", x: 0.54, z: 0.75, w: 40, d: 40, h: 70, color: "#0A0A0A", topColor: "#2E2E2E" },
      { id: "ch-j8", x: 0.70, z: 0.75, w: 40, d: 40, h: 70, color: "#0A0A0A", topColor: "#2E2E2E" },
      { id: "screen-j", x: 0.5, z: 0.03, w: 200, d: 8, h: 100, yOffset: 40, color: "#0A0A0A", topColor: "#1E2A44", accent: "#5EC7E8", label: "Pantalla" },
    ],
  },
  "room-hq-open": {
    displayTag: "Open Space",
    floorGradient: ["#3A3E45", "#1E2226"],
    floorPattern: "concrete",
    wallGradient: ["#C9CED4", "#7A7F86"],
    ceilingGradient: ["#E0E4E8", "#A0A5AC"],
    accent: "#5EC7E8",
    ambient: "#D8E8F0",
    furniture: [
      { id: "d1", x: 0.20, z: 0.25, w: 100, d: 55, h: 38, color: "#F5F5F0", topColor: "#E8E8E0", label: "WS1" },
      { id: "d2", x: 0.45, z: 0.25, w: 100, d: 55, h: 38, color: "#F5F5F0", topColor: "#E8E8E0" },
      { id: "d3", x: 0.70, z: 0.25, w: 100, d: 55, h: 38, color: "#F5F5F0", topColor: "#E8E8E0" },
      { id: "d4", x: 0.20, z: 0.75, w: 100, d: 55, h: 38, color: "#F5F5F0", topColor: "#E8E8E0" },
      { id: "d5", x: 0.45, z: 0.75, w: 100, d: 55, h: 38, color: "#F5F5F0", topColor: "#E8E8E0" },
      { id: "d6", x: 0.70, z: 0.75, w: 100, d: 55, h: 38, color: "#F5F5F0", topColor: "#E8E8E0" },
      { id: "c1", x: 0.20, z: 0.40, w: 35, d: 35, h: 48, color: "#1E1E1E", topColor: "#3A3A3A" },
      { id: "c2", x: 0.45, z: 0.40, w: 35, d: 35, h: 48, color: "#1E1E1E", topColor: "#3A3A3A" },
      { id: "c3", x: 0.70, z: 0.40, w: 35, d: 35, h: 48, color: "#1E1E1E", topColor: "#3A3A3A" },
      { id: "c4", x: 0.20, z: 0.60, w: 35, d: 35, h: 48, color: "#1E1E1E", topColor: "#3A3A3A" },
      { id: "c5", x: 0.45, z: 0.60, w: 35, d: 35, h: 48, color: "#1E1E1E", topColor: "#3A3A3A" },
      { id: "c6", x: 0.70, z: 0.60, w: 35, d: 35, h: 48, color: "#1E1E1E", topColor: "#3A3A3A" },
      { id: "m1", x: 0.20, z: 0.18, w: 42, d: 4, h: 32, yOffset: 38, color: "#0A0A0A", topColor: "#1A1A1A", accent: "#5EC7E8" },
      { id: "m2", x: 0.45, z: 0.18, w: 42, d: 4, h: 32, yOffset: 38, color: "#0A0A0A", topColor: "#1A1A1A", accent: "#5EC7E8" },
      { id: "m3", x: 0.70, z: 0.18, w: 42, d: 4, h: 32, yOffset: 38, color: "#0A0A0A", topColor: "#1A1A1A", accent: "#5EC7E8" },
      { id: "m4", x: 0.20, z: 0.82, w: 42, d: 4, h: 32, yOffset: 38, color: "#0A0A0A", topColor: "#1A1A1A", accent: "#5EC7E8" },
      { id: "m5", x: 0.45, z: 0.82, w: 42, d: 4, h: 32, yOffset: 38, color: "#0A0A0A", topColor: "#1A1A1A", accent: "#5EC7E8" },
      { id: "m6", x: 0.70, z: 0.82, w: 42, d: 4, h: 32, yOffset: 38, color: "#0A0A0A", topColor: "#1A1A1A", accent: "#5EC7E8" },
      { id: "server-rack", x: 0.93, z: 0.50, w: 35, d: 110, h: 190, color: "#0A0A0A", topColor: "#2E2E2E", accent: "#6FD38F", label: "Rack" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // FINCA LAS PALMAS
  // ─────────────────────────────────────────────────────────────
  "room-finca-casa": {
    displayTag: "Casa finca",
    floorGradient: ["#8B5A2B", "#5A3E1E"],
    floorPattern: "wood",
    wallGradient: ["#E8D0A0", "#C9A96B"],
    ceilingGradient: ["#F0DCB8", "#D4B584"],
    accent: "#D4A84B",
    ambient: "#FFD896",
    rug: { x: 0.5, z: 0.55, w: 200, d: 130, color: "#8B3A1E" },
    furniture: [
      { id: "chimney", x: 0.50, z: 0.08, w: 140, d: 35, h: 180, color: "#6B4A2E", topColor: "#8B6F4E", accent: "#EF6A5E", label: "Chimenea" },
      { id: "fire", x: 0.50, z: 0.08, w: 80, d: 20, h: 45, yOffset: 10, color: "#EF6A5E", topColor: "#F5C451", accent: "#F5C451" },
      { id: "rocking", x: 0.25, z: 0.55, w: 65, d: 80, h: 95, color: "#5A4632", topColor: "#8B6F4E", label: "Mecedora" },
      { id: "sofa-f",  x: 0.75, z: 0.55, w: 130, d: 65, h: 55, color: "#B07050", topColor: "#C98670" },
      { id: "table-f", x: 0.50, z: 0.55, w: 80, d: 50, h: 25, color: "#3A2E22", topColor: "#6B4A2E" },
      { id: "lamp-f",  x: 0.15, z: 0.15, w: 22, d: 22, h: 140, color: "#3A2E22", topColor: "#F5C451", shape: "cylinder", accent: "#F5C451" },
    ],
    window: { wall: "left", x: 0.3, y: 0.2, w: 150, h: 100, color: "#A8C5D8" },
  },
  "room-finca-z1": {
    displayTag: "Riego Z1",
    floorGradient: ["#6B5038", "#4A3820"],
    floorPattern: "grass",
    wallGradient: ["#87CEEB", "#4A90C9"],
    ceilingGradient: ["#BFE4F5", "#87CEEB"],
    accent: "#6FD38F",
    ambient: "#BFE4F5",
    outdoor: true,
    furniture: [
      // Rows of crops
      ...Array.from({ length: 5 }).flatMap((_, row) =>
        Array.from({ length: 8 }).map((_, col) => ({
          id: `crop-${row}-${col}`,
          x: 0.10 + col * 0.11,
          z: 0.15 + row * 0.18,
          w: 18, d: 18, h: 40,
          color: "#6FD38F",
          topColor: "#9BE8B5",
          shape: "cylinder" as const,
        })),
      ),
      { id: "sprinkler-1", x: 0.25, z: 0.50, w: 10, d: 10, h: 90, color: "#7A8288", topColor: "#C0C0C0", shape: "cylinder", accent: "#5EC7E8", label: "Aspersor" },
      { id: "sprinkler-2", x: 0.75, z: 0.50, w: 10, d: 10, h: 90, color: "#7A8288", topColor: "#C0C0C0", shape: "cylinder", accent: "#5EC7E8" },
      { id: "shed", x: 0.92, z: 0.90, w: 80, d: 70, h: 120, color: "#8B6F4E", topColor: "#5A4632", label: "Bodega" },
    ],
  },
  "room-finca-z2": {
    displayTag: "Riego Z2",
    floorGradient: ["#5A4028", "#3A2815"],
    floorPattern: "grass",
    wallGradient: ["#96C8E0", "#5A90B8"],
    ceilingGradient: ["#BFE4F5", "#87CEEB"],
    accent: "#F0B85C",
    ambient: "#BFE4F5",
    outdoor: true,
    furniture: [
      // Rows of fruit trees
      { id: "tree-1", x: 0.20, z: 0.25, w: 55, d: 55, h: 130, color: "#7FA071", topColor: "#EF6A5E", shape: "cylinder", label: "Frutal" },
      { id: "tree-2", x: 0.50, z: 0.25, w: 55, d: 55, h: 130, color: "#7FA071", topColor: "#EF6A5E", shape: "cylinder" },
      { id: "tree-3", x: 0.80, z: 0.25, w: 55, d: 55, h: 130, color: "#7FA071", topColor: "#EF6A5E", shape: "cylinder" },
      { id: "tree-4", x: 0.20, z: 0.55, w: 55, d: 55, h: 130, color: "#7FA071", topColor: "#F0B85C", shape: "cylinder" },
      { id: "tree-5", x: 0.50, z: 0.55, w: 55, d: 55, h: 130, color: "#7FA071", topColor: "#F0B85C", shape: "cylinder" },
      { id: "tree-6", x: 0.80, z: 0.55, w: 55, d: 55, h: 130, color: "#7FA071", topColor: "#F0B85C", shape: "cylinder" },
      { id: "tree-7", x: 0.20, z: 0.85, w: 55, d: 55, h: 130, color: "#6B8A5E", topColor: "#D4A84B", shape: "cylinder" },
      { id: "tree-8", x: 0.50, z: 0.85, w: 55, d: 55, h: 130, color: "#6B8A5E", topColor: "#D4A84B", shape: "cylinder" },
      { id: "tree-9", x: 0.80, z: 0.85, w: 55, d: 55, h: 130, color: "#6B8A5E", topColor: "#D4A84B", shape: "cylinder" },
      { id: "tank",   x: 0.92, z: 0.15, w: 45, d: 45, h: 90, color: "#A8B0B8", topColor: "#C0C8D0", shape: "cylinder", accent: "#5EC7E8", label: "Tanque" },
    ],
  },
};

export function getRoomTheme(roomId: string): RoomTheme {
  return ROOM_THEMES[roomId] ?? DEFAULT;
}
