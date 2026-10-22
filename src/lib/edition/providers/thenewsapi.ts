import type {
  NewsProviderAdapter,
  ProviderCandidate,
  FetchCandidatesOptions,
  FetchCandidatesResult,
} from "./types";
import { extractEventGeography } from "../geography";

interface TheNewsAPIRawEntry {
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

function isTheNewsApiArticle(value: unknown): value is TheNewsAPIRawEntry {
  if (typeof value !== "object" || value === null) return false;
  const article = value as Record<string, unknown>;
  return (
    typeof article.uuid === "string" &&
    article.uuid.length > 0 &&
    typeof article.title === "string" &&
    article.title.length > 0 &&
    typeof article.url === "string" &&
    /^https?:\/\//i.test(article.url) &&
    typeof article.published_at === "string" &&
    Number.isFinite(Date.parse(article.published_at)) &&
    typeof article.source === "string" &&
    article.source.length > 0 &&
    typeof article.language === "string" &&
    [article.description, article.snippet, article.image_url, article.locale].every(
      (field) => field === undefined || typeof field === "string",
    ) &&
    (article.categories === undefined ||
      (Array.isArray(article.categories) &&
        article.categories.every((cat) => typeof cat === "string")))
  );
}

export class TheNewsApiAdapter implements NewsProviderAdapter {
  readonly name = "thenewsapi";
  readonly defaultOutputUse = "evaluation_only" as const;

  constructor(
    private token: string | undefined = process.env.THENEWSAPI_TOKEN,
    private commercialUseApproved: boolean = process.env.THENEWSAPI_COMMERCIAL_APPROVED === "true",
  ) {}

  isConfigured(): boolean {
    return Boolean(this.token && this.token.trim().length > 0);
  }

  async fetchCandidates(options?: FetchCandidatesOptions): Promise<FetchCandidatesResult> {
    if (!this.isConfigured()) {
      return {
        candidates: [],
        success: false,
        error: "THENEWSAPI_TOKEN is not configured",
        providerCalls: 0,
      };
    }

    const now = options?.now || new Date();
    const groups = [
      "tech,science",
      "sports,travel",
      "business,politics",
      "health,food",
      "general,entertainment",
    ];

    const limit = String(options?.limit ?? 5);
    let providerCalls = 0;

    const results = await Promise.allSettled(
      groups.map(async (categories) => {
        providerCalls++;
        const url = new URL("https://api.thenewsapi.com/v1/news/all");
        url.search = new URLSearchParams({
          api_token: this.token!,
          language: "en",
          categories,
          limit,
        }).toString();

        const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!response.ok) {
          throw new Error(`TheNewsAPI HTTP ${response.status}: ${response.statusText}`);
        }
        const body: unknown = await response.json();
        if (
          typeof body !== "object" ||
          body === null ||
          !Array.isArray((body as { data?: unknown }).data)
        ) {
          throw new Error("Invalid response format from TheNewsAPI");
        }
        const entries = (body as { data: unknown[] }).data;
        return entries.filter(isTheNewsApiArticle);
      }),
    );

    const candidates: ProviderCandidate[] = [];
    const outputUse = this.commercialUseApproved ? "commercial" : this.defaultOutputUse;
    const seenIds = new Set<string>();
    let anySuccess = false;
    let lastError: string | undefined;

    for (const res of results) {
      if (res.status === "fulfilled") {
        anySuccess = true;
        for (const item of res.value) {
          if (seenIds.has(item.uuid)) continue;
          seenIds.add(item.uuid);

          const rawCategories = item.categories || ["general"];
          const normalizedCats = new Set(rawCategories.map((c) => c.toLowerCase()));
          if (normalizedCats.has("tech")) normalizedCats.add("technology");
          if (normalizedCats.has("technology")) normalizedCats.add("tech");

          const textForGeo = `${item.title} ${item.description || ""} ${item.snippet || ""}`;
          const { regions } = extractEventGeography(textForGeo);

          candidates.push({
            id: item.uuid,
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
            provider: this.name,
            output_use: outputUse,
            event_geography: regions,
          });
        }
      } else {
        lastError = res.reason instanceof Error ? res.reason.message : String(res.reason);
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
