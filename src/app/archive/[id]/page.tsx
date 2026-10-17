export const metadata = { title: "Saved Edition | Herald" };

import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { getArchivedEditionById } from "@/lib/edition/archive";
import { EditionStoryCard } from "@/components/edition-story-card";
import { PdfDownloadButton } from "@/components/pdf-download-button";

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

export default async function ArchivedEditionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const edition = await getArchivedEditionById(supabase, user.id, id);

  if (!edition) {
    return (
      <>
        <Header signedIn />
        <main id="main" className="edition-container">
          <div className="edition-empty-state">
            <h1>Edition unavailable or not found</h1>
            <p>
              We couldn’t find this preserved edition. It may not exist or belongs to another reader account.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <Link href="/archive" className="button">
                Return to archive
              </Link>
              <Link href="/paper" className="secondary-button">
                Today’s Paper
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const stories = edition.stories || [];
  const displayDate = formatDisplayDate(edition.edition_date);

  return (
    <>
      <Header signedIn />
      <main id="main" className="edition-container">
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/archive" className="text-link" aria-label="Back to archive">
            ← Back to archive
          </Link>
        </div>

        <header className="edition-masthead-sub">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span className="meta-chip highlight" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
                Archived Edition
              </span>
            </div>
            <h1 className="edition-date-headline">{displayDate}</h1>
            <p style={{ color: "var(--muted)", margin: "0.25rem 0 0" }}>
              Preserved historical paper
            </p>
          </div>
          <div className="edition-meta-chips" aria-label="Edition details">
            <span className="meta-chip highlight">
              ~{edition.estimated_reading_minutes} min read
            </span>
            <span className="meta-chip">{stories.length} stories</span>
            <span className="meta-chip">{edition.word_count} words</span>
            <span className="meta-chip">{edition.reading_length} minutes</span>
          </div>
          <div className="edition-masthead-actions">
            <PdfDownloadButton
              editionId={edition.id}
              editionDate={edition.edition_date}
              variant="secondary"
            />
          </div>
        </header>

        <section className="story-feed" aria-label={`Stories from ${displayDate}`}>
          <h2 className="edition-section-title">Your stories</h2>
          {stories.filter((story) => story.section === "main").map((story) => (
            <EditionStoryCard key={story.id || story.position} story={story} totalStories={stories.length} />
          ))}
        </section>

        <section className="story-feed discovery-section" aria-labelledby="beyond-bubble-title">
          <div>
            <h2 id="beyond-bubble-title" className="edition-section-title">Beyond Your Bubble</h2>
            <p className="discovery-description">Important reporting outside your usual interests, preserved with this Edition.</p>
          </div>
          {stories.filter((story) => story.section === "beyond_bubble").map((story) => (
            <EditionStoryCard key={story.id || story.position} story={story} totalStories={stories.length} />
          ))}
          {stories.every((story) => story.section !== "beyond_bubble") && (
            <p className="discovery-note" role="status">
              {edition.discovery_note || "No distinct outside-interest Stories were preserved in this Edition."}
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
            Preserved Edition: {displayDate}
          </p>
          <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
            This paper is saved in your archive exactly as it appeared on the day it was published.
          </p>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
            <Link href="/archive" className="text-link">
              ← Return to archive
            </Link>
            <Link href="/paper" className="text-link">
              Today’s Paper →
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
