import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { authConfigured, createClient } from "@/lib/supabase/server";
import { regions, type Preferences } from "@/lib/preferences";
export default async function Paper() {
  if (!authConfigured()) redirect("/login?error=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("reader_preferences").select("interests,preferred_region,reading_length,time_zone,onboarding_complete").eq("reader_id", user.id).maybeSingle();
  if (error) throw new Error("Preferences are unavailable.");
  const preferences = data as Preferences | null;
  if (!preferences?.onboarding_complete) redirect("/onboarding");
  return <><Header signedIn /><main id="main" className="paper-entry"><h1>Your paper<br />starts with you.</h1><p className="lede">Your preferences are saved.</p><p>Your first Edition arrives in the next build slice. There’s no paper to read yet.</p><dl className="preference-summary"><div><dt>Your interests</dt><dd className="capitalize">{preferences.interests.join(", ")}</dd></div><div><dt>Preferred region</dt><dd>{regions[preferences.preferred_region]}</dd></div><div><dt>Reading length</dt><dd>{preferences.reading_length} minutes</dd></div><div><dt>Time zone</dt><dd>{preferences.time_zone}</dd></div></dl><Link className="text-link" href="/onboarding">Review your preferences</Link></main></>;
}

