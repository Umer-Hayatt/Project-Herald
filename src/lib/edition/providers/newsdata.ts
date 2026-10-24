import type {
  NewsProviderAdapter,
  ProviderCandidate,
  FetchCandidatesOptions,
  FetchCandidatesResult,
} from "./types";
import { extractEventGeography } from "../geography";

interface NewsDataArticle {
  article_id: string;
  title: string;
  description?: string;
  content?: string;
  link: string;
  image_url?: string;
  source_id: string;
  source_name?: string;
  pubDate: string;
  country?: string[];
  category?: string[];
  language?: string;
}

export class NewsDataAdapter implements NewsProviderAdapter {
  readonly name = "newsdata";
  readonly defaultRefreshCalls = 4;
  readonly defaultOutputUse = "evaluation_only" as const;

  constructor(
    private apiKey: string | undefined = process.env.NEWSDATA_API_KEY,
    private commercialUseApproved: boolean = process.env.NEWSDATA_COMMERCIAL_APPROVED === "true",
  ) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async fetchCandidates(options?: FetchCandidatesOptions): Promise<FetchCandidatesResult> {
    if (!this.isConfigured()) {
      return {
        candidates: [],
        success: false,
        error: "NEWSDATA_API_KEY is not configured",
        providerCalls: 0,
      };
    }

    const now = options?.now || new Date();
    const outputUse = this.commercialUseApproved ? "commercial" : this.defaultOutputUse;
    const categories = options?.categories || ["top", "technology", "business", "science"];
    const limit = Math.min(10, options?.limit ?? 5);

    const candidates: ProviderCandidate[] = [];
    let providerCalls = 0;
    let anySuccess = false;
    let lastError: string | undefined;

    for (const category of categories) {
      providerCalls++;
      const url = new URL("https://newsdata.io/api/1/news");
      url.search = new URLSearchParams({
        apikey: this.apiKey!,
        category,
        language: "en",
        size: String(limit),
      }).toString();

      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) {
          throw new Error(`NewsData HTTP ${response.status}: ${response.statusText}`);
        }
        const data = (await response.json()) as { results?: NewsDataArticle[] };
        if (Array.isArray(data.results)) {
          anySuccess = true;
          for (const item of data.results) {
            const textForGeo = `${item.title} ${item.description || ""} ${item.content || ""}`;
            const { regions } = extractEventGeography(textForGeo);

            candidates.push({
              id: item.article_id || `nd-${Buffer.from(item.link).toString("base64url").slice(0, 32)}`,
              title: item.title,
              description: item.description || null,
              snippet: item.content ? item.content.slice(0, 250) : null,
              url: item.link,
              image_url: item.image_url || null,
              publisher: item.source_name || item.source_id,
              published_at: item.pubDate,
              retrieved_at: now.toISOString(),
              language: item.language || "en",
              categories: item.category || [category],
              locale: item.country?.[0] || null, // publisher country
              provider: this.name,
              output_use: outputUse,
              event_geography: regions,
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
