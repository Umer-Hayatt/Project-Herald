import type { SupabaseClient } from "@supabase/supabase-js";
import type { SourceArticle } from "./types";
import { filterEligibleArticles } from "./content-quality";

interface TheNewsAPIArticle {
  uuid: string;
  title: string;
  description?: string;
  snippet?: string;
  url: string;
  image_url?: string;
  language: string;
  published_at: string;
  source: string;
  categories?: string[];
  locale?: string;
}

/**
 * Retrieves the shared reporting supply.
 * Reuses server-cached articles within 60 minutes to protect provider rate limits.
 * All articles pass the common content-quality eligibility policy before ingestion
 * and before selection.
 */
export async function getReportingSupply(
  supabase: SupabaseClient,
  options?: {
    forceRefresh?: boolean;
    controlledSupply?: SourceArticle[];
    referenceDate?: Date;
  },
): Promise<SourceArticle[]> {
  const now = options?.referenceDate || new Date();

  // If controlled supply is supplied (for tests/fixtures), filter and ingest via trusted RPC
  if (options?.controlledSupply !== undefined) {
    if (options.controlledSupply.length === 0) return [];
    const eligibleControlled = filterEligibleArticles(options.controlledSupply, {
      now,
      maxAgeHours: 48,
    });
    if (eligibleControlled.length === 0) return [];

    const records = eligibleControlled.map((s) => ({
      id: s.id,
      external_id: s.external_id,
      title: s.title,
      description: s.description || null,
      snippet: s.snippet || null,
      url: s.url,
      image_url: s.image_url || null,
      publisher: s.publisher,
      published_at: s.published_at,
      retrieved_at: s.retrieved_at || now.toISOString(),
      language: s.language || "en",
      categories: s.categories || ["general"],
      locale: s.locale || null,
    }));

    try {
      // Authenticated test context claims refresh with 0 provider calls
      const { data: lockToken } = await supabase.rpc("claim_reporting_refresh", {
        p_force_refresh: true,
        p_provider_calls: 0,
      });
      if (lockToken) {
        await supabase.rpc("ingest_source_articles", {
          p_lock_token: lockToken,
          p_articles: records,
        });
        await supabase.rpc("finish_reporting_refresh", {
          p_lock_token: lockToken,
          p_succeeded: true,
        });
      }
    } catch {
      // In-memory fallback if database RPC unavailable in testing
    }
    return eligibleControlled as SourceArticle[];
  }

  const maxAgeIso = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const token = process.env.THENEWSAPI_TOKEN;
  if (token) {
    // The database reserves five HTTP calls against its fixed daily budget of fifteen.
    const { data: lockToken } = await supabase.rpc("claim_reporting_refresh", {
      p_force_refresh: options?.forceRefresh || false,
      p_provider_calls: 5,
    });

    // A null token means a fresh cache, another active refresh, or an exhausted budget.
    if (lockToken) {
      let succeeded = false;
      try {
        const { articles, validResponse } = await fetchNewsFromProvider(token);
        if (validResponse) {
          const rawCandidates = articles.map((item) => {
            const normalizedCats = new Set((item.categories || ["general"]).map((c) => c.toLowerCase()));
            if (normalizedCats.has("tech")) normalizedCats.add("technology");
            if (normalizedCats.has("technology")) normalizedCats.add("tech");

            return {
              external_id: item.uuid,
              title: item.title,
              description: item.description || null,
              snippet: item.snippet || null,
              url: item.url,
              image_url: item.image_url || null,
              publisher: item.source,
              published_at: item.published_at,
              retrieved_at: now.toISOString(),
              language: item.language || "en",
              categories: Array.from(normalizedCats),
              locale: item.locale || null,
            };
          });

          // Apply unified content quality eligibility policy
          const eligibleArticles = filterEligibleArticles(rawCandidates, {
            now,
            maxAgeHours: 48,
          });

          if (eligibleArticles.length) {
            // Write strictly via trusted ingestion RPC
            const { error: ingestError } = await supabase.rpc("ingest_source_articles", {
              p_lock_token: lockToken,
              p_articles: eligibleArticles,
            });
            if (ingestError) throw ingestError;
          }
          // Empty or rejected-only responses must not suppress a reader's Retry for an hour.
          succeeded = eligibleArticles.length > 0;
        }
      } catch {
        // The request reservation is retained even when a provider call fails.
      } finally {
        await supabase.rpc("finish_reporting_refresh", {
          p_lock_token: lockToken,
          p_succeeded: succeeded,
        });
      }
    }
  }

  // Read a bounded fresh cache and filter through the content quality policy.
  const { data: cachedArticles } = await supabase
    .from("source_articles")
    .select("*")
    .gte("published_at", maxAgeIso)
    .order("published_at", { ascending: false });

  const rawCached = (cachedArticles || []) as SourceArticle[];
  return filterEligibleArticles(rawCached, { now, maxAgeHours: 48 });
}

function isTheNewsApiArticle(value: unknown): value is TheNewsAPIArticle {
  if (typeof value !== "object" || value === null) return false;
  const article = value as Record<string, unknown>;
  return typeof article.uuid === "string" && article.uuid.length > 0 &&
    typeof article.title === "string" && article.title.length > 0 &&
    typeof article.url === "string" && /^https?:\/\//i.test(article.url) &&
    typeof article.published_at === "string" && Number.isFinite(Date.parse(article.published_at)) &&
    typeof article.source === "string" && article.source.length > 0 &&
    typeof article.language === "string" &&
    [article.description, article.snippet, article.image_url, article.locale]
      .every((field) => field === undefined || typeof field === "string") &&
    (article.categories === undefined || (Array.isArray(article.categories) &&
      article.categories.every((category) => typeof category === "string")));
}

async function fetchNewsFromProvider(
  token: string,
): Promise<{ articles: TheNewsAPIArticle[]; validResponse: boolean }> {
  const groups = [
    "tech,science",
    "sports,travel",
    "business,politics",
    "health,food",
    "general,entertainment",
  ];
  const results = await Promise.allSettled(
    groups.map(async (categories) => {
      const url = new URL("https://api.thenewsapi.com/v1/news/all");
      url.search = new URLSearchParams({
        api_token: token,
        language: "en",
        categories,
        limit: "3",
      }).toString();

      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return { articles: [], validResponse: false };
      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null || !Array.isArray((body as { data?: unknown }).data)) {
        return { articles: [], validResponse: false };
      }
      const entries = (body as { data: unknown[] }).data;
      const articles = entries.filter(isTheNewsApiArticle);
      return { articles, validResponse: articles.length === entries.length };
    }),
  );

  const seenUuids = new Set<string>();
  const articles: TheNewsAPIArticle[] = [];
  let validResponse = false;
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    validResponse ||= result.value.validResponse;
    for (const item of result.value.articles) {
      if (!seenUuids.has(item.uuid)) {
        seenUuids.add(item.uuid);
        articles.push(item);
      }
    }
  }
  return { articles, validResponse };
}
