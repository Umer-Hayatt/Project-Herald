import { test, expect } from "@playwright/test";
import { buildEditionStories, selectEditionStories } from "../src/lib/edition/ranking";
import type { GroupedSourceArticle } from "../src/lib/edition/types";

function story(
  id: string,
  title: string,
  categories: string[],
  overrides: Partial<GroupedSourceArticle> = {},
): GroupedSourceArticle {
  const source = {
    id: `source-${id}`,
    external_id: id,
    title,
    description: null,
    snippet: "A short attributed report.",
    url: `https://example.com/${id}`,
    image_url: null,
    publisher: "Example News",
    published_at: "2026-10-17T10:00:00Z",
    language: "en",
    categories,
    locale: "global",
  };
  return {
    ...source,
    supportingArticles: [source],
    ...overrides,
  };
}

test("discovery adds up to two story positions beyond the personalized count cap", () => {
  const articles = [
    ...Array.from({ length: 4 }, (_, index) =>
      story(`main-${index}`, `Science report ${index}`, ["science"]),
    ),
    story("discovery-a", "Government approves emergency flood response", ["politics"], {
      whyItMatters: "The decision affects public safety.",
    }),
    story("discovery-b", "Court orders new public health safeguards", ["health"], {
      whyItMatters: "The ruling changes health protections.",
    }),
  ];

  const selection = selectEditionStories(articles, {
    interests: ["science"],
    preferred_region: "global",
    reading_length: 5,
  }, new Date("2026-10-17T12:00:00Z"));

  expect(selection.main).toHaveLength(4);
  expect(selection.beyondBubble).toHaveLength(2);
  expect(selection.main.length + selection.beyondBubble.length).toBe(6);
});

test("stored story word count includes rendered importance explanation", () => {
  const article = story("discovery", "Public safety decision", ["government"], {
    briefing: "Officials approved the plan.",
    whyItMatters: "It protects residents during floods.",
  });

  const [editionStory] = buildEditionStories([article], "beyond_bubble");

  expect(editionStory.word_count).toBe(12);
});
