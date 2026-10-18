import type { SupabaseClient } from "@supabase/supabase-js";
import type { SourceArticle } from "./types";
import { filterEligibleArticles } from "./content-quality";
import { NewsProviderCoordinator } from "./providers/coordinator";

/**
 * Retrieves the shared reporting supply.
 * Coordinates multi-provider ingestion (TheNewsAPI baseline, optional GNews / NewsData evaluation complements).
 * Reuses server-cached articles within 60 minutes to protect provider rate limits.
 * All articles pass the common content-quality eligibility policy before ingestion
 * and before selection. Evaluation-only material is segregated from production output.
 */
export async function getReportingSupply(
  supabase: SupabaseClient,
  options?: {
    forceRefresh?: boolean;
    controlledSupply?: SourceArticle[];
    referenceDate?: Date;
    coordinator?: NewsProviderCoordinator;
    allowEvaluationOnly?: boolean;
  },
): Promise<SourceArticle[]> {
  const now = options?.referenceDate || new Date();
  const allowEvaluationOnly = options?.allowEvaluationOnly ?? false;

  // If controlled supply is supplied (for tests/fixtures), filter and ingest via trusted RPC
  if (options?.controlledSupply !== undefined) {
    if (options.controlledSupply.length === 0) return [];
    const eligibleControlled = filterEligibleArticles(options.controlledSupply, {
      now,
      maxAgeHours: 48,
      allowEvaluationOnly,
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
      raw_data: s.raw_data || {
        provider: (s as { provider?: string }).provider || "controlled",
        output_use: (s as { output_use?: string }).output_use || "commercial",
      },
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
  const coordinator = options?.coordinator || new NewsProviderCoordinator();
  const configuredAdapters = coordinator.getConfiguredAdapters();

  if (configuredAdapters.length > 0) {
    // The database reserves provider calls against its fixed daily budget.
    const { data: lockToken } = await supabase.rpc("claim_reporting_refresh", {
      p_force_refresh: options?.forceRefresh || false,
      p_provider_calls: 5,
    });

    // A null token means a fresh cache, another active refresh, or an exhausted budget.
    if (lockToken) {
      let succeeded = false;
      try {
        const fetchRes = await coordinator.fetchAll({
          now,
          allowEvaluationOnly: false,
        });

        if (fetchRes.success && fetchRes.articles.length > 0) {
          // Apply unified content quality eligibility policy
          const eligibleArticles = filterEligibleArticles(fetchRes.articles, {
            now,
            maxAgeHours: 48,
            allowEvaluationOnly: false,
          });

          if (eligibleArticles.length > 0) {
            const records = eligibleArticles.map((item) => ({
              external_id: item.external_id,
              title: item.title,
              description: item.description,
              snippet: item.snippet,
              url: item.url,
              image_url: item.image_url,
              publisher: item.publisher,
              published_at: item.published_at,
              retrieved_at: item.retrieved_at || now.toISOString(),
              language: item.language || "en",
              categories: item.categories,
              locale: item.locale,
              raw_data: item.raw_data || null,
            }));

            // Write strictly via trusted ingestion RPC
            const { error: ingestError } = await supabase.rpc("ingest_source_articles", {
              p_lock_token: lockToken,
              p_articles: records,
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
  return filterEligibleArticles(rawCached, {
    now,
    maxAgeHours: 48,
    allowEvaluationOnly,
  });
}
