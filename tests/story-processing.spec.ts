import { test, expect } from "@playwright/test";
import { processGroupedStories } from "../src/lib/edition/story-processing";
import type { GroupedSourceArticle } from "../src/lib/edition/types";
import type { SupabaseClient } from "@supabase/supabase-js";

test("rejects a generated topic label that the supplied sources do not support", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnvironment = {
    enabled: process.env.GEMINI_PUBLIC_BRIEFINGS_ENABLED,
    key: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  };
  process.env.GEMINI_PUBLIC_BRIEFINGS_ENABLED = "true";
  process.env.GEMINI_API_KEY = "test-key";
  process.env.GEMINI_MODEL = "test-model";

  const source = {
    id: "source-1",
    external_id: "source-1",
    title: "New solar chip improves computer efficiency",
    description: "Researchers tested a solar-powered computer chip.",
    snippet: "The chip reduced energy use in laboratory tests.",
    url: "https://example.com/solar-chip",
    image_url: null,
    publisher: "Science Daily",
    published_at: "2026-10-17T10:00:00Z",
    language: "en",
    categories: ["technology"],
    locale: "global",
  };
  const grouped: GroupedSourceArticle = {
    ...source,
    supportingArticles: [source],
  };
  const supabase = {
    from: () => ({
      select: () => ({ in: async () => ({ data: [] }) }),
      upsert: async () => ({ error: null }),
    }),
  } as unknown as SupabaseClient;

  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body));
    const requestData = JSON.parse(request.contents[0].parts[0].text);
    const story = requestData.stories[0];
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify({
        stories: [{
          id: story.id,
          briefing: "Researchers tested a solar powered computer chip.",
          why_it_matters: "The chip reduced energy use in laboratory tests.",
          topics: ["politics"],
          source_ids: story.sources.map((item: { id: string }) => item.id),
        }],
      }) }] } }],
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  try {
    const result = await processGroupedStories(supabase, [grouped]);
    const processed = result.get(grouped.id);

    expect(processed?.source).toBe("publisher_excerpt");
    expect(processed?.topics).toEqual(["technology"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEnvironment.enabled === undefined) delete process.env.GEMINI_PUBLIC_BRIEFINGS_ENABLED;
    else process.env.GEMINI_PUBLIC_BRIEFINGS_ENABLED = originalEnvironment.enabled;
    if (originalEnvironment.key === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalEnvironment.key;
    if (originalEnvironment.model === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalEnvironment.model;
  }
});
