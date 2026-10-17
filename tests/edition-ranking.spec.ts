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

  test("REGRESSION: two readers with different interests receive different top stories from the same shared supply pool", () => {
    // This test locks down the core personalization contract.
    // Bug: when the shared pool was homogeneous (3 generic articles, no category diversity),
    // both readers received identical editions regardless of their saved interests.
    const diversePool: SourceArticle[] = [
      {
        id: "r1", external_id: "reg-1",
        title: "Cricket Final Victory", description: "National team wins the cup.",
        snippet: "Pakistan clinches the trophy in a dramatic final over.",
        url: "https://example.com/cricket", image_url: null,
        publisher: "Sports Wire", published_at: "2026-10-17T10:00:00Z",
        language: "en", categories: ["sports"], locale: "pk",
      },
      {
        id: "r2", external_id: "reg-2",
        title: "AI Chip Breakthrough", description: "New neural processing unit announced.",
        snippet: "Researchers unveiled a chip ten times faster than current GPUs.",
        url: "https://example.com/ai-chip", image_url: null,
        publisher: "Tech Daily", published_at: "2026-10-17T10:00:00Z",
        language: "en", categories: ["technology", "science"], locale: "us",
      },
      {
        id: "r3", external_id: "reg-3",
        title: "Global Climate Summit", description: "World leaders meet.",
        snippet: "Fifty nations agreed to new carbon limits.",
        url: "https://example.com/climate", image_url: null,
        publisher: "World Post", published_at: "2026-10-17T08:00:00Z",
        language: "en", categories: ["general", "science"], locale: null,
      },
      {
        id: "r4", external_id: "reg-4",
        title: "Stock Market Rally", description: "Business index surges.",
        snippet: "Markets reached an all-time high driven by tech earnings.",
        url: "https://example.com/stocks", image_url: null,
        publisher: "Finance Post", published_at: "2026-10-17T09:00:00Z",
        language: "en", categories: ["business"], locale: "us",
      },
    ];

    // Reader A cares about sports
    const sportsFan = selectAndRankStories(
      diversePool,
      { interests: ["sports"], preferred_region: "pk", reading_length: 5 },
      baseDate,
    );

    // Reader B cares about technology
    const techReader = selectAndRankStories(
      diversePool,
      { interests: ["technology"], preferred_region: "us", reading_length: 5 },
      baseDate,
    );

    // Their top stories MUST differ — personalization must produce different results
    expect(sportsFan[0].external_id).not.toBe(techReader[0].external_id);

    // Sports fan's top story must be the cricket article (category + region boost)
    expect(sportsFan[0].external_id).toBe("reg-1");

    // Tech reader's top story must be the AI chip article (category + region boost)
    expect(techReader[0].external_id).toBe("reg-2");
  });
});
