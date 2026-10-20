import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { getReportingSupply } from "../../src/lib/edition/news-supply";

test("controlled reporting remains in memory and never calls the database", async () => {
  let requests = 0;
  const database = createClient("http://127.0.0.1:54321", "test-only", {
    global: { fetch: async () => { requests++; throw new Error("Unexpected database request"); } },
  });
  const supply = await getReportingSupply(database, {
    referenceDate: new Date("2026-10-19T12:00:00Z"),
    controlledSupply: [{
      id: "controlled-library", external_id: "controlled-library", title: "City opens a new public library downtown",
      description: "The city opened a new public library downtown on Monday with books and study rooms available to local residents.",
      snippet: null, url: "https://publisher.org/library", publisher: "Test reporting", image_url: null,
      published_at: "2026-10-19T10:00:00Z", language: "en", categories: ["general"], locale: null,
      raw_data: { provider: "thenewsapi", output_use: "commercial" },
    }],
  });
  expect(supply).toHaveLength(1);
  expect(requests).toBe(0);
});
