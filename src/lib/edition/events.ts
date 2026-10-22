import { canonicalizeSourceUrl, hasSharedEventEvidence, sameEventTitle } from "./grouping";
import type { EditionStory, GroupedSourceArticle, SourceArticle } from "./types";

export interface RecentIncludedEvent {
  title: string;
  sourceUrl: string;
  category: string;
  publishedAt: string;
  editionDate?: string;
  briefing?: string;
  whyItMatters?: string | null;
  supportingUrls?: string[];
  sourceReports?: { url: string; publishedAt: string; text: string }[];
}

export type EventInclusionStatus = "fresh" | "unchanged_repeat" | "update";

export interface EventEvaluationResult {
  status: EventInclusionStatus;
  matchedEvent?: RecentIncludedEvent;
  updateExplanation?: string;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  proposed: ["approved", "rejected"],
  scheduled: ["cancelled", "launched", "opened"],
  opened: ["closed"],
};

/** Preserve publisher text separately from generated Briefings for later comparison. */
export function publisherExcerpt(source: SourceArticle): string {
  return [source.description, source.snippet].filter(Boolean).join("\n").slice(0, 2100);
}

function decisionClaims(text: string) {
  return text.split(/(?<=[.!?])\s+|\n+/).flatMap((quote) => {
    const sentence = quote.trim().replace(/\s+/g, " ");
    const normalized = sentence.toLowerCase().replace(/[.!?]+$/, "");
    // Uncertain, conditional and negated language cannot establish an outcome.
    if (/\b(not|never|no|none|neither|zero|could|may|might|would|should|if|unless|expected|reportedly|allegedly|denied|denies|whether)\b|n['’]t\b/.test(normalized)) return [];
    const matches = [...normalized.matchAll(/\b(proposed|approved|rejected|scheduled|cancelled|launched|opened|closed)\b/g)];
    if (matches.length !== 1) return [];
    const match = matches[0];
    // Accept a direct assertion by a named institution, not arbitrary prose
    // such as "discussed whether it approved" or an embedded question.
    const subjectText = sentence.slice(0, match.index).trim();
    if (!/^(?:[Tt]he\s+)?[A-Z][\p{L}-]*(?:\s+(?:[A-Z][\p{L}-]*|of|the|and)){1,7}(?:\s+(?:has|have|had))?$/u.test(subjectText) || /\?/.test(quote)) return [];
    const subject = normalized.slice(0, match.index).trim().replace(/\s+(has|have|had)$/, "");
    const object = normalized.slice(match.index! + match[0].length).trim();
    if (subject.split(" ").length < 3 || object.split(" ").length < 4) return [];
    return [{ quote: quote.trim(), status: match[0], frame: `${subject} <decision> ${object}` }];
  });
}

/** Update metadata is stored inside the preserved source list, not table columns. */
export function restoreStoryUpdate(story: EditionStory): EditionStory {
  const source = story.supporting_sources?.find(source =>
    source?.is_update === true && typeof source.update_explanation === "string" && source.update_explanation.length > 0);
  return { ...story, is_update: Boolean(source), update_explanation: source?.update_explanation || null };
}

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
  deliveredHistory: RecentIncludedEvent[] = [past],
): { isUpdate: boolean; explanation?: string } {
  // Original group members retain their own dates; the representative's date
  // may be the newest date of a different member of the same group.
  const members = "supportingArticles" in candidate && candidate.supportingArticles.some(source => source.id === candidate.id)
    ? candidate.supportingArticles : [candidate];
  const deliveredClaims = deliveredHistory.flatMap(event =>
    (event.sourceReports || []).flatMap(report => decisionClaims(report.text)));
  for (const source of members) {
    const sourceUrl = canonicalizeSourceUrl(source.url);
    const previous = deliveredHistory.flatMap(event => event.sourceReports || [])
      .filter(report => sourceUrl && canonicalizeSourceUrl(report.url) === sourceUrl)
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
    if (!previous || !(Date.parse(source.published_at) > Date.parse(previous.publishedAt))) continue;
    const oldClaims = decisionClaims(previous.text);
    for (const current of decisionClaims(publisherExcerpt(source))) {
      if (deliveredClaims.some(claim => claim.frame === current.frame && claim.status === current.status)) continue;
      const old = oldClaims.find(claim => claim.frame === current.frame && STATUS_TRANSITIONS[claim.status]?.includes(current.status));
      if (old) {
        return { isUpdate: true, explanation: `New source reporting: ${current.quote} Previously reported: ${old.quote}` };
      }
    }
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
  // Compare with the latest delivered version, not an older phase of the event.
  const matches = recentInclusions.filter(past => isSameEvent(candidate, past)).sort((a, b) =>
    (b.editionDate || "").localeCompare(a.editionDate || "") || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const past = matches[0];
  if (!past) return { status: "fresh" };
  const updateCheck = detectEventUpdate(candidate, past, matches);
  return {
    status: updateCheck.isUpdate ? "update" : "unchanged_repeat",
    matchedEvent: past,
    updateExplanation: updateCheck.explanation,
  };
}
