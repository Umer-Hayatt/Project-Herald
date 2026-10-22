import type { SupabaseClient } from "@supabase/supabase-js";
import type { Edition, EditionStory } from "./types";
import { restoreStoryUpdate } from "./events";

export interface ArchiveEditionSummary {
  id: string;
  reader_id: string;
  edition_date: string;
  time_zone: string;
  reading_length: number;
  estimated_reading_minutes: number;
  word_count: number;
  selection_version: string;
  created_at: string;
  story_count: number;
}

/**
 * Retrieves the list of completed Editions for a reader, ordered newest-first by edition date.
 * Excludes generating or failed attempts.
 * Enforces reader isolation: only returns editions owned by readerId.
 */
export async function getReaderArchiveEditions(
  supabase: SupabaseClient,
  readerId: string,
): Promise<ArchiveEditionSummary[]> {
  if (!readerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("editions")
    .select(`
      id,
      reader_id,
      edition_date,
      time_zone,
      reading_length,
      estimated_reading_minutes,
      word_count,
      selection_version,
      created_at,
      edition_stories (
        id
      )
    `)
    .eq("reader_id", readerId)
    .eq("status", "completed")
    .order("edition_date", { ascending: false });

  if (error || !data) {
    console.error("[Herald] Error fetching archive editions:", error);
    return [];
  }

  return data.map((record) => {
    const storiesArray = Array.isArray(record.edition_stories)
      ? record.edition_stories
      : [];
    return {
      id: record.id,
      reader_id: record.reader_id,
      edition_date: record.edition_date,
      time_zone: record.time_zone,
      reading_length: record.reading_length,
      estimated_reading_minutes: record.estimated_reading_minutes,
      word_count: record.word_count,
      selection_version: record.selection_version,
      created_at: record.created_at,
      story_count: storiesArray.length,
    };
  });
}

/**
 * Retrieves a specific preserved Edition by ID for a reader.
 * Returns the exact snapshot of stories and sections preserved at generation time.
 * Never calls live news APIs or AI generation.
 * Enforces reader ownership: returns null if the edition does not exist or belongs to another reader.
 */
export async function getArchivedEditionById(
  supabase: SupabaseClient,
  readerId: string,
  editionId: string,
): Promise<Edition | null> {
  if (!readerId || !editionId) {
    return null;
  }

  // 1. Fetch completed edition record owned by this reader
  const { data: edition, error: editionError } = await supabase
    .from("editions")
    .select("*")
    .eq("id", editionId)
    .eq("reader_id", readerId)
    .eq("status", "completed")
    .maybeSingle();

  if (editionError || !edition) {
    return null;
  }

  // 2. Fetch preserved ordered stories
  const { data: stories, error: storiesError } = await supabase
    .from("edition_stories")
    .select("*")
    .eq("edition_id", editionId)
    .eq("reader_id", readerId)
    .order("position", { ascending: true });

  if (storiesError) {
    console.error("[Herald] Error fetching archived edition stories:", storiesError);
    return null;
  }

  return {
    ...edition,
    stories: ((stories || []) as EditionStory[]).map(restoreStoryUpdate),
  };
}
