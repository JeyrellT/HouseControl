// Event bus tipado (mitt) — esqueleto Rev 2 + envelope enriquecido Rev 7.

import mitt from "mitt";
import type { NexusEvent } from "./types";

type EventMap = {
  "nexus:event": NexusEvent;
};

export const eventBus = mitt<EventMap>();

let counter = 0;
export function nextEventId(): string {
  counter += 1;
  return `evt_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export function emit(event: Omit<NexusEvent, "eventId" | "ts" | "version"> & Partial<Pick<NexusEvent, "version">>) {
  const full: NexusEvent = {
    eventId: nextEventId(),
    ts: new Date().toISOString(),
    version: event.version ?? 1,
    ...event,
  };
  eventBus.emit("nexus:event", full);
  return full;
}
