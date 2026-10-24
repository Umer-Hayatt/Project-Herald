import type { SupabaseClient } from "@supabase/supabase-js";
import type { SourceArticle } from "./types";
import { filterEligibleArticles } from "./content-quality";
import { NewsProviderCoordinator } from "./providers/coordinator";

export type ReportingWriter = Pick<SupabaseClient, "rpc">;

/**
 * Retrieves the shared reporting supply.
 * Coordinates configured providers, including the optional licensed Global Voices supplement.
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
    reportingWriter?: ReportingWriter;
  },
): Promise<SourceArticle[]> {
  const now = options?.referenceDate || new Date();
  const allowEvaluationOnly = options?.allowEvaluationOnly ?? false;

  // Controlled fixtures are never persisted to shared reporting.
  if (options?.controlledSupply !== undefined) {
    if (options.controlledSupply.length === 0) return [];
    const eligibleControlled = filterEligibleArticles(options.controlledSupply, {
      now,
      maxAgeHours: 48,
      allowEvaluationOnly,
    });
    if (eligibleControlled.length === 0) return [];

    return eligibleControlled as SourceArticle[];
  }

  const maxAgeIso = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const coordinator = options?.coordinator || new NewsProviderCoordinator();
  const configuredAdapters = coordinator.getConfiguredAdapters({ publicOnly: true });

  const writer = options?.reportingWriter;
  if (writer && configuredAdapters.length > 0) {
    // The database reserves provider calls against its fixed daily budget.
    const { data: lockToken } = await writer.rpc("claim_reporting_refresh", {
      p_force_refresh: options?.forceRefresh || false,
      p_provider_calls: configuredAdapters.reduce((calls, adapter) => calls + (adapter.defaultRefreshCalls ?? 5), 0),
    });

    // A null token means a fresh cache, another active refresh, or an exhausted budget.
    if (lockToken) {
      let succeeded = false;
      try {
        const fetchRes = await coordinator.fetchAll({
          now,
          allowEvaluationOnly: false,
          publicOnly: true,
        });

        if (fetchRes.success && fetchRes.articles.length > 0) {
          // Apply unified content quality eligibility policy
          const eligibleArticles = filterEligibleArticles(fetchRes.articles, {
            now,
            maxAgeHours: 48,
            allowEvaluationOnly: false,
            requireCurrentProviderApproval: true,
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
            const { error: ingestError } = await writer.rpc("ingest_source_articles", {
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
        await writer.rpc("finish_reporting_refresh", {
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
    requireCurrentProviderApproval: !allowEvaluationOnly,
  });
}
