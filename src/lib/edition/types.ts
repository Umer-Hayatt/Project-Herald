export interface SourceArticle {
  id: string;
  external_id: string;
  title: string;
  description: string | null;
  snippet: string | null;
  url: string;
  image_url: string | null;
  publisher: string;
  published_at: string;
  retrieved_at?: string;
  language: string;
  categories: string[];
  locale: string | null;
  raw_data?: Record<string, unknown> | null;
}

export interface GroupedSourceArticle extends SourceArticle {
  supportingArticles: SourceArticle[];
  briefing?: string;
  whyItMatters?: string | null;
  topics?: string[];
  briefingSource?: BriefingSource;
  isUpdate?: boolean;
  updateExplanation?: string | null;
}

export type BriefingSource = "gemini" | "publisher_excerpt" | "publisher_headline";

export interface EditionStory {
  id?: string;
  edition_id?: string;
  reader_id?: string;
  position: number;
  title: string;
  excerpt: string;
  briefing?: string;
  why_it_matters?: string | null;
  topics?: string[];
  briefing_source?: BriefingSource;
  publisher: string;
  source_url: string;
  image_url?: string | null;
  published_at: string;
  category: string;
  locale: string | null;
  word_count: number;
  section: "main" | "beyond_bubble";
  source_article_id?: string | null;
  is_update?: boolean;
  update_explanation?: string | null;
  supporting_sources?: {
    id?: string;
    title: string;
    url: string;
    publisher: string;
    provider?: string;
    published_at?: string;
    source_excerpt?: string;
    is_update?: boolean;
    update_explanation?: string;
  }[];
}

export interface Edition {
  id: string;
  reader_id: string;
  edition_date: string;
  time_zone: string;
  reading_length: number;
  estimated_reading_minutes: number;
  word_count: number;
  selection_version: string;
  discovery_note?: string | null;
  status: "generating" | "completed" | "failed";
  created_at: string;
  stories: EditionStory[];
}

export interface ReaderPreferencesRecord {
  reader_id: string;
  interests: string[];
  preferred_region: string;
  reading_length: number;
  time_zone: string;
  onboarding_complete: boolean;
}
