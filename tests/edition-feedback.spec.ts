import { test, expect } from "@playwright/test";
import { selectEditionStories } from "../src/lib/edition/ranking";
import type { GroupedSourceArticle } from "../src/lib/edition/types";

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
