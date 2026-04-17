import { mockEventFeed, mockHealthSnapshot } from "../mock-data/monitoring.js";

export async function getSystemHealth() {
  return Promise.resolve(mockHealthSnapshot);
}

export async function getMockEventFeed() {
  return Promise.resolve(mockEventFeed);
}
