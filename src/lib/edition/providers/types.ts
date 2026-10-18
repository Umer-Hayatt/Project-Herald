export type OutputUse = "commercial" | "evaluation_only" | "internal_testing";

export interface ArticleProvenance {
  provider: string;
  provider_article_id?: string;
  output_use: OutputUse;
  retrieved_at: string;
  canonical_url: string;
  publisher_locale: string | null;
  event_geography: string[];
  license_notes?: string;
}

export interface ProviderCandidate {
  id: string;
  title: string;
  description: string | null;
  snippet: string | null;
  url: string;
  image_url: string | null;
  publisher: string;
  published_at: string;
  retrieved_at: string;
  language: string;
  categories: string[];
  locale: string | null; // publisher country / locale
  provider: string; // "thenewsapi" | "gnews" | "newsdata" | "controlled"
  output_use: OutputUse;
  event_geography?: string[];
  raw?: Record<string, unknown>;
}

export interface FetchCandidatesOptions {
  categories?: string[];
  limit?: number;
  now?: Date;
  query?: string;
}

export interface FetchCandidatesResult {
  candidates: ProviderCandidate[];
  success: boolean;
  error?: string;
  providerCalls: number;
}

export interface NewsProviderAdapter {
  readonly name: string;
  readonly defaultOutputUse: OutputUse;
  isConfigured(): boolean;
  fetchCandidates(options?: FetchCandidatesOptions): Promise<FetchCandidatesResult>;
}
