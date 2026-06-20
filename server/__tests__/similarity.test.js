import { cosineSimilarityVectors, combineScores, locationSimilarity } from "../services/ai/similarity.service.js";

describe("similarity.service", () => {
  test("cosineSimilarityVectors identical vectors", () => {
    const v = [1, 0, 0];
    expect(cosineSimilarityVectors(v, v)).toBeCloseTo(1);
  });

  test("combineScores weights", () => {
    const score = combineScores({ text: 1, image: 0.5, location: 0 }, { text: 0.4, image: 0.4, location: 0.2 });
    expect(score).toBeGreaterThan(0.5);
  });

  test("locationSimilarity same point", () => {
    const item = { locationGeo: { coordinates: [0, 0] } };
    expect(locationSimilarity(item, item, 10)).toBeCloseTo(1);
  });
});
