import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { getStoryImageUrl, isIllustrativeImage } from "../../src/lib/edition/images";

test("a category stock image is identified as illustrative, a publisher image is not", () => {
  expect(isIllustrativeImage(null)).toBe(true);
  expect(isIllustrativeImage("")).toBe(true);
  expect(isIllustrativeImage("not-a-url")).toBe(true);
  expect(isIllustrativeImage("https://publisher.example/photo.jpg")).toBe(false);
  // The two helpers must agree: whenever the stock fallback is returned, it is flagged.
  for (const explicit of [null, "", "not-a-url", "https://publisher.example/photo.jpg"]) {
    expect(getStoryImageUrl("science", explicit) !== explicit).toBe(isIllustrativeImage(explicit));
  }
});

test("pages that can show a stock image label it, and make no unsupported curation claim", () => {
  for (const path of ["src/app/page.tsx", "src/app/paper/page.tsx"]) {
    const source = readFileSync(path, "utf8");
    const images = source.match(/getStoryImageUrl\(/g)?.length ?? 0;
    const labels = source.match(/<IllustrativeImageLabel\b/g)?.length ?? 0;
    expect(images).toBeGreaterThan(0);
    expect(labels, `${path}: every stock-image fallback needs a label`).toBe(images);
    expect(source).not.toMatch(/Editor.s Choice/i);
  }
});
