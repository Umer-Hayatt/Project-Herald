import { test, expect } from "@playwright/test";
import { getPublicSampleEdition } from "../../src/lib/edition/sample";

test("public sample retains its historical date, real sources and measured length", () => {
  const sample = getPublicSampleEdition();
  expect(sample.edition_date).toBe("2022-10-11");
  for (const story of sample.stories) {
    expect(new URL(story.source_url).hostname).toMatch(/(^|\.)nasa.gov$/);
    const visible = [story.title, story.briefing || story.excerpt, story.why_it_matters].filter(Boolean).join(" ");
    expect(story.word_count).toBe(visible.trim().split(/\s+/).length);
  }
  expect(sample.word_count).toBe(sample.stories.reduce((sum, story) => sum + story.word_count, 0));
});
