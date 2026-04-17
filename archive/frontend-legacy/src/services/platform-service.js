import { mockPlatforms } from "../mock-data/platforms.js";

export async function listPlatforms() {
  return Promise.resolve(mockPlatforms);
}

export async function getPlatformStatus(id) {
  return Promise.resolve(mockPlatforms.find((item) => item.id === id) ?? null);
}
