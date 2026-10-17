import { test, expect } from "@playwright/test";
import { selectEditionStories } from "../src/lib/edition/ranking";
import type { GroupedSourceArticle } from "../src/lib/edition/types";
import { feedbackSourceIdentities } from "../src/lib/edition/feedback-identity";

const stories: GroupedSourceArticle[] = [
  {
    id: "science-story",
    external_id: "science-story",
    title: "A science discovery",
    description: "Researchers report a new result.",
    snippet: "A controlled reporting example.",
    url: "https://example.com/science",
    image_url: null,
    publisher: "Example News",
    published_at: "2026-10-17T10:00:00Z",
    language: "en",
    categories: ["science"],
    locale: null,
    supportingArticles: [],
  },
  {
    id: "sports-story",
    external_id: "sports-story",
    title: "Z local sports result",
    description: "A match ends with a clear result.",
    snippet: "A controlled reporting example.",
    url: "https://example.com/sports",
    image_url: null,
    publisher: "Example News",
    published_at: "2026-10-17T10:00:00Z",
    language: "en",
    categories: ["sports"],
    locale: null,
    supportingArticles: [],
  },
];

test("explicit More and Less feedback changes only future ranking and leaves Skip neutral", () => {
  const preferences = {
    interests: ["science", "sports"],
    preferred_region: "global",
    reading_length: 5,
  };
  const baseline = selectEditionStories(stories, preferences, new Date("2026-10-17T12:00:00Z"));
  const moreSports = selectEditionStories(stories, preferences, new Date("2026-10-17T12:00:00Z"), [], { sports: 1 });
  const lessScience = selectEditionStories(stories, preferences, new Date("2026-10-17T12:00:00Z"), [], { science: -1 });
  const skip = selectEditionStories(stories, preferences, new Date("2026-10-17T12:00:00Z"), [], {});

  expect(baseline.main[0].id).toBe("science-story");
  expect(moreSports.main[0].id).toBe("sports-story");
  expect(lessScience.main[0].id).toBe("sports-story");
  expect(skip.main.map((story) => story.id)).toEqual(baseline.main.map((story) => story.id));
});

test("feedback identity follows a Story when its representative source changes", () => {
  const previousSupportingSources = [
    { id: "article-a", url: "https://example.com/a" },
    { id: "article-b", url: "https://example.com/b" },
  ];
  const nextSupportingSources = [
    { id: "article-b", url: "https://example.com/b" },
    { id: "article-c", url: "https://example.com/c" },
  ];
  const previousEdition = feedbackSourceIdentities({
    id: "edition-story-a",
    source_article_id: "article-a",
    source_url: "https://example.com/a",
    supporting_sources: previousSupportingSources,
  });
  const nextEdition = feedbackSourceIdentities({
    id: "edition-story-b",
    source_article_id: "article-b",
    source_url: "https://example.com/b",
    supporting_sources: nextSupportingSources,
  });

  expect(nextEdition.some((identity) => previousEdition.includes(identity))).toBe(true);
});
