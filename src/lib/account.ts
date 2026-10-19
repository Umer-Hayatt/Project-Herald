import "server-only";
import { redirect } from "next/navigation";
import { preferenceInput, preferenceColumns } from "@/lib/preferences";
import { authConfigured, createClient } from "@/lib/supabase/server";

export async function loadReaderPreferences() {
  if (!authConfigured()) redirect("/login?error=setup");
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await client
    .from("reader_preferences")
    .select(preferenceColumns)
    .eq("reader_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Preferences are unavailable.");
  if (!data) return null;
  const subtopics = Array.isArray(user.user_metadata?.subtopics)
    ? user.user_metadata.subtopics
    : [];
  return preferenceInput.parse({ ...data, subtopics });
}
