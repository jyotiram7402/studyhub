import { describe, expect, it } from "vitest";
import { chunkText, estimateReadingMinutes } from "@/lib/ai/chunking";

describe("chunkText", () => {
  it("returns an empty array for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n  ")).toEqual([]);
  });

  it("keeps short documents as a single chunk", () => {
    const chunks = chunkText("A short paragraph about databases.");
    expect(chunks).toHaveLength(1);
  });

  it("splits long documents into overlapping chunks", () => {
    const sentence = "Normalization reduces redundancy in relational databases. ";
    const text = sentence.repeat(200);
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(1700);
    }
  });

  it("caps the number of chunks", () => {
    const chunks = chunkText("word ".repeat(100000));
    expect(chunks.length).toBeLessThanOrEqual(60);
  });
});

describe("estimateReadingMinutes", () => {
  it("returns at least one minute", () => {
    expect(estimateReadingMinutes("a few words")).toBe(1);
  });

  it("scales with word count at 200 wpm", () => {
    expect(estimateReadingMinutes("word ".repeat(600))).toBe(3);
  });
});
