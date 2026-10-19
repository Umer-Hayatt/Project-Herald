import type { SupabaseClient } from "@supabase/supabase-js";
import { getReaderLocalDate } from "./date";
import { getReportingSupply } from "./news-supply";
import { groupSourceArticles } from "./grouping";
import { processGroupedStories } from "./story-processing";
import {
  buildEditionStories,
  estimateReadingTime,
  MAX_TOPIC_FEEDBACK_VOTES,
  selectEditionStories,
} from "./ranking";
import type { Edition, EditionStory, SourceArticle, ReaderPreferencesRecord, GroupedSourceArticle } from "./types";

export type EditionResult =
  | {
      success: true;
      edition: Edition;
      isNew: boolean;
      isFallback?: boolean;
      preferredRegion: string;
      readingLength: number;
    }
  | { success: false; error: "NOT_ONBOARDED" | "NO_REPORTING" | "UNAUTHENTICATED" | "SERVER_ERROR" };

async function loadEditionStories(
  supabase: SupabaseClient,
  editionId: string,
  readerId: string,
): Promise<EditionStory[] | null> {
  const { data, error } = await supabase
    .from("edition_stories")
    .select("*")
    .eq("edition_id", editionId)
    .eq("reader_id", readerId)
    .order("position", { ascending: true });
  return error || !data ? null : data as EditionStory[];
}

async function loadLatestSavedEdition(
  supabase: SupabaseClient,
  readerId: string,
): Promise<Edition | null> {
  const { data, error } = await supabase
    .from("editions")
    .select("*")
    .eq("reader_id", readerId)
    .eq("status", "completed")
    .order("edition_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const stories = await loadEditionStories(supabase, data.id, readerId);
  if (!stories?.length) return null;
  return { ...data, stories } as Edition;
}

async function loadTopicFeedback(
  supabase: SupabaseClient,
  readerId: string,
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("story_feedback")
    .select("feedback,topics")
    .eq("reader_id", readerId);
  if (error || !data) return {};

  const scores: Record<string, number> = {};
  for (const entry of data) {
    const amount = entry.feedback === "more" ? 1 : -1;
    for (const topic of entry.topics || []) {
      const normalized = String(topic).toLowerCase();
      scores[normalized] = (scores[normalized] || 0) + amount;
    }
  }
  for (const [topic, score] of Object.entries(scores)) {
    scores[topic] = Math.max(-MAX_TOPIC_FEEDBACK_VOTES, Math.min(MAX_TOPIC_FEEDBACK_VOTES, score));
  }
  return scores;
}

/**
 * Gets the reader's preserved Edition for today, or generates and saves a new one atomically.
 */
export async function getOrCreateDailyEdition(
  supabase: SupabaseClient,
  readerId: string,
  options?: {
    controlledDate?: string;
    referenceDate?: Date;
    controlledSupply?: SourceArticle[];
    positivelyLearnedTopics?: string[];
    controlledTopicFeedback?: Record<string, number>;
    controlledSubtopics?: string[];
    forceRefresh?: boolean;
  },
): Promise<EditionResult> {
  if (!readerId) {
    return { success: false, error: "UNAUTHENTICATED" };
  }

  // 1. Fetch reader preferences
  const { data: preferences, error: prefError } = await supabase
    .from("reader_preferences")
    .select("*")
    .eq("reader_id", readerId)
    .maybeSingle();

  if (prefError || !preferences) {
    return { success: false, error: "NOT_ONBOARDED" };
  }

  let subtopics: string[] = options?.controlledSubtopics || [];
  if (!options?.controlledSubtopics) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (
        userData.user &&
        userData.user.id === readerId &&
        Array.isArray(userData.user.user_metadata?.subtopics)
      ) {
        subtopics = userData.user.user_metadata.subtopics;
      }
    } catch {
      // fallback gracefully
    }
  }

  const prefs = preferences as ReaderPreferencesRecord;
  if (!prefs.onboarding_complete) {
    return { success: false, error: "NOT_ONBOARDED" };
  }

  // 2. Determine local calendar date
  const now = options?.referenceDate || new Date();
  const localDate = options?.controlledDate || getReaderLocalDate(prefs.time_zone, now);

  // 3. Check for existing preserved Edition
  const { data: existingEdition } = await supabase
    .from("editions")
    .select("*")
    .eq("reader_id", readerId)
    .eq("edition_date", localDate)
    .maybeSingle();

  if (existingEdition && existingEdition.status === "completed") {
    // Return existing preserved snapshot
    const stories = await loadEditionStories(supabase, existingEdition.id, readerId);

    return {
      success: true,
      isNew: false,
      preferredRegion: prefs.preferred_region,
      readingLength: prefs.reading_length,
      edition: {
        ...existingEdition,
        stories: stories || [],
      },
    };
  }

  if (existingEdition?.status === "generating") {
    const createdAt = Date.parse(existingEdition.created_at);
    const isAbandoned = Number.isFinite(createdAt) && Date.now() - createdAt > 60_000;
    if (isAbandoned) {
      await supabase.from("editions").delete().eq("id", existingEdition.id).eq("status", "generating");
    } else {
      for (let attempt = 0; attempt < 15; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const { data: currentEdition } = await supabase
          .from("editions")
          .select("*")
          .eq("id", existingEdition.id)
          .maybeSingle();
        if (currentEdition?.status === "completed") {
          const stories = await loadEditionStories(supabase, currentEdition.id, readerId);
          if (stories?.length) {
            return {
              success: true,
              isNew: false,
              preferredRegion: prefs.preferred_region,
              readingLength: prefs.reading_length,
              edition: { ...currentEdition, stories },
            };
          }
        }
        if (!currentEdition || currentEdition.status !== "generating") break;
      }
      return { success: false, error: "SERVER_ERROR" };
    }
  } else if (existingEdition?.status === "failed") {
    await supabase.from("editions").delete().eq("id", existingEdition.id).eq("status", "failed");
  }

  // 4. No edition exists yet -> Generate from reporting supply
  const supply = await getReportingSupply(supabase, {
    forceRefresh: options?.forceRefresh,
    controlledSupply: options?.controlledSupply,
    referenceDate: now,
  });

  const sourceGroups = groupSourceArticles(supply);
  if (sourceGroups.length === 0) {
    // A previous Edition remains useful when fresh supply is unavailable.
    // Its preserved date is returned unchanged and the UI labels it as a fallback.
    const latestEdition = await loadLatestSavedEdition(supabase, readerId);
    if (latestEdition) {
      return {
        success: true,
        isNew: false,
        isFallback: true,
        preferredRegion: prefs.preferred_region,
        readingLength: prefs.reading_length,
        edition: latestEdition,
      };
    }
    // Honest unavailable state: no eligible fresh reporting and no saved Edition.
    return { success: false, error: "NO_REPORTING" };
  }

  // Process only supplied reporting. Preferences and reader identity never leave Herald.
  const processedStories = await processGroupedStories(supabase, sourceGroups);
  const readyStories: GroupedSourceArticle[] = sourceGroups.map((story) => {
    const processed = processedStories.get(story.id || story.external_id);
    return {
      ...story,
      briefing: processed?.briefing,
      whyItMatters: processed?.whyItMatters || null,
      topics: processed?.topics || [],
      briefingSource: processed?.source || "publisher_excerpt",
      categories: processed?.topics.length ? processed.topics : story.categories,
    };
  });

  const preferencesForSelection = {
    interests: prefs.interests,
    preferred_region: prefs.preferred_region,
    reading_length: prefs.reading_length,
    subtopics,
  };
  const topicFeedback = options?.controlledTopicFeedback || await loadTopicFeedback(supabase, readerId);
  const positivelyLearnedTopics = [
    ...new Set(Object.entries(topicFeedback).filter(([, score]) => score > 0).map(([topic]) => topic)),
  ];
  const selection = selectEditionStories(
    readyStories,
    preferencesForSelection,
    now,
    [...new Set([...(options?.positivelyLearnedTopics || []), ...positivelyLearnedTopics])],
    topicFeedback,
  );
  const selectedArticles = [...selection.main, ...selection.beyondBubble];
  if (selectedArticles.length === 0) {
    return { success: false, error: "NO_REPORTING" };
  }

  // 5. Build ordered, immutable Story snapshots and edition metrics.
  const builtStories = [
    ...buildEditionStories(selection.main, "main", 1),
    ...buildEditionStories(selection.beyondBubble, "beyond_bubble", selection.main.length + 1),
  ];
  const totalWords = builtStories.reduce((acc, s) => acc + s.word_count, 0);
  const readingMinutes = estimateReadingTime(totalWords);
  const discoveryNote = selection.discoveryShortage === "no_eligible_story"
    ? "No eligible outside-interest reporting was available for this Edition."
    : selection.discoveryShortage === "does_not_fit"
      ? "There was not enough room in this Reading length for another distinct outside-interest Story."
      : selection.discoveryShortage === "briefing_unavailable"
        ? "Beyond Your Bubble is unavailable because Herald could not create a source-grounded importance explanation. Publisher excerpts or headlines remain available in the main paper."
        : null;

  // 6. Insert edition record (handle concurrent insertion gracefully)
  const { data: createdEdition, error: insertError } = await supabase
    .from("editions")
    .insert({
      reader_id: readerId,
      edition_date: localDate,
      time_zone: prefs.time_zone,
      reading_length: prefs.reading_length,
      estimated_reading_minutes: readingMinutes,
      word_count: totalWords,
      selection_version: "v1",
      status: "generating",
      discovery_note: discoveryNote,
    })
    .select()
    .single();

  if (insertError) {
    // If another concurrent request created it (unique constraint violation code 23505),
    // poll briefly to allow the winning request to finish inserting edition_stories.
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      const { data: concurrentEdition } = await supabase
        .from("editions")
        .select("*")
        .eq("reader_id", readerId)
        .eq("edition_date", localDate)
        .maybeSingle();

      if (concurrentEdition?.status === "completed") {
        const stories = await loadEditionStories(supabase, concurrentEdition.id, readerId);

        if (stories?.length) {
          return {
            success: true,
            isNew: false,
            preferredRegion: prefs.preferred_region,
            readingLength: prefs.reading_length,
            edition: {
              ...concurrentEdition,
              stories,
            },
          };
        }
      }
    }

    return { success: false, error: "SERVER_ERROR" };
  }

  // 7. Insert ordered stories
  const storyRecords = builtStories.map((story) => ({
    ...story,
    edition_id: createdEdition.id,
    reader_id: readerId,
  }));

  const { data: insertedStories, error: storyError } = await supabase
    .from("edition_stories")
    .insert(storyRecords)
    .select()
    .order("position", { ascending: true });

  if (storyError) {
    console.error("[Herald] edition_stories insert error:", JSON.stringify(storyError));
    // Cleanup failed edition so it can be safely retried
    await supabase.from("editions").delete().eq("id", createdEdition.id);
    return { success: false, error: "SERVER_ERROR" };
  }

  const { data: completedEdition, error: completionError } = await supabase
    .from("editions")
    .update({ status: "completed" })
    .eq("id", createdEdition.id)
    .select()
    .single();

  if (completionError || !completedEdition) {
    await supabase.from("editions").delete().eq("id", createdEdition.id);
    return { success: false, error: "SERVER_ERROR" };
  }

  return {
    success: true,
    isNew: true,
    preferredRegion: prefs.preferred_region,
    readingLength: prefs.reading_length,
    edition: {
      ...completedEdition,
      stories: (insertedStories || []) as EditionStory[],
    },
  };
}
