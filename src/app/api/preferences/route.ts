import { NextResponse, type NextRequest } from "next/server";
import { createClient, authConfigured } from "@/lib/supabase/server";
import { preferenceInput, preferenceColumns } from "@/lib/preferences";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
async function reader() {
  if (!authConfigured())
    return {
      failure: json(
        { error: "Account services are being configured. Please try again." },
        503,
      ),
    };
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user)
      return {
        failure: json({ error: "Sign in to save your preferences." }, 401),
      };
    return { client, user: data.user };
  } catch {
    return {
      failure: json(
        { error: "Account services are unavailable. Please retry." },
        503,
      ),
    };
  }
}
export async function GET() {
  const session = await reader();
  if (session.failure) return session.failure;
  const { data, error } = await session
    .client!.from("reader_preferences")
    .select(preferenceColumns)
    .eq("reader_id", session.user!.id)
    .maybeSingle();
  if (error)
    return json(
      { error: "We couldn’t load your preferences. Please retry." },
      503,
    );
  const subtopics = Array.isArray(session.user?.user_metadata?.subtopics)
    ? session.user.user_metadata.subtopics
    : [];
  return json({ preferences: data ? { ...data, subtopics } : null });
}
export async function PUT(request: NextRequest) {
  const expectedOrigin = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : request.nextUrl.origin;
  if (request.headers.get("origin") !== expectedOrigin)
    return json({ error: "Please save your preferences from Herald." }, 403);
  const session = await reader();
  if (session.failure) return session.failure;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Please check your preferences and try again." }, 400);
  }
  const input = preferenceInput.safeParse(body);
  if (!input.success)
    return json(
      { error: input.error.issues[0]?.message || "Check your preferences." },
      400,
    );

  const { subtopics = [], ...dbPayload } = input.data;

  if (subtopics !== undefined) {
    try {
      await session.client!.auth.updateUser({
        data: { subtopics },
      });
    } catch {
      // Continue even if auth metadata update fails
    }
  }

  const { data, error } = await session
    .client!.from("reader_preferences")
    .upsert(
      { ...dbPayload, reader_id: session.user!.id },
      { onConflict: "reader_id" },
    )
    .select(preferenceColumns)
    .single();
  if (error)
    return json(
      {
        error:
          "Your preferences weren’t saved. Please retry; your choices are still here.",
      },
      503,
    );
  return json({ preferences: { ...data, subtopics } });
}
