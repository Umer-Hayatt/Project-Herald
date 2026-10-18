import type {
  NewsProviderAdapter,
  ProviderCandidate,
  FetchCandidatesOptions,
  FetchCandidatesResult,
} from "./types";
import { extractEventGeography } from "../geography";

interface GNewsArticle {
  title: string;
  description?: string;
  content?: string;
  url: string;
  image?: string;
  publishedAt: string;
  source: {
    name: string;
    url?: string;
  };
}

export class GNewsAdapter implements NewsProviderAdapter {
  readonly name = "gnews";
  readonly defaultOutputUse = "evaluation_only" as const;

  constructor(
    private apiKey: string | undefined = process.env.GNEWS_API_KEY,
    private commercialUseApproved: boolean = Boolean(process.env.GNEWS_COMMERCIAL_APPROVED),
  ) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async fetchCandidates(options?: FetchCandidatesOptions): Promise<FetchCandidatesResult> {
    if (!this.isConfigured()) {
      return {
        candidates: [],
        success: false,
        error: "GNEWS_API_KEY is not configured",
        providerCalls: 0,
      };
    }

    const now = options?.now || new Date();
    const outputUse = this.commercialUseApproved ? "commercial" : this.defaultOutputUse;
    const categories = options?.categories || ["general", "technology", "business", "science"];
    const limit = Math.min(10, options?.limit ?? 5);

    const candidates: ProviderCandidate[] = [];
    let providerCalls = 0;
    let anySuccess = false;
    let lastError: string | undefined;

    for (const category of categories) {
      providerCalls++;
      const url = new URL("https://gnews.io/api/v4/top-headlines");
      url.search = new URLSearchParams({
        apikey: this.apiKey!,
        category,
        lang: "en",
        max: String(limit),
      }).toString();

      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) {
          throw new Error(`GNews HTTP ${response.status}: ${response.statusText}`);
        }
        const data = (await response.json()) as { articles?: GNewsArticle[] };
        if (Array.isArray(data.articles)) {
          anySuccess = true;
          for (const item of data.articles) {
            const textForGeo = `${item.title} ${item.description || ""} ${item.content || ""}`;
            const { regions } = extractEventGeography(textForGeo);

            candidates.push({
              id: `gnews-${Buffer.from(item.url).toString("base64url").slice(0, 32)}`,
              title: item.title,
              description: item.description || null,
              snippet: item.content ? item.content.slice(0, 250) : null,
              url: item.url,
              image_url: item.image || null,
              publisher: item.source.name,
              published_at: item.publishedAt,
              retrieved_at: now.toISOString(),
              language: "en",
              categories: [category],
              locale: null, // GNews does not distinguish publisher location from event location reliably on free tier
              provider: this.name,
              output_use: outputUse,
              event_geography: regions,
              raw: { gnews_source_url: item.source.url },
            });
          }
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    return {
      candidates,
      success: anySuccess,
      error: candidates.length === 0 ? lastError : undefined,
      providerCalls,
    };
  }
}
