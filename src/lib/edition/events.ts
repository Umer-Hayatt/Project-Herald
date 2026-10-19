import { canonicalizeSourceUrl, hasSharedEventEvidence, sameEventTitle } from "./grouping";
import type { GroupedSourceArticle, SourceArticle } from "./types";

export interface RecentIncludedEvent {
  title: string;
  sourceUrl: string;
  category: string;
  publishedAt: string;
  editionDate?: string;
  briefing?: string;
  whyItMatters?: string | null;
  supportingUrls?: string[];
}

export type EventInclusionStatus = "fresh" | "unchanged_repeat" | "update";

export interface EventEvaluationResult {
  status: EventInclusionStatus;
  matchedEvent?: RecentIncludedEvent;
  updateExplanation?: string;
}

const UPDATE_MARKERS = /\b(update|updates|updated|developing|progress|advances|confirms|statement|reaches agreement|announces next steps|outcome|aftermath|resolution|passes|approved|vetoed|ruling|verdict|latest)\b/i;

/**
 * Determines whether a candidate story represents the same real-world event
 * as a story from a recent edition, across alternate providers and syndication.
 */
export function isSameEvent(
  candidate: GroupedSourceArticle | SourceArticle,
  past: RecentIncludedEvent,
): boolean {
  // 1. Direct canonical URL match or supporting URL overlap
  const candidateUrl = canonicalizeSourceUrl(candidate.url);
  const pastUrl = canonicalizeSourceUrl(past.sourceUrl);
  if (candidateUrl && pastUrl && candidateUrl === pastUrl) {
    return true;
  }

  const pastUrls = new Set([
    pastUrl,
    ...(past.supportingUrls || []).map(canonicalizeSourceUrl).filter(Boolean),
  ]);

  if (candidateUrl && pastUrls.has(candidateUrl)) {
    return true;
  }

  const candidateSupporting = "supportingArticles" in candidate
    ? candidate.supportingArticles
    : [];

  for (const supp of candidateSupporting) {
    const suppUrl = canonicalizeSourceUrl(supp.url);
    if (suppUrl && pastUrls.has(suppUrl)) {
      return true;
    }
  }

  // 2. Cross-provider same-event title and entity evidence check
  if (sameEventTitle(candidate.title, past.title)) {
    const pastAsArticle: SourceArticle = {
      id: "past-ref",
      external_id: "past-ref",
      title: past.title,
      description: past.briefing || null,
      snippet: past.whyItMatters || null,
      url: past.sourceUrl,
      image_url: null,
      publisher: "Previous Edition",
      published_at: past.publishedAt,
      language: "en",
      categories: [past.category],
      locale: null,
    };

    if (hasSharedEventEvidence(candidate, pastAsArticle)) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates whether an ongoing event report contains materially new,
 * source-supported developments (making it eligible as an update) or is an unchanged repeat.
 */
export function detectEventUpdate(
  candidate: GroupedSourceArticle | SourceArticle,
  past: RecentIncludedEvent,
): { isUpdate: boolean; explanation?: string } {
  const combinedCandidateText = [
    candidate.title,
    candidate.description,
    candidate.snippet,
    "briefing" in candidate ? candidate.briefing : null,
  ]
    .filter(Boolean)
    .join(" ");

  // Check for explicit update markers in candidate reporting
  const hasUpdateMarker = UPDATE_MARKERS.test(combinedCandidateText) ||
    /^(\[?update\]?|developing|follow-up):/i.test(candidate.title);

  const candidatePubTime = Date.parse(candidate.published_at);
  const pastPubTime = Date.parse(past.publishedAt);
  const hasTimeProgression = Number.isFinite(candidatePubTime) &&
    Number.isFinite(pastPubTime) &&
    candidatePubTime - pastPubTime > 8 * 3600 * 1000;

  if (hasUpdateMarker || hasTimeProgression) {
    // Generate honest, grounded update explanation referencing previous coverage
    const explanation = `Updates previous coverage on "${past.title}" with new developments.`;
    return { isUpdate: true, explanation };
  }

  return { isUpdate: false };
}

/**
 * Evaluates candidate story against the reader's bounded recent-inclusion history.
 */
export function evaluateRecentInclusion(
  candidate: GroupedSourceArticle,
  recentInclusions: RecentIncludedEvent[],
): EventEvaluationResult {
  for (const past of recentInclusions) {
    if (isSameEvent(candidate, past)) {
      const updateCheck = detectEventUpdate(candidate, past);
      if (updateCheck.isUpdate) {
        return {
          status: "update",
          matchedEvent: past,
          updateExplanation: updateCheck.explanation,
        };
      }
      return {
        status: "unchanged_repeat",
        matchedEvent: past,
      };
    }
  }

  return { status: "fresh" };
}
