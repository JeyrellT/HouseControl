import { mockRecommendationExplanations, mockRecommendations } from "../mock-data/recommendations.js";

export async function listRecommendations() {
  return Promise.resolve(mockRecommendations);
}

export async function getRecommendationExplanation(id) {
  return Promise.resolve(mockRecommendationExplanations[id] ?? null);
}

export async function getAllRecommendationExplanations() {
  const entries = await Promise.all(
    mockRecommendations.map(async (item) => [item.id, await getRecommendationExplanation(item.id)])
  );

  return Object.fromEntries(entries);
}
