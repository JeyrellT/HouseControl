// Client stub for generating a RoomSpec via an LLM. The backend endpoint is not implemented yet.
// This file shows the intended wiring: send brief → receive JSON → validate with Zod → self-correct once if needed.

import { parseRoomSpec, type RoomSpec } from "../schema/room-schema";
import { ROOM_SPEC_JSON_SCHEMA, SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

export interface GenerateRoomOptions {
  brief: string;
  /** Endpoint that proxies to Gemini / OpenAI with structured output. Expects POST {system,user,schema}. */
  endpoint?: string;
  signal?: AbortSignal;
}

export interface GenerateRoomResult {
  ok: true;
  spec: RoomSpec;
}

export interface GenerateRoomError {
  ok: false;
  error: string;
  raw?: unknown;
}

async function callEndpoint(
  endpoint: string,
  payload: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error(`LLM endpoint returned ${res.status}`);
  return res.json();
}

/**
 * Generate a RoomSpec from a natural-language brief.
 * TODO: implement /api/generate-room on the server side that forwards to Gemini structured output.
 */
export async function generateRoom({
  brief,
  endpoint = "/api/generate-room",
  signal,
}: GenerateRoomOptions): Promise<GenerateRoomResult | GenerateRoomError> {
  const basePayload = {
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(brief),
    schema: ROOM_SPEC_JSON_SCHEMA,
  };

  try {
    const raw = await callEndpoint(endpoint, basePayload, signal);
    const first = parseRoomSpec(raw);
    if (first.ok) return { ok: true, spec: first.spec };

    // One self-correction attempt — ask the model to fix validation errors.
    const corrected = await callEndpoint(
      endpoint,
      {
        ...basePayload,
        user: `${basePayload.user}\n\nPrevious output failed validation with errors:\n${first.error}\nReturn corrected JSON.`,
        previous: raw,
      },
      signal,
    );
    const second = parseRoomSpec(corrected);
    if (second.ok) return { ok: true, spec: second.spec };
    return { ok: false, error: second.error, raw: corrected };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
