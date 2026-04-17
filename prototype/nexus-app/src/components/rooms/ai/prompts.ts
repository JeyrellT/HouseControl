// Prompt + JSON schema helpers for generating RoomSpec via an LLM (e.g., Gemini).
// Consumers can feed the JSON schema into structured-output APIs.

import { zodToJsonSchema } from "zod-to-json-schema";
import { RoomSpecSchema } from "../schema/room-schema";

export const ROOM_SPEC_JSON_SCHEMA = zodToJsonSchema(RoomSpecSchema, {
  name: "RoomSpec",
  target: "openApi3",
});

export const SYSTEM_PROMPT = `You are an interior/3D-scene designer. Generate a RoomSpec JSON that strictly conforms to the provided schema.

Constraints:
- Units: meters. Origin is the floor center; +Y is up.
- "dimensions" = [width, height, depth]. Typical: living room 5-7m wide, 2.7m tall.
- "openings[].u" and ".v" are normalized [0,1] in the wall-local frame (u=horizontal, v=vertical).
- "furniture[].position" is the CENTER of the piece bounding box in world meters; "size" = [w,h,d].
- Keep at least 0.8m of clearance between furniture and walls; avoid overlapping pieces.
- Use realistic materials: wood/fabric/metal/glass/plastic/screen/stone/plaster/leather/paint.
- Do not exceed 30 furniture pieces.
- Return ONLY valid JSON matching the RoomSpec schema. No commentary.
`;

export const FEW_SHOT_EXAMPLE = {
  id: "example-living",
  displayName: "Sala de ejemplo",
  displayTag: "Sala",
  dimensions: [6, 2.7, 5],
  floor: { kind: "wood", color: "#8B6F4E", roughness: 0.8 },
  walls: { kind: "plaster", color: "#F0EBDF", roughness: 0.9 },
  ceiling: { kind: "plaster", color: "#FAF8F2" },
  accent: "#D4A84B",
  openings: [
    { wall: "north", kind: "window", u: 0.6, v: 0.55, width: 1.8, height: 1.2 },
  ],
  furniture: [
    {
      id: "sofa",
      type: "sofa",
      position: [-1.5, 0.45, 1.2],
      size: [2.4, 0.9, 0.95],
      primary: { kind: "fabric", color: "#4A5F6D" },
    },
  ],
  lighting: {
    ambientIntensity: 0.4,
    sunIntensity: 1.4,
    sunDirection: [6, 10, 4],
    sunColor: "#FFF4E0",
    envPreset: "apartment",
  },
  outdoor: false,
};

export function buildUserPrompt(brief: string): string {
  return `Design a room based on this brief, returning only JSON matching the RoomSpec schema.

Brief: ${brief}

Example output (for reference only; do not copy verbatim):
${JSON.stringify(FEW_SHOT_EXAMPLE, null, 2)}
`;
}
