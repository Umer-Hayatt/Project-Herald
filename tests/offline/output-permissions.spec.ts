import { test, expect } from "@playwright/test";
import { evaluateArticleQuality } from "../../src/lib/edition/content-quality";

const article = {
  external_id: "news-1", title: "City library expands public opening hours",
  url: "https://publisher.org/reports/library-hours", publisher: "Publisher",
  published_at: "2026-10-19T10:00:00Z",
  description: "The city library will open earlier on weekdays and offer additional evening study hours to residents beginning next Monday.",
};
const options = { now: new Date("2026-10-19T12:00:00Z") };
test("public reporting requires explicit output permission and provider provenance", () => {
  for (const raw_data of [undefined, { output_use: "internal_testing", provider: "controlled" }, { output_use: "commercial" }]) {
    expect(evaluateArticleQuality({ ...article, raw_data }, options).eligible).toBe(false);
  }
  expect(evaluateArticleQuality({ ...article, raw_data: { output_use: "commercial", provider: "thenewsapi" } }, options).eligible).toBe(true);
});

test("example-domain fixtures cannot become public reporting", () => {
  expect(evaluateArticleQuality({ ...article, url: "https://herald.example.com/report", raw_data: { provider: "thenewsapi", output_use: "commercial" } }, options).eligible).toBe(false);
});
