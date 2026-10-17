import type { SupabaseClient } from "@supabase/supabase-js";
import type { SourceArticle } from "./types";

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

const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes cache window
const MAX_DAILY_REQUESTS = 25; // Guard well below the 100/day free limit

/**
 * Retrieves the shared reporting supply.
 * Reuses server-cached articles within 60 minutes to protect provider rate limits.
 */
export async function getReportingSupply(
  supabase: SupabaseClient,
  options?: {
    forceRefresh?: boolean;
    controlledSupply?: SourceArticle[];
    referenceDate?: Date;
  },
): Promise<SourceArticle[]> {
  // If controlled supply is supplied (for tests/fixtures), persist it so foreign keys are valid
  if (options?.controlledSupply && options.controlledSupply.length > 0) {
    const records = options.controlledSupply.map((s) => ({
      id: s.id,
      external_id: s.external_id,
      title: s.title,
      description: s.description || null,
      snippet: s.snippet || null,
      url: s.url,
      image_url: s.image_url || null,
      publisher: s.publisher,
      published_at: s.published_at,
      retrieved_at: s.retrieved_at || (options?.referenceDate || new Date()).toISOString(),
      language: s.language || "en",
      categories: s.categories || ["general"],
      locale: s.locale || null,
    }));
    const { data } = await supabase
      .from("source_articles")
      .upsert(records, { onConflict: "external_id" })
      .select();
    return (data || options.controlledSupply) as SourceArticle[];
  }

  const now = options?.referenceDate || new Date();
  const todayDateStr = now.toISOString().slice(0, 10);
  const maxAgeIso = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  // 1. Check reporting cache metadata
  let shouldFetchLive = false;
  const token = process.env.THENEWSAPI_TOKEN;

  if (token) {
    const { data: cacheMeta } = await supabase
      .from("reporting_cache_meta")
      .select("*")
      .eq("id", "news_supply")
      .maybeSingle();

    if (!cacheMeta) {
      shouldFetchLive = true;
    } else {
      const isDifferentDay = cacheMeta.day_date !== todayDateStr;
      const requestCount = isDifferentDay ? 0 : cacheMeta.daily_request_count;
      const lastFetchedMs = new Date(cacheMeta.last_fetched_at).getTime();
      const isStale = now.getTime() - lastFetchedMs > CACHE_TTL_MS;

      if ((isStale || options?.forceRefresh) && requestCount < MAX_DAILY_REQUESTS) {
        shouldFetchLive = true;
      }
    }
  }

  // 2. Fetch live if required and permitted
  if (shouldFetchLive && token) {
    try {
      const fetchedArticles = await fetchNewsFromProvider(token);
      if (fetchedArticles.length > 0) {
        // Upsert into public.source_articles
        const recordsToInsert = fetchedArticles.map((item) => ({
          external_id: item.uuid,
          title: item.title,
          description: item.description || null,
          snippet: item.snippet || null,
          url: item.url,
          image_url: item.image_url || null,
          publisher: item.source || "News Source",
          published_at: item.published_at,
          retrieved_at: now.toISOString(),
          language: item.language || "en",
          categories: Array.isArray(item.categories) ? item.categories : ["general"],
          locale: item.locale || null,
        }));

        await supabase
          .from("source_articles")
          .upsert(recordsToInsert, { onConflict: "external_id" });

        // Update cache metadata
        const { data: existingMeta } = await supabase
          .from("reporting_cache_meta")
          .select("*")
          .eq("id", "news_supply")
          .maybeSingle();

        const isNewDay = !existingMeta || existingMeta.day_date !== todayDateStr;
        const currentCount = isNewDay ? 1 : existingMeta.daily_request_count + 1;

        await supabase.from("reporting_cache_meta").upsert({
          id: "news_supply",
          last_fetched_at: now.toISOString(),
          daily_request_count: currentCount,
          day_date: todayDateStr,
          is_fetching: false,
        });
      }
    } catch {
      // If live retrieval fails, we fall back gracefully to already stored supply
    }
  }

  // 3. Query all fresh source articles from database
  const { data: cachedArticles } = await supabase
    .from("source_articles")
    .select("*")
    .gte("published_at", maxAgeIso)
    .order("published_at", { ascending: false });

  return (cachedArticles || []) as SourceArticle[];
}

async function fetchNewsFromProvider(token: string): Promise<TheNewsAPIArticle[]> {
  const url = new URL("https://api.thenewsapi.com/v1/news/all");
  url.search = new URLSearchParams({
    api_token: token,
    language: "en",
    limit: "3",
  }).toString();

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) return [];

  const body = await response.json();
  if (Array.isArray(body?.data)) {
    return body.data as TheNewsAPIArticle[];
  }
  return [];
}
