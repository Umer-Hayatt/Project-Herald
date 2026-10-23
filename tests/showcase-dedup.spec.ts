import { test, expect } from "@playwright/test";
import { partitionShowcaseArticles } from "../src/lib/edition/showcase";
import type { SourceArticle } from "../src/lib/edition/types";

function makeArticle(overrides: Partial<SourceArticle>): SourceArticle {
  return {
    id: overrides.id || "art-" + Math.random().toString(36).substring(2, 9),
    external_id: overrides.external_id || "ext-" + Math.random().toString(36).substring(2, 9),
    title: overrides.title || "Default Test News Title Headline",
    description: overrides.description || "Substantive summary of news event.",
    snippet: overrides.snippet || "Detailed reporting of recent international development.",
    url: overrides.url || "https://reuters.com/world/article-" + Math.random().toString(36).substring(2, 9),
    image_url: overrides.image_url || null,
    publisher: overrides.publisher || "Associated Press",
    published_at: overrides.published_at || new Date().toISOString(),
    language: "en",
    categories: overrides.categories || ["technology"],
    locale: "global",
    raw_data: null,
  };
}

test.describe("Homepage Showcase News Deduplication & Partitioning", () => {
  test("filters out synthetic test fixtures (Herald Verified Wire, example.com, Fake, Probe)", () => {
    const raw = [
      makeArticle({
        title: "Trusted Ingestion Demonstrates Protected Shared Reporting",
        publisher: "Herald Verified Wire",
        url: "https://herald.example.com/trusted-ingestion-report",
      }),
      makeArticle({
        title: "Major Breakthrough in Quantum Coherence Longevity",
        publisher: "Quantum Science Review",
        url: "https://example.com/quantum-coherence-2026",
      }),
      makeArticle({
        title: "Authentic Climate Accord Signed by Forty Nations in Berlin",
        publisher: "Reuters",
        url: "https://reuters.com/world/climate-accord-berlin-2026",
      }),
      makeArticle({
        title: "Fake Test News Item For Health Check",
        publisher: "Fake",
        url: "https://bbc.com/news/fake-check",
      }),
    ];

    const partition = partitionShowcaseArticles(raw);

    // Only the authentic Reuters article should be included in the showcase
    expect(partition.heroArticle).not.toBeNull();
    expect(partition.heroArticle?.publisher).toBe("Reuters");
    expect(partition.heroArticle?.title).toBe("Authentic Climate Accord Signed by Forty Nations in Berlin");

    // All other slots must be empty
    expect(partition.spotlightArticle).toBeNull();
    expect(partition.featuredArticles).toHaveLength(0);
    expect(partition.latestArticles).toHaveLength(0);
    expect(partition.trendingArticles).toHaveLength(0);
  });

  test("deduplicates identical and near-identical news stories by URL and normalized title", () => {
    const raw = [
      makeArticle({
        id: "art-1",
        title: "Federal Reserve Announces Interest Rate Decision Today",
        url: "https://reuters.com/business/fed-interest-rate-today/",
      }),
      makeArticle({
        id: "art-2",
        title: "federal reserve announces interest rate decision today!", // Case & punctuation variation
        url: "https://bloomberg.com/news/fed-rate-decision",
      }),
      makeArticle({
        id: "art-3",
        title: "Fed Keeps Rates Steady in Landmark Vote",
        url: "https://reuters.com/business/fed-interest-rate-today", // Same URL without trailing slash
      }),
      makeArticle({
        id: "art-4",
        title: "New Advances in Deep Ocean Exploration Submersibles",
        url: "https://nature.com/articles/ocean-submersibles-2026",
      }),
    ];

    const partition = partitionShowcaseArticles(raw);

    // Only 2 distinct stories exist after deduplication
    expect(partition.heroArticle?.title).toBe("Federal Reserve Announces Interest Rate Decision Today");
    expect(partition.spotlightArticle?.title).toBe("New Advances in Deep Ocean Exploration Submersibles");
    expect(partition.featuredArticles).toHaveLength(0);
    expect(partition.latestArticles).toHaveLength(0);
    expect(partition.trendingArticles).toHaveLength(0);
  });

  test("guarantees 100% mutual exclusivity across Hero, Spotlight, Featured, Latest, and Trending", () => {
    // Generate 25 distinct real news articles
    const raw: SourceArticle[] = Array.from({ length: 25 }, (_, i) =>
      makeArticle({
        id: `unique-art-${i}`,
        title: `Unique Headline Number ${i} About World Events and Discoveries`,
        url: `https://apnews.com/article/distinct-world-story-${i}`,
        publisher: `News Wire ${i % 5}`,
      })
    );

    const partition = partitionShowcaseArticles(raw);

    expect(partition.heroArticle).not.toBeNull();
    expect(partition.spotlightArticle).not.toBeNull();
    expect(partition.featuredArticles.length).toBeGreaterThan(0);
    expect(partition.latestArticles.length).toBeGreaterThan(0);
    expect(partition.trendingArticles.length).toBeGreaterThan(0);

    // Collect all article IDs across all partitions
    const allPartitioned: SourceArticle[] = [
      partition.heroArticle!,
      partition.spotlightArticle!,
      ...partition.featuredArticles,
      ...partition.latestArticles,
      ...partition.trendingArticles,
    ];

    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const seenUrls = new Set<string>();

    for (const article of allPartitioned) {
      expect(seenIds.has(article.id)).toBe(false);
      expect(seenTitles.has(article.title.toLowerCase())).toBe(false);
      expect(seenUrls.has(article.url.toLowerCase())).toBe(false);

      seenIds.add(article.id);
      seenTitles.add(article.title.toLowerCase());
      seenUrls.add(article.url.toLowerCase());
    }

    // Crucially: Trending must NOT repeat stories already featured or in spotlight
    const heroId = partition.heroArticle!.id;
    const spotlightId = partition.spotlightArticle!.id;
    const featuredIds = new Set(partition.featuredArticles.map((a) => a.id));
    const latestIds = new Set(partition.latestArticles.map((a) => a.id));

    for (const trending of partition.trendingArticles) {
      expect(trending.id).not.toBe(heroId);
      expect(trending.id).not.toBe(spotlightId);
      expect(featuredIds.has(trending.id)).toBe(false);
      expect(latestIds.has(trending.id)).toBe(false);
    }
  });

  test("handles bounded supply gracefully without duplicating sections when supply is small", () => {
    // Only 4 distinct articles available
    const raw: SourceArticle[] = Array.from({ length: 4 }, (_, i) =>
      makeArticle({
        id: `small-art-${i}`,
        title: `Bounded Supply Story ${i} Regarding Global Infrastructure`,
        url: `https://reuters.com/infra-${i}`,
      })
    );

    const partition = partitionShowcaseArticles(raw);

    // With 4 articles: 1 hero, 1 spotlight, 2 featured, 0 latest, 0 trending (NO repetition!)
    expect(partition.heroArticle?.id).toBe("small-art-0");
    expect(partition.spotlightArticle?.id).toBe("small-art-1");
    expect(partition.featuredArticles).toHaveLength(2);
    expect(partition.latestArticles).toHaveLength(0);
    expect(partition.trendingArticles).toHaveLength(0);

    const totalCount =
      (partition.heroArticle ? 1 : 0) +
      (partition.spotlightArticle ? 1 : 0) +
      partition.featuredArticles.length +
      partition.latestArticles.length +
      partition.trendingArticles.length;

    expect(totalCount).toBe(4);
  });
});
