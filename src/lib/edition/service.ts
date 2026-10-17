import type { SupabaseClient } from "@supabase/supabase-js";
import { getReaderLocalDate } from "./date";
import { getReportingSupply } from "./news-supply";
import {
  selectAndRankStories,
  buildEditionStories,
  estimateReadingTime,
} from "./ranking";
import type { Edition, EditionStory, SourceArticle, ReaderPreferencesRecord } from "./types";

export type EditionResult =
  | {
      success: true;
      edition: Edition;
      isNew: boolean;
      preferredRegion: string;
      readingLength: number;
    }
  | { success: false; error: "NOT_ONBOARDED" | "NO_REPORTING" | "UNAUTHENTICATED" | "SERVER_ERROR" };

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
    const { data: stories } = await supabase
      .from("edition_stories")
      .select("*")
      .eq("edition_id", existingEdition.id)
      .order("position", { ascending: true });

    return {
      success: true,
      isNew: false,
      preferredRegion: prefs.preferred_region,
      readingLength: prefs.reading_length,
      edition: {
        ...existingEdition,
        stories: (stories || []) as EditionStory[],
      },
    };
  }

  // 4. No edition exists yet -> Generate from reporting supply
  const supply = await getReportingSupply(supabase, {
    controlledSupply: options?.controlledSupply,
    referenceDate: now,
  });

  const selectedArticles = selectAndRankStories(
    supply,
    {
      interests: prefs.interests,
      preferred_region: prefs.preferred_region,
      reading_length: prefs.reading_length,
    },
    now,
  );

  if (selectedArticles.length === 0) {
    // Honest unavailable state: no eligible fresh reporting
    return { success: false, error: "NO_REPORTING" };
  }

  // 5. Build stories and metrics
  const builtStories = buildEditionStories(selectedArticles);
  const totalWords = builtStories.reduce((acc, s) => acc + s.word_count, 0);
  const readingMinutes = estimateReadingTime(totalWords);

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
      status: "completed",
    })
    .select()
    .single();

  if (insertError) {
    // Check if another concurrent tab already created it
    const { data: concurrentEdition } = await supabase
      .from("editions")
      .select("*")
      .eq("reader_id", readerId)
      .eq("edition_date", localDate)
      .maybeSingle();

    if (concurrentEdition) {
      const { data: stories } = await supabase
        .from("edition_stories")
        .select("*")
        .eq("edition_id", concurrentEdition.id)
        .order("position", { ascending: true });

      return {
        success: true,
        isNew: false,
        preferredRegion: prefs.preferred_region,
        readingLength: prefs.reading_length,
        edition: {
          ...concurrentEdition,
          stories: (stories || []) as EditionStory[],
        },
      };
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
    // Cleanup failed edition so it can be safely retried
    await supabase.from("editions").delete().eq("id", createdEdition.id);
    return { success: false, error: "SERVER_ERROR" };
  }

  return {
    success: true,
    isNew: true,
    preferredRegion: prefs.preferred_region,
    readingLength: prefs.reading_length,
    edition: {
      ...createdEdition,
      stories: (insertedStories || []) as EditionStory[],
    },
  };
}
