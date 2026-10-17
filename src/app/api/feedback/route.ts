import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { interests } from "@/lib/preferences";
import { authConfigured, createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  story_id: z.string().uuid(),
  feedback: z.enum(["more", "less"]),
}).strict();

const json = (body: unknown, status = 200) => NextResponse.json(body, {
  status,
  headers: { "Cache-Control": "private, no-store" },
});

function feedbackStoryKey(story: {
  id: string;
  source_article_id: string | null;
  source_url: string;
  supporting_sources: unknown;
}) {
  const sources = Array.isArray(story.supporting_sources) ? story.supporting_sources : [];
  const primarySourceUrl = sources
    .map((source: { url?: unknown }) => String(source.url || ""))
    .filter(Boolean)
    .sort()[0];
  const identity = story.source_article_id || primarySourceUrl || story.source_url || story.id;
  return createHash("sha256").update(String(identity)).digest("hex");
}

export async function GET(request: NextRequest) {
  if (!authConfigured()) return json({ error: "Account services are being configured. Please retry." }, 503);
  const storyId = z.string().uuid().safeParse(request.nextUrl.searchParams.get("story_id"));
  if (!storyId.success) return json({ error: "This Story is unavailable in your Editions." }, 400);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Sign in to read your story feedback." }, 401);
    const { data: story, error: storyError } = await supabase
      .from("edition_stories")
      .select("id,supporting_sources,source_article_id,source_url")
      .eq("id", storyId.data)
      .eq("reader_id", user.id)
      .maybeSingle();
    if (storyError || !story) return json({ error: "This Story is unavailable in your Editions." }, 404);

    const { data, error } = await supabase
      .from("story_feedback")
      .select("feedback")
      .eq("reader_id", user.id)
      .eq("story_key", feedbackStoryKey(story))
      .maybeSingle();
    if (error) return json({ error: "We couldn’t load your saved feedback." }, 503);
    return json({ feedback: data?.feedback || null });
  } catch {
    return json({ error: "We couldn’t load your saved feedback." }, 503);
  }
}

export async function POST(request: NextRequest) {
  const expectedOrigin = process.env.APP_URL ? new URL(process.env.APP_URL).origin : request.nextUrl.origin;
  if (request.headers.get("origin") !== expectedOrigin) return json({ error: "Please send feedback from Herald." }, 403);
  if (!authConfigured()) return json({ error: "Account services are being configured. Please retry." }, 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Choose More like this or Less like this." }, 400);
  }
  const input = requestSchema.safeParse(body);
  if (!input.success) return json({ error: "Choose More like this or Less like this." }, 400);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Sign in to save story feedback." }, 401);

    const { data: story, error: storyError } = await supabase
      .from("edition_stories")
      .select("id,edition_id,topics,category,supporting_sources,source_article_id,source_url")
      .eq("id", input.data.story_id)
      .eq("reader_id", user.id)
      .maybeSingle();
    if (storyError || !story) return json({ error: "This Story is unavailable in your Editions." }, 404);

    const { data: edition, error: editionError } = await supabase
      .from("editions")
      .select("status")
      .eq("id", story.edition_id)
      .eq("reader_id", user.id)
      .maybeSingle();
    if (editionError || edition?.status !== "completed") return json({ error: "This Edition is not ready for feedback." }, 404);

    const storyKey = feedbackStoryKey(story);
    const rawTopics: string[] = Array.isArray(story.topics) ? story.topics : [];
    const topics = [...new Set(rawTopics.filter((topic) => interests.includes(topic as (typeof interests)[number])))];
    if (topics.length === 0 && interests.includes(story.category as (typeof interests)[number])) topics.push(story.category);

    const { error } = await supabase.from("story_feedback").upsert({
      reader_id: user.id,
      story_key: storyKey,
      feedback: input.data.feedback,
      topics,
    }, { onConflict: "reader_id,story_key" });
    if (error) return json({ error: "Your feedback wasn’t saved. Please retry." }, 503);
    return json({ feedback: input.data.feedback, message: "Saved for a future Edition." });
  } catch {
    return json({ error: "We couldn’t save your feedback. Please retry." }, 503);
  }
}
