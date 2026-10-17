import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { OnboardingForm } from "./preferences-form";
import { createClient, authConfigured } from "@/lib/supabase/server";
import type { Preferences } from "@/lib/preferences";
export default async function Onboarding() {
  if (!authConfigured()) redirect("/login?error=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("reader_preferences").select("interests,preferred_region,reading_length,time_zone,onboarding_complete").eq("reader_id", user.id).maybeSingle();
  if (error) throw new Error("Preferences are unavailable.");
  return <><Header signedIn /><main id="main" className="onboarding"><div className="onboarding-heading"><h1>What makes<br />your paper yours?</h1><p>Choose what you care about. We’ll leave room for a fresh perspective, too.</p></div><OnboardingForm saved={data as Preferences | null} /></main></>;
}

