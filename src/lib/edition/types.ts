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

export interface EditionStory {
  id?: string;
  edition_id?: string;
  reader_id?: string;
  position: number;
  title: string;
  excerpt: string;
  publisher: string;
  source_url: string;
  published_at: string;
  category: string;
  locale: string | null;
  word_count: number;
  section: "main" | "beyond_bubble";
  source_article_id?: string | null;
  supporting_sources?: { title: string; url: string; publisher: string }[];
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
