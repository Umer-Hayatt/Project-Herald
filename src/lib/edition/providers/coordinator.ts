import type {
  NewsProviderAdapter,
  ProviderCandidate,
  FetchCandidatesOptions,
} from "./types";
import type { SourceArticle } from "../types";
import { TheNewsApiAdapter } from "./thenewsapi";
import { GNewsAdapter } from "./gnews";
import { NewsDataAdapter } from "./newsdata";
import { GlobalVoicesAdapter } from "./globalvoices";
import { NasaEarthAdapter } from "./nasa-earth";
import { canonicalizeSourceUrl } from "../grouping";
import { parseSourceAttribution } from "../source-attribution";
import { hasCurrentProviderApproval } from "../content-quality";

export interface CoordinatorFetchResult {
  articles: SourceArticle[];
  success: boolean;
  errors: { provider: string; message: string }[];
  providerCalls: number;
  providerCounts: Record<string, number>;
}

export class NewsProviderCoordinator {
  private adapters: NewsProviderAdapter[];

  constructor(adapters?: NewsProviderAdapter[]) {
    this.adapters = adapters || [
      new TheNewsApiAdapter(),
      new GNewsAdapter(),
      new NewsDataAdapter(),
      new GlobalVoicesAdapter(),
      new NasaEarthAdapter(),
    ];
  }

  getAdapters(): NewsProviderAdapter[] {
    return [...this.adapters];
  }

  getConfiguredAdapters(options?: { publicOnly?: boolean }): NewsProviderAdapter[] {
    return this.adapters.filter((a) => a.isConfigured() &&
      (!options?.publicOnly || hasCurrentProviderApproval(a.name)));
  }

  registerAdapter(adapter: NewsProviderAdapter) {
    this.adapters = this.adapters.filter((a) => a.name !== adapter.name);
    this.adapters.push(adapter);
  }

  async fetchAll(options?: FetchCandidatesOptions & {
    allowEvaluationOnly?: boolean;
    publicOnly?: boolean;
  }): Promise<CoordinatorFetchResult> {
    const active = this.getConfiguredAdapters(options);
    if (active.length === 0) {
      return {
        articles: [],
        success: false,
        errors: [{ provider: "coordinator", message: "No news providers are configured" }],
        providerCalls: 0,
        providerCounts: {},
      };
    }

    const errors: { provider: string; message: string }[] = [];
    let totalCalls = 0;
    const providerCounts: Record<string, number> = {};

    const results = await Promise.allSettled(
      active.map(async (adapter) => {
        try {
          const res = await adapter.fetchCandidates(options);
          return { provider: adapter.name, res };
        } catch (err) {
          throw {
            provider: adapter.name,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }),
    );

    const allCandidates: ProviderCandidate[] = [];

    for (const item of results) {
      if (item.status === "fulfilled") {
        const { provider, res } = item.value;
        totalCalls += res.providerCalls;
        if (!res.success && res.error) {
          errors.push({ provider, message: res.error });
        }
        if (res.candidates.length > 0) {
          providerCounts[provider] = (providerCounts[provider] || 0) + res.candidates.length;
          allCandidates.push(...res.candidates);
        }
      } else {
        const failure = item.reason as { provider?: string; error?: string };
        errors.push({
          provider: failure.provider || "unknown",
          message: failure.error || "Provider call failed",
        });
      }
    }

    // Graceful failure: As long as any provider returned candidates, the fetch is a success
    const overallSuccess = allCandidates.length > 0;

    // Deduplicate identical canonical URLs across providers
    const dedupedByCanonicalUrl = new Map<string, ProviderCandidate>();

    for (const candidate of allCandidates) {
      const canonical = canonicalizeSourceUrl(candidate.url) || candidate.url;
      const existing = dedupedByCanonicalUrl.get(canonical);

      if (!existing) {
        dedupedByCanonicalUrl.set(canonical, candidate);
      } else {
        // If one is commercial and other is evaluation_only, keep commercial
        // If content depth is better, keep the richer text
        const existingLen = (existing.snippet || existing.description || "").length;
        const candidateLen = (candidate.snippet || candidate.description || "").length;

        if (
          (existing.output_use === "evaluation_only" && candidate.output_use === "commercial") ||
          (existing.output_use === candidate.output_use && candidateLen > existingLen)
        ) {
          dedupedByCanonicalUrl.set(canonical, candidate);
        }
      }
    }

    const nowIso = (options?.now || new Date()).toISOString();

    // Map to SourceArticle with full provenance
    const articles: SourceArticle[] = Array.from(dedupedByCanonicalUrl.values()).map(
      (c) => ({
        id: c.id,
        external_id: c.id,
        title: c.title,
        description: c.description,
        snippet: c.snippet,
        url: c.url,
        image_url: c.image_url,
        publisher: c.publisher,
        published_at: c.published_at,
        retrieved_at: c.retrieved_at || nowIso,
        language: c.language,
        categories: c.categories,
        locale: c.locale,
        raw_data: {
          provider: c.provider,
          provider_article_id: c.id,
          output_use: c.output_use,
          retrieved_at: c.retrieved_at || nowIso,
          canonical_url: canonicalizeSourceUrl(c.url) || c.url,
          publisher_locale: c.locale,
          event_geography: c.event_geography || [],
          source_attribution: parseSourceAttribution(c.raw?.source_attribution),
        },
      }),
    );

    return {
      articles,
      success: overallSuccess,
      errors,
      providerCalls: totalCalls,
      providerCounts,
    };
  }
}
