import { describe, expect, it } from "vitest";
import { recommend } from "./quiz";

describe("recommend", () => {
  it("sends acne and unsure visitors to a doctor-led consultation", () => {
    expect(recommend("acne", "returning").serviceSlug).toBe("dermatology-consultation");
    expect(recommend("unsure", "new").serviceSlug).toBe("dermatology-consultation");
  });

  it("requires an assessment before first-time pigmentation laser", () => {
    expect(recommend("pigmentation", "new").serviceSlug).toBe("dermatology-consultation");
    expect(recommend("pigmentation", "returning").serviceSlug).toBe("pigmentation-laser");
  });

  it("starts first-time hair removal with the free skin analysis", () => {
    expect(recommend("hair", "new").serviceSlug).toBe("skin-analysis");
    expect(recommend("hair", "returning").serviceSlug).toBe("laser-hair-removal");
  });
});
