import { test, expect } from "@playwright/test";
import { groupSourceArticles } from "../src/lib/edition/grouping";
import type { SourceArticle } from "../src/lib/edition/types";

function report(
  id: string,
  title: string,
  publishedAt: string,
  description: string,
): SourceArticle {
  return {
    id,
    external_id: id,
    title,
    description,
    snippet: null,
    url: `https://publisher-${id}.example/story/${id}`,
    image_url: null,
    publisher: `Publisher ${id}`,
    published_at: publishedAt,
    language: "en",
    categories: ["general"],
    locale: "global",
  };
}

test("groups a frozen multi-publisher event when time, entities, headline, and reporting agree", () => {
  const reports = [
    report(
      "a",
      "Pakistan Supreme Court suspends Lahore water contract",
      "2026-10-17T10:00:00Z",
      "The Supreme Court in Lahore halted the provincial water contract after officials raised safety concerns.",
    ),
    report(
      "b",
      "Lahore water contract suspended by Pakistan Supreme Court",
      "2026-10-17T11:00:00Z",
      "Pakistan's Supreme Court halted the Lahore provincial water contract after safety concerns.",
    ),
  ];

  const [group] = groupSourceArticles(reports);

  expect(group.supportingArticles.map((article) => article.id).sort()).toEqual(["a", "b"]);
});

test("keeps similar headlines apart when the publication times or reporting evidence conflict", () => {
  const oldAndNew = [
    report("old", "Government announces new climate policy", "2026-10-14T10:00:00Z", "Officials announced a renewable energy plan."),
    report("new", "Government announces new climate policy", "2026-10-17T10:00:00Z", "Officials announced a flood evacuation plan."),
  ];
  const separateDevelopments = [
    report("energy", "Government announces new climate policy", "2026-10-17T10:00:00Z", "Officials announced a renewable energy plan for solar farms."),
    report("flood", "Government announces new climate policy", "2026-10-17T11:00:00Z", "Officials announced a flood evacuation plan for coastal towns."),
  ];

  expect(groupSourceArticles(oldAndNew)).toHaveLength(2);
  expect(groupSourceArticles(separateDevelopments)).toHaveLength(2);
});
