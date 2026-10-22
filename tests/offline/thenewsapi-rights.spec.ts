import { test, expect } from "@playwright/test";
import { TheNewsApiAdapter } from "../../src/lib/edition/providers/thenewsapi";
import { createClient } from "@supabase/supabase-js";
import { getReportingSupply } from "../../src/lib/edition/news-supply";

test("revoked provider approval also hides a previously commercial shared cache entry", async () => {
  const previous = process.env.THENEWSAPI_COMMERCIAL_APPROVED;
  let provider = "thenewsapi";
  const database = createClient("http://127.0.0.1:54321", "test-only", {
    global: { fetch: async () => Response.json([{
      id: "cached-library", external_id: "cached-library",
      title: "City council funds new public library hours",
      description: "The city council approved longer public library hours for residents starting next month with additional evening sessions available on weekdays.",
      url: "https://publisher.org/reports/library-hours", publisher: "Publisher",
      published_at: "2026-10-22T08:00:00Z",
      raw_data: { provider, output_use: "commercial" },
    }]) },
  });
  try {
    process.env.THENEWSAPI_COMMERCIAL_APPROVED = "false";
    expect(await getReportingSupply(database, { referenceDate: new Date("2026-10-22T12:00:00Z") })).toEqual([]);
    process.env.THENEWSAPI_COMMERCIAL_APPROVED = "true";
    expect(await getReportingSupply(database, { referenceDate: new Date("2026-10-22T12:00:00Z") })).toHaveLength(1);
    provider = "unknown";
    expect(await getReportingSupply(database, { referenceDate: new Date("2026-10-22T12:00:00Z") })).toEqual([]);
  } finally {
    if (previous === undefined) delete process.env.THENEWSAPI_COMMERCIAL_APPROVED;
    else process.env.THENEWSAPI_COMMERCIAL_APPROVED = previous;
  }
});

test("TheNewsAPI reporting stays evaluation-only until public output is approved", async () => {
  const originalFetch = globalThis.fetch;
  const publishedAt = new Date().toISOString();
  const requests: URL[] = [];
  globalThis.fetch = async (input) => {
    requests.push(new URL(String(input)));
    return new Response(JSON.stringify({ data: [{
      uuid: "source-1", title: "City council funds new public library hours",
      description: "The city council approved longer public library hours for residents starting next month.",
      url: "https://publisher.org/reports/library-hours", published_at: publishedAt,
      source: "Publisher", language: "en", categories: ["general"],
    }] }), { status: 200 });
  };
  try {
    const unapproved = await new TheNewsApiAdapter("test-token", false).fetchCandidates();
    expect(unapproved.success).toBe(true);
    expect(unapproved.candidates[0].output_use).toBe("evaluation_only");
    const approved = await new TheNewsApiAdapter("test-token", true).fetchCandidates();
    expect(approved.candidates[0].output_use).toBe("commercial");
    expect(requests).toHaveLength(10);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
