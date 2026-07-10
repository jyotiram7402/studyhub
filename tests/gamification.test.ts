import { describe, expect, it } from "vitest";
import { getAchievements, getLevel, getNextLevel } from "@/lib/gamification";

describe("getLevel", () => {
  it("starts everyone at level one", () => {
    expect(getLevel(0).level).toBe(1);
  });

  it("advances through thresholds", () => {
    expect(getLevel(50).level).toBe(2);
    expect(getLevel(399).level).toBe(3);
    expect(getLevel(2500).level).toBe(6);
  });
});

describe("getNextLevel", () => {
  it("returns the next threshold", () => {
    expect(getNextLevel(0)?.level).toBe(2);
  });

  it("returns null at the top level", () => {
    expect(getNextLevel(99999)).toBeNull();
  });
});

describe("getAchievements", () => {
  const baseStats = {
    uploadCount: 0,
    salesCount: 0,
    downloadCount: 0,
    reviewCount: 0,
    ratingAvg: 0,
    isVerified: false,
    points: 0,
  };

  it("awards nothing to a brand-new account", () => {
    const earned = getAchievements(baseStats).filter((achievement) => achievement.earned);
    expect(earned).toHaveLength(0);
  });

  it("awards upload and sale milestones", () => {
    const achievements = getAchievements({
      ...baseStats,
      uploadCount: 12,
      salesCount: 30,
    });
    const ids = achievements.filter((a) => a.earned).map((a) => a.id);
    expect(ids).toContain("first-upload");
    expect(ids).toContain("prolific");
    expect(ids).toContain("first-sale");
    expect(ids).toContain("best-seller");
  });

  it("requires enough reviews for the top-rated badge", () => {
    const fewReviews = getAchievements({ ...baseStats, ratingAvg: 5, reviewCount: 1 });
    expect(fewReviews.find((a) => a.id === "top-rated")?.earned).toBe(false);

    const enoughReviews = getAchievements({ ...baseStats, ratingAvg: 4.6, reviewCount: 5 });
    expect(enoughReviews.find((a) => a.id === "top-rated")?.earned).toBe(true);
  });
});
