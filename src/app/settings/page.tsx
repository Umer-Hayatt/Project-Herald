export const metadata = { title: "Reading preferences | Herald" };

import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { OnboardingForm } from "@/app/onboarding/preferences-form";
import { loadReaderPreferences } from "@/lib/account";

export default async function SettingsPage() {
  const preferences = await loadReaderPreferences();
  if (!preferences?.onboarding_complete) redirect("/onboarding");

  return (
    <>
      <Header signedIn />
      <main id="main" className="onboarding settings-page">
        <div className="onboarding-heading">
          <h1>Your reading preferences</h1>
          <p>Changes shape your next Edition. Completed Editions stay as they are.</p>
        </div>
        <OnboardingForm saved={preferences} mode="settings" />
      </main>
    </>
  );
}
