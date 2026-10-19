import type { GroupedSourceArticle, SourceArticle, EditionStory } from "./types";

export interface SelectionPreferences {
  interests: string[];
  preferred_region: string;
  reading_length: number;
  subtopics?: string[];
}

const BUDGETS: Record<number, { maxStories: number; maxWords: number }> = {
  5: { maxStories: 4, maxWords: 1200 },
  10: { maxStories: 10, maxWords: 2800 },
  15: { maxStories: 14, maxWords: 4000 },
};
export const MAX_TOPIC_FEEDBACK_VOTES = 3;
const TOPIC_FEEDBACK_POINTS_PER_VOTE = 20;

export interface EditionSelection {
  main: GroupedSourceArticle[];
  beyondBubble: GroupedSourceArticle[];
  discoveryShortage: "no_eligible_story" | "does_not_fit" | "briefing_unavailable" | null;
}

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

import { resolveArticleGeography } from "./geography";

export function rankGroupedStories(
  articles: GroupedSourceArticle[],
  preferences: SelectionPreferences,
  referenceDate: Date,
  topicFeedback: Record<string, number>,
): GroupedSourceArticle[] {
  const normalizedInterests = new Set(preferences.interests.map((interest) => interest.toLowerCase()));
  const nowMs = referenceDate.getTime();
  const targetRegion = preferences.preferred_region?.toLowerCase();

  return articles
    .filter((article) => {
      const publishedMs = Date.parse(article.published_at);
      const ageMs = nowMs - publishedMs;
      return Number.isFinite(publishedMs) && ageMs >= -2 * 60 * 60 * 1000 && ageMs <= 48 * 60 * 60 * 1000;
    })
    .sort((left, right) => {
      const score = (article: GroupedSourceArticle) => {
        const categoryScore = article.categories.reduce(
          (sum, category) => sum + (normalizedInterests.has(category.toLowerCase()) ? 10 : 0),
          0,
        );

        let regionalScore = 0;
        if (targetRegion && targetRegion !== "global") {
          const geo = resolveArticleGeography(article);
          if (geo.eventGeography.includes(targetRegion)) {
            // Confirmed event location match receives strongest priority
            regionalScore = 10;
          } else if (geo.publisherCountry === targetRegion) {
            // Publisher origin match without event evidence receives small publisher cue
            regionalScore = 3;
          }
        }

        const ageHours = Math.max(0, (nowMs - Date.parse(article.published_at)) / 3600000);
        const freshnessScore = Math.max(0, 1 - ageHours / 48) * 5;
        const feedbackScore = article.categories.reduce(
          (sum, category) => sum + (topicFeedback[category.toLowerCase()] || 0) * TOPIC_FEEDBACK_POINTS_PER_VOTE,
          0,
        );

        const normalizedSubtopics = (preferences.subtopics || [])
          .map((st) => st.toLowerCase().trim())
          .filter(Boolean);
        let subtopicScore = 0;
        if (normalizedSubtopics.length > 0) {
          const text = [
            article.title,
            article.description,
            article.snippet,
            article.briefing,
            article.whyItMatters,
            ...(article.topics || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          for (const subtopic of normalizedSubtopics) {
            const terms = subtopic.split(/\s+/).filter(Boolean);
            const matchesPhrase = text.includes(subtopic);
            const matchesAllTerms = terms.length > 1 && terms.every((term) => text.includes(term));
            if (matchesPhrase || matchesAllTerms) {
              subtopicScore += 8;
            }
          }
        }

        return categoryScore + subtopicScore + regionalScore + freshnessScore + feedbackScore;
      };
      return score(right) - score(left) ||
        Date.parse(right.published_at) - Date.parse(left.published_at) ||
        left.title.localeCompare(right.title);
    });
}

function storyWordCount(article: GroupedSourceArticle): number {
  const text = article.briefing || article.snippet || article.description || article.title;
  return countWords(article.title) + countWords(text) + countWords(article.whyItMatters || "");
}

function hasInterestOverlap(article: GroupedSourceArticle, topics: Set<string>): boolean {
  return article.categories.some((category) => topics.has(category.toLowerCase()));
}

function namedPublisherCount(article: GroupedSourceArticle): number {
  return new Set(article.supportingArticles
    .map((source) => source.publisher.toLowerCase().trim())
    .filter((publisher) => publisher && publisher !== "news source"),
  ).size;
}

function publicImpactEvidence(article: GroupedSourceArticle): number {
  // These are first-release reporting signals, not an objective importance score.
  const text = [article.title, article.description, article.snippet]
    .filter(Boolean).join(" ").toLowerCase();
  const signals = [
    /\b(election|vote|parliament|court|law|government|minister|president)\b/,
    /\b(public health|hospital|disease|outbreak|vaccine|safety|emergency)\b/,
    /\b(economy|inflation|jobs|trade|budget|interest rate|business)\b/,
    /\b(climate|flood|wildfire|earthquake|storm|environment)\b/,
    /\b(science|research|infrastructure|energy|transport)\b/,
  ];
  return signals.reduce((total, signal) => total + Number(signal.test(text)), 0);
}

function discoveryOrder(left: GroupedSourceArticle, right: GroupedSourceArticle, referenceDate: Date): number {
  const ageHours = (article: GroupedSourceArticle) => Math.max(
    0,
    (referenceDate.getTime() - Date.parse(article.published_at)) / 3600000,
  );
  return publicImpactEvidence(right) - publicImpactEvidence(left) ||
    namedPublisherCount(right) - namedPublisherCount(left) ||
    ageHours(left) - ageHours(right) ||
    left.title.localeCompare(right.title);
}

/** Selects the personalized story cap plus up to two discovery Stories under one word budget. */
export function selectEditionStories(
  articles: GroupedSourceArticle[],
  preferences: SelectionPreferences,
  referenceDate: Date = new Date(),
  positivelyLearnedTopics: string[] = [],
  topicFeedback: Record<string, number> = {},
): EditionSelection {
  const budget = BUDGETS[preferences.reading_length] || BUDGETS[10];
  const ranked = rankGroupedStories(articles, {
    ...preferences,
    interests: [...new Set([...preferences.interests, ...positivelyLearnedTopics])],
  }, referenceDate, topicFeedback);
  const outsideTopics = new Set([
    ...preferences.interests,
    ...positivelyLearnedTopics,
    ...Object.entries(topicFeedback).filter(([, score]) => score < 0).map(([topic]) => topic),
  ].map((topic) => topic.toLowerCase()));
  const outsideInterestCandidates = ranked.filter((article) => !hasInterestOverlap(article, outsideTopics));
  const impactAndAttributionCandidates = outsideInterestCandidates.filter((article) =>
    publicImpactEvidence(article) > 0 && namedPublisherCount(article) > 0,
  );
  const discoveryPool = impactAndAttributionCandidates.length > 0
    ? impactAndAttributionCandidates
    : outsideInterestCandidates.filter((article) => namedPublisherCount(article) > 0);
  const discoveryCandidates = discoveryPool
    .filter((article) => Boolean(article.whyItMatters))
    .sort((left, right) => discoveryOrder(left, right, referenceDate));
  const beyondBubble: GroupedSourceArticle[] = [];
  let usedWords = 0;
  for (const candidate of discoveryCandidates) {
    if (beyondBubble.length >= 2) break;
    const words = storyWordCount(candidate);
    if (usedWords + words > budget.maxWords) continue;
    beyondBubble.push(candidate);
    usedWords += words;
  }

  const selectedIds = new Set(beyondBubble.map((article) => article.id || article.external_id));
  const mainCandidates = ranked.filter(
    (article) => !selectedIds.has(article.id || article.external_id),
  );
  const main: GroupedSourceArticle[] = [];
  for (const candidate of mainCandidates) {
    if (main.length >= budget.maxStories) break;
    const words = storyWordCount(candidate);
    if (usedWords + words > budget.maxWords) continue;
    main.push(candidate);
    usedWords += words;
  }

  const discoveryShortage = beyondBubble.length >= 2
    ? null
    : discoveryCandidates.length === 0
      ? discoveryPool.length === 0
        ? "no_eligible_story"
        : "briefing_unavailable"
      : beyondBubble.length >= discoveryCandidates.length
        ? discoveryPool.length > discoveryCandidates.length
          ? "briefing_unavailable"
          : null
        : "does_not_fit";

  return {
    main,
    beyondBubble,
    discoveryShortage,
  };
}

/**
 * Converts selected source articles into EditionStories with positions and word counts.
 */
export function buildEditionStories(
  articles: GroupedSourceArticle[],
  section: "main" | "beyond_bubble" = "main",
  startingPosition = 1,
): Omit<EditionStory, "edition_id" | "reader_id">[] {
  return articles.map((article, index) => {
    const excerpt = (article.briefing || article.snippet || article.description || article.title).trim();
    const wordCount = countWords(article.title) + countWords(excerpt) +
      countWords(article.whyItMatters || "");
    const category = article.topics?.[0] || article.categories[0] || "general";
    const supportingArticles = article.supportingArticles.length
      ? article.supportingArticles
      : [article];

    const isValidUuid = (val?: string | null) =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    return {
      position: startingPosition + index,
      title: article.title,
      excerpt,
      briefing: excerpt,
      why_it_matters: article.whyItMatters || null,
      topics: article.topics || article.categories,
      briefing_source: article.briefingSource || "publisher_excerpt",
      publisher: article.publisher,
      source_url: article.url,
      image_url: article.image_url || null,
      published_at: article.published_at,
      category,
      locale: article.locale,
      word_count: wordCount,
      section,
      source_article_id: isValidUuid(article.id) ? article.id : null,
      supporting_sources: supportingArticles.map((source) => ({
        id: source.id || source.external_id,
        title: source.title,
        url: source.url,
        publisher: source.publisher,
        provider:
          (source.raw_data as { provider?: string } | undefined)?.provider ||
          (source as { provider?: string }).provider ||
          "thenewsapi",
      })),
    };
  });
}
