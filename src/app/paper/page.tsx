import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDailyEdition } from "@/lib/edition/service";
import { regions } from "@/lib/preferences";
import { EditionStoryCard } from "@/components/edition-story-card";

function formatDisplayDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export default async function PaperPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const result = await getOrCreateDailyEdition(supabase, user.id);

  if (!result.success) {
    if (result.error === "NOT_ONBOARDED") {
      redirect("/onboarding");
    }

    if (result.error === "NO_REPORTING") {
      return (
        <>
          <Header signedIn />
          <main id="main" className="edition-container">
            <div className="edition-empty-state">
              <h1>No fresh reporting available</h1>
              <p>
                We couldn’t retrieve eligible English news reporting within the 48-hour freshness window right now.
                Herald refuses to pad your paper with fabricated content or stale reporting.
              </p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <Link href="/paper" className="button">
                  Retry loading paper
                </Link>
                <Link href="/onboarding" className="secondary-button">
                  Review preferences
                </Link>
              </div>
            </div>
          </main>
        </>
      );
    }

    // Generic server failure
    return (
      <>
        <Header signedIn />
        <main id="main" className="edition-container">
          <div className="edition-empty-state">
            <h1>We couldn’t open your paper</h1>
            <p>An unexpected error occurred while generating today’s Edition. Please try again.</p>
            <Link href="/paper" className="button">
              Retry
            </Link>
          </div>
        </main>
      </>
    );
  }

  const { edition } = result;
  const stories = edition.stories || [];
  const displayDate = formatDisplayDate(edition.edition_date);

  return (
    <>
      <Header signedIn />
      <main id="main" className="edition-container">
        <header className="edition-masthead-sub">
          <div>
            <h1 className="edition-date-headline">{displayDate}</h1>
            <p style={{ color: "var(--muted)", margin: "0.25rem 0 0" }}>
              Your curated morning edition
            </p>
          </div>
          <div className="edition-meta-chips" aria-label="Edition details">
            <span className="meta-chip highlight">
              ~{edition.estimated_reading_minutes} min read
            </span>
            <span className="meta-chip">{stories.length} stories</span>
            <span className="meta-chip">{edition.word_count} words</span>
            <span className="meta-chip">
              {result.readingLength} minutes
            </span>
            <span className="meta-chip">
              {regions[result.preferredRegion as keyof typeof regions] || result.preferredRegion}
            </span>
          </div>
        </header>

        <section className="story-feed" aria-label="Today’s stories">
          <h2 className="edition-section-title">Your stories</h2>
          {stories.filter((story) => story.section === "main").map((story) => (
            <EditionStoryCard key={story.id || story.position} story={story} totalStories={stories.length} />
          ))}
        </section>

        <section className="story-feed discovery-section" aria-labelledby="beyond-bubble-title">
          <div>
            <h2 id="beyond-bubble-title" className="edition-section-title">Beyond Your Bubble</h2>
            <p className="discovery-description">Important reporting outside your usual interests, with a reason to look closer.</p>
          </div>
          {stories.filter((story) => story.section === "beyond_bubble").map((story) => (
            <EditionStoryCard key={story.id || story.position} story={story} totalStories={stories.length} />
          ))}
          {stories.every((story) => story.section !== "beyond_bubble") && (
            <p className="discovery-note" role="status">
              {edition.discovery_note || "No distinct outside-interest Stories fit this Edition today."}
            </p>
          )}
        </section>

        {/* Reserved art/motion region for Slice 8 */}
        <aside
          style={{
            margin: "4rem 0 2rem",
            padding: "2rem",
            background: "#f3efe6",
            border: "1px dashed var(--line)",
            borderRadius: "6px",
            textAlign: "center",
          }}
          aria-label="Illustration placeholder"
        >
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Reserved for final human-made comic artwork & animation
          </span>
        </aside>

        <footer id="edition-end" className="edition-footer-note">
          <p style={{ fontWeight: 600, fontSize: "1.2rem", margin: "0 0 0.5rem" }}>
            You’ve reached the end of today’s paper.
          </p>
          <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
            Your next edition will arrive tomorrow morning based on your saved reading length and interests.
          </p>
          <Link href="/onboarding" className="text-link">
            Adjust preferences for tomorrow →
          </Link>
        </footer>
      </main>
    </>
  );
}
