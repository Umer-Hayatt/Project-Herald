import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { getReaderArchiveEditions } from "@/lib/edition/archive";

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

export default async function ArchivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const editions = await getReaderArchiveEditions(supabase, user.id);

  return (
    <>
      <Header signedIn />
      <main id="main" className="edition-container">
        <header className="archive-header">
          <h1 className="archive-title">Archive</h1>
          <p className="archive-subtitle">
            Your preserved daily editions, saved exactly as you read them.
          </p>
        </header>

        {editions.length === 0 ? (
          <div className="edition-empty-state">
            <h2>Your archive is empty</h2>
            <p>
              Each morning when you open Herald, that day’s completed edition is saved here for you to revisit anytime.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <Link href="/paper" className="button">
                Today’s Paper
              </Link>
            </div>
          </div>
        ) : (
          <section className="archive-grid" aria-label="Preserved editions">
            {editions.map((edition) => {
              const displayDate = formatDisplayDate(edition.edition_date);
              return (
                <article
                  key={edition.id}
                  className="archive-card"
                  data-edition-date={edition.edition_date}
                  aria-label={`Edition for ${displayDate}`}
                >
                  <div className="archive-card-header">
                    <span className="archive-badge">Preserved</span>
                    <h2 className="archive-card-date">{displayDate}</h2>
                  </div>

                  <div className="edition-meta-chips" aria-label="Edition details">
                    <span className="meta-chip highlight">
                      ~{edition.estimated_reading_minutes} min read
                    </span>
                    <span className="meta-chip">{edition.story_count} stories</span>
                    <span className="meta-chip">{edition.word_count} words</span>
                  </div>

                  <div className="archive-card-actions">
                    <Link
                      href={`/archive/${edition.id}`}
                      className="button"
                      aria-label={`Read edition for ${displayDate}`}
                    >
                      Read edition →
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
}
