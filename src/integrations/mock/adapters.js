import { createDevice } from "../../domain/entities/device.js";
import { createNeuroState } from "../../domain/entities/neuroState.js";
import { createPlatform } from "../../domain/entities/platform.js";
import { createRecommendation } from "../../domain/entities/recommendation.js";
import { createRoom } from "../../domain/entities/room.js";

export function toRoomDomain(dto) {
  return createRoom(dto);
}

export function toDeviceDomain(dto) {
  return createDevice(dto);
}

export function toRecommendationDomain(dto) {
  return createRecommendation(dto);
}

export function toPlatformDomain(dto) {
  return createPlatform(dto);
}

export function toNeuroStateDomain(dto) {
  return createNeuroState(dto);
}

