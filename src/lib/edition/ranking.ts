import type { SourceArticle, EditionStory } from "./types";

export interface SelectionPreferences {
  interests: string[];
  preferred_region: string;
  reading_length: number;
}

const BUDGETS: Record<number, { maxStories: number; maxWords: number }> = {
  5: { maxStories: 4, maxWords: 1000 },
  10: { maxStories: 8, maxWords: 2000 },
  15: { maxStories: 12, maxWords: 3000 },
};

/**
 * Calculates honest reading time estimate in minutes based on 200 words/min.
 * Minimum is 1 minute.
 */
export function estimateReadingTime(totalWords: number): number {
  if (totalWords <= 0) return 1;
  return Math.max(1, Math.round(totalWords / 200));
}

/**
 * Counts words in a string.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Filters, scores, ranks and budgets source articles into an ordered list of stories.
 */
export function selectAndRankStories(
  articles: SourceArticle[],
  preferences: SelectionPreferences,
  referenceDate: Date = new Date(),
): SourceArticle[] {
  const budget = BUDGETS[preferences.reading_length] || BUDGETS[10];
  const nowMs = referenceDate.getTime();
  const maxAgeMs = 48 * 60 * 60 * 1000; // 48 hours

  // 1. Filter articles by freshness (within 48 hours)
  const freshArticles = articles.filter((article) => {
    const pubMs = new Date(article.published_at).getTime();
    if (isNaN(pubMs)) return false;
    const ageMs = nowMs - pubMs;
    // Allow small future clock skew (up to 2h) or within maxAgeMs in the past
    return ageMs >= -2 * 60 * 60 * 1000 && ageMs <= maxAgeMs;
  });

  // 2. Score articles
  const scored = freshArticles.map((article) => {
    let score = 0;

    // A. Interest category match (+10 per matching category)
    const normalizedInterests = new Set(
      preferences.interests.map((i) => i.toLowerCase()),
    );
    for (const cat of article.categories || []) {
      if (normalizedInterests.has(cat.toLowerCase())) {
        score += 10;
      }
    }

    // B. Regional preference boost (+5 for matching region)
    // Global articles or null locale remain eligible
    if (
      preferences.preferred_region &&
      preferences.preferred_region.toLowerCase() !== "global"
    ) {
      if (
        article.locale &&
        article.locale.toLowerCase() ===
          preferences.preferred_region.toLowerCase()
      ) {
        score += 5;
      }
    }

    // C. Freshness boost (up to +5 points for recency)
    const pubMs = new Date(article.published_at).getTime();
    const ageHours = Math.max(0, (nowMs - pubMs) / (60 * 60 * 1000));
    const freshnessFactor = Math.max(0, 1 - ageHours / 48);
    score += freshnessFactor * 5;

    return { article, score };
  });

  // 3. Deterministic sort: higher score first, then newest, then title
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeDiff =
      new Date(b.article.published_at).getTime() -
      new Date(a.article.published_at).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.article.title.localeCompare(b.article.title);
  });

  // 4. Budget constraints: max stories and max words
  const selected: SourceArticle[] = [];
  let accumulatedWords = 0;

  for (const { article } of scored) {
    if (selected.length >= budget.maxStories) break;

    const excerpt = article.snippet || article.description || article.title;
    const wordCount = countWords(article.title) + countWords(excerpt);

    // If adding this exceeds word budget and we already have at least 1 story, stop
    if (
      selected.length > 0 &&
      accumulatedWords + wordCount > budget.maxWords
    ) {
      break;
    }

    selected.push(article);
    accumulatedWords += wordCount;
  }

  return selected;
}

/**
 * Converts selected source articles into EditionStories with positions and word counts.
 */
export function buildEditionStories(
  articles: SourceArticle[],
): Omit<EditionStory, "edition_id" | "reader_id">[] {
  return articles.map((article, index) => {
    const excerpt = (article.snippet || article.description || article.title).trim();
    const wordCount = countWords(article.title) + countWords(excerpt);
    const category = article.categories[0] || "general";

    return {
      position: index + 1,
      title: article.title,
      excerpt,
      publisher: article.publisher,
      source_url: article.url,
      published_at: article.published_at,
      category,
      locale: article.locale,
      word_count: wordCount,
      section: "main",
      source_article_id: article.id || null,
      supporting_sources: [],
    };
  });
}
