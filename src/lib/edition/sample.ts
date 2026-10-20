import type { Edition, EditionStory } from "./types";
import { countWords, estimateReadingTime } from "./ranking";

export const SAMPLE_EDITION_ID = "00000000-0000-4000-a000-000000000001";

/** Historical format demonstration using original summaries of NASA reports.
 * Source review: docs/recovery/sample-sources.md. No current-coverage claim.
 */
export function getPublicSampleEdition(): Edition {
  const reports = [
    {
      title: "DART test shortened an asteroid moonlet’s orbit",
      briefing: "NASA reported on 11 October 2022 that the DART spacecraft’s impact changed how long Dimorphos takes to orbit Didymos. The measured period fell from 11 hours and 55 minutes to 11 hours and 23 minutes. The two asteroids posed no threat to Earth. Researchers used telescope observations to measure the change after the September impact.",
      why_it_matters: "The result provided an experimental demonstration that a spacecraft impact can change an asteroid’s motion, informing planetary defence research.",
      source_url: "https://www.nasa.gov/news-release/nasa-confirms-dart-mission-impact-changed-asteroids-motion-in-space/",
      published_at: "2022-10-11T00:00:00Z",
    },
    {
      title: "Webb’s first deep field revealed thousands of galaxies",
      briefing: "NASA unveiled Webb’s first deep-field image on 11 July 2022. It shows the galaxy cluster SMACS 0723 and thousands of galaxies in a small patch of sky. The telescope’s near-infrared camera combined observations at different wavelengths, with a total exposure of 12.5 hours. The foreground cluster magnifies more distant galaxies through gravitational lensing.",
      why_it_matters: "The observations let astronomers investigate faint, distant galaxies and their properties, extending the evidence available for studying the early universe.",
      source_url: "https://science.nasa.gov/missions/webb/nasas-webb-delivers-deepest-infrared-image-of-universe-yet/",
      published_at: "2022-07-11T00:00:00Z",
    },
  ];
  const stories: EditionStory[] = reports.map((report, index) => ({
    ...report,
    id: `sample-story-${index + 1}`, edition_id: SAMPLE_EDITION_ID,
    position: index + 1, excerpt: report.briefing,
    publisher: "NASA", category: "science", locale: "global", section: "main",
    word_count: countWords(`${report.title} ${report.briefing} ${report.why_it_matters}`),
    supporting_sources: [{ title: report.title, url: report.source_url, publisher: "NASA" }],
  }));
  const words = stories.reduce((sum, story) => sum + story.word_count, 0);
  return {
    id: SAMPLE_EDITION_ID, reader_id: "public-sample-reader", edition_date: "2022-10-11",
    time_zone: "UTC", reading_length: 5, estimated_reading_minutes: estimateReadingTime(words),
    word_count: words, selection_version: "historical-format-sample-v2", status: "completed",
    discovery_note: "This historical science sample demonstrates the reading format; it does not demonstrate personalized discovery or current coverage.",
    created_at: "2022-10-11T00:00:00Z", stories,
  };
}
