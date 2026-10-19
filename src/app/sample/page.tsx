export const metadata = {
  title: "Sample Edition | Herald",
  description: "Inspect a complete, dated Herald sample edition and matching newspaper PDF before signing in.",
};

import Link from "next/link";
import { Header } from "@/components/header";
import { getPublicSampleEdition } from "@/lib/edition/sample";
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

export default function SamplePage() {
  const edition = getPublicSampleEdition();
  const stories = edition.stories || [];
  const displayDate = formatDisplayDate(edition.edition_date);
  const mainStories = stories.filter((story) => story.section === "main");
  const beyondBubbleStories = stories.filter((story) => story.section === "beyond_bubble");

  return (
    <>
      <Header />
      <main id="main" className="edition-container">
        {/* Sample Status Notice */}
        <aside className="sample-banner" aria-label="Sample edition notice">
          <div className="sample-badge">Sample Edition</div>
          <p className="sample-description">
            This is an authentic demonstration of Herald’s daily paper format and canonical story structure.
            Every story provides a grounded Briefing, independent importance explanation, and verified source provenance.
          </p>
          <div className="sample-actions">
            <a
              href="/api/editions/sample/pdf"
              className="button sample-pdf-btn"
              download="Herald-Sample-Edition.pdf"
            >
              Download Sample PDF ↓
            </a>
            <Link href="/login" className="secondary-button" style={{ textDecoration: "none" }}>
              Create your personal paper →
            </Link>
          </div>
        </aside>

        {/* Paper Masthead */}
        <header className="edition-header">
          <div className="edition-header-meta">
            <span className="edition-meta-item">Sample Issue</span>
            <span className="edition-meta-item">·</span>
            <span className="edition-meta-item">Estimated {edition.estimated_reading_minutes} min reading · 10 min plan</span>
            <span className="edition-meta-item">·</span>
            <span className="edition-meta-item">{edition.word_count} words</span>
          </div>
          <h1 className="edition-header-title">{displayDate}</h1>
          <p className="edition-header-subtitle">
            A finite morning paper curated with room for perspective.
          </p>
        </header>

        {/* Stories Section */}
        <div className="edition-main-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="edition-main-content">
            <section className="story-feed" aria-label="Sample stories">
              <h2 className="edition-section-title">
                <span style={{ color: "var(--orange)", marginRight: "0.4rem" }}>|</span>
                Main reporting
              </h2>
              {mainStories.map((story) => (
                <EditionStoryCard
                  key={story.id || story.position}
                  story={story}
                  totalStories={stories.length}
                />
              ))}
            </section>

            <section className="story-feed discovery-section" aria-labelledby="sample-beyond-bubble-title">
              <div>
                <h2 id="sample-beyond-bubble-title" className="edition-section-title">
                  <span style={{ color: "var(--orange)", marginRight: "0.4rem" }}>|</span>
                  Beyond Your Bubble
                </h2>
                <p className="discovery-description">
                  Important reporting outside your usual interests, with a source-grounded reason to look closer.
                </p>
              </div>
              {beyondBubbleStories.map((story) => (
                <EditionStoryCard
                  key={story.id || story.position}
                  story={story}
                  totalStories={stories.length}
                />
              ))}
            </section>
          </div>
        </div>

        {/* Finished Reading Ending */}
        <footer id="edition-end" className="edition-footer-note">
          <div className="edition-end-seal" aria-hidden="true">
            <span className="seal-emblem">H</span>
          </div>
          <h3 className="edition-end-title">
            Experience the calm of a finite paper.
          </h3>
          <p className="edition-end-subtitle">
            No infinite doomscrolling, no algorithmically amplified outrage. One complete edition every morning tailored to you.
          </p>
          <div className="edition-end-actions">
            <Link href="/login" className="button" style={{ textDecoration: "none" }}>
              Get Started with Google
            </Link>
            <a
              href="/api/editions/sample/pdf"
              className="secondary-button"
              style={{ textDecoration: "none" }}
              download="Herald-Sample-Edition.pdf"
            >
              Download Sample PDF ↓
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
