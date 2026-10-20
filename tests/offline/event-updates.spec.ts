import { test, expect } from "@playwright/test";
import { detectEventUpdate } from "../../src/lib/edition/events";
import type { SourceArticle } from "../../src/lib/edition/types";

test("a republished timestamp and update headline do not establish new facts", () => {
  const candidate: SourceArticle = {
    id: "a", external_id: "a", title: "Updated: City opens library", description: "The city opened a public library with study rooms and books for residents.",
    snippet: null, url: "https://publisher.org/library", image_url: null, publisher: "Publisher",
    published_at: "2026-10-19T10:00:00Z", language: "en", categories: ["general"], locale: null,
  };
  expect(detectEventUpdate(candidate, {
    title: "City opens library", sourceUrl: candidate.url, category: "general",
    publishedAt: "2026-10-18T10:00:00Z", briefing: candidate.description!,
  }).isUpdate).toBe(false);
});
