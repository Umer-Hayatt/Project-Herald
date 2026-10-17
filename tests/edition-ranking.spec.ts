import { test, expect } from "@playwright/test";
import { selectAndRankStories, estimateReadingTime } from "../src/lib/edition/ranking";
import type { SourceArticle } from "../src/lib/edition/types";

test.describe("selectAndRankStories", () => {
  const baseDate = new Date("2026-10-17T12:00:00Z");

  const sampleArticles: SourceArticle[] = [
    {
      id: "1",
      external_id: "ext-1",
      title: "Tech Innovation in AI",
      description: "A breakthrough in machine intelligence.",
      snippet: "Researchers announced a new framework for agent reasoning.",
      url: "https://example.com/tech-ai",
      image_url: null,
      publisher: "Tech Daily",
      published_at: "2026-10-17T10:00:00Z", // 2 hours old
      language: "en",
      categories: ["technology", "science"],
      locale: "us",
    },
    {
      id: "2",
      external_id: "ext-2",
      title: "Local Sports Championship",
      description: "Cricket final concludes with victory.",
      snippet: "The national team secured the trophy in a thrilling finish.",
      url: "https://example.com/sports-pk",
      image_url: null,
      publisher: "Herald Sports",
      published_at: "2026-10-17T09:00:00Z", // 3 hours old
      language: "en",
      categories: ["sports"],
      locale: "pk",
    },
    {
      id: "3",
      external_id: "ext-3",
      title: "Global Climate Summit",
      description: "World leaders gather to discuss sustainability.",
      snippet: "Delegates from fifty nations agreed on new carbon limits.",
      url: "https://example.com/climate-global",
      image_url: null,
      publisher: "World Post",
      published_at: "2026-10-17T08:00:00Z", // 4 hours old
      language: "en",
      categories: ["general", "science"],
      locale: null, // global
    },
    {
      id: "4",
      external_id: "ext-4",
      title: "Very Old News Event",
      description: "An event from last week.",
      snippet: "This happened 60 hours ago and should not qualify as fresh news.",
      url: "https://example.com/old-news",
      image_url: null,
      publisher: "Old Times",
      published_at: "2026-10-14T12:00:00Z", // 72 hours old (> 48h freshness)
      language: "en",
      categories: ["general"],
      locale: "us",
    },
  ];

  test("filters out reporting older than 48-hour freshness window", () => {
    const selected = selectAndRankStories(sampleArticles, {
      interests: ["general", "technology", "sports", "science"],
      preferred_region: "global",
      reading_length: 10,
    }, baseDate);

    const ids = selected.map((s) => s.external_id);
    expect(ids).not.toContain("ext-4");
  });

  test("boosts preferred region while keeping global stories eligible", () => {
    const selected = selectAndRankStories(sampleArticles, {
      interests: ["sports", "science"],
      preferred_region: "pk",
      reading_length: 10,
    }, baseDate);

    // ext-2 has matching category 'sports' (+10) AND matches preferred_region 'pk' (+5 boost)
    expect(selected[0].external_id).toBe("ext-2");

    // Global story ext-3 is still included
    expect(selected.map((s) => s.external_id)).toContain("ext-3");
  });

  test("honors reading length story budgets", () => {
    // 5 minutes budget: max 4 stories
    const fiveMin = selectAndRankStories(sampleArticles, {
      interests: ["general", "technology", "sports", "science"],
      preferred_region: "global",
      reading_length: 5,
    }, baseDate);
    expect(fiveMin.length).toBeLessThanOrEqual(4);
  });

  test("estimateReadingTime calculates honest reading time based on rendered words", () => {
    // 400 words at 200 words/min = 2 minutes
    expect(estimateReadingTime(400)).toBe(2);
    // 50 words = 1 minute minimum
    expect(estimateReadingTime(50)).toBe(1);
    // 0 words = 1 minute minimum
    expect(estimateReadingTime(0)).toBe(1);
  });
});
