import { test, expect } from "@playwright/test";
import { detectEventUpdate, evaluateRecentInclusion } from "../../src/lib/edition/events";
import type { SourceArticle } from "../../src/lib/edition/types";

test("a republished timestamp and update headline do not establish new facts", () => {
  const candidate: SourceArticle = {
    id: "a", external_id: "a", title: "Updated: City opens library", description: "The city opened a public library with study rooms and books for residents.",
    snippet: null, url: "https://publisher.org/library", image_url: null, publisher: "Publisher",
    published_at: "2026-10-19T10:00:00Z", language: "en", categories: ["general"], locale: null,
  };
  expect(detectEventUpdate(candidate, {
    title: "City opens library", sourceUrl: candidate.url, category: "general",
    publishedAt: "2026-10-18T10:00:00Z", briefing: candidate.description!,
  }).isUpdate).toBe(false);
});

test("negative decision objects and previously delivered auxiliary wording cannot become new facts", () => {
  const candidate: SourceArticle = {
    id: "decision", external_id: "decision", title: "European Commission solar funding decision",
    description: "The European Commission approved funding for solar summit grid upgrades.",
    snippet: null, url: "https://publisher.org/solar-funding", image_url: null, publisher: "Publisher",
    published_at: "2026-10-22T10:00:00Z", language: "en", categories: ["science"], locale: null,
  };
  const past = {
    title: candidate.title, sourceUrl: candidate.url, category: "science", publishedAt: "2026-10-21T10:00:00Z",
    sourceReports: [{ url: candidate.url, publishedAt: "2026-10-21T10:00:00Z", text:
      "The European Commission proposed funding for solar summit grid upgrades. The European Commission has approved funding for solar summit grid upgrades." }],
  };
  expect(detectEventUpdate(candidate, past).isUpdate).toBe(false);
  for (const negative of ["none of the", "neither of the", "zero"]) {
    const text = `The European Commission approved ${negative} transport funding proposals.`;
    expect(detectEventUpdate({ ...candidate, description: text }, {
      ...past, sourceReports: [{ ...past.sourceReports[0], text: text.replace("approved", "proposed") }],
    }).isUpdate).toBe(false);
  }
});

test("an older delivered approval stays known after a newer stale proposal-only Edition", () => {
  const candidate: SourceArticle = {
    id: "decision", external_id: "decision", title: "European Commission solar funding decision",
    description: "The European Commission approved funding for solar summit grid upgrades.",
    snippet: null, url: "https://publisher.org/solar-funding", image_url: null, publisher: "Publisher",
    published_at: "2026-10-22T10:00:00Z", language: "en", categories: ["science"], locale: null,
  };
  const oldApproval = {
    title: candidate.title, sourceUrl: candidate.url, category: "science", publishedAt: "2026-10-20T10:00:00Z", editionDate: "2026-10-20",
    sourceReports: [{ url: candidate.url, publishedAt: "2026-10-20T10:00:00Z", text: candidate.description! }],
  };
  const latestProposal = {
    ...oldApproval, editionDate: "2026-10-21", sourceReports: [{ ...oldApproval.sourceReports[0], text: candidate.description!.replace("approved", "proposed") }],
  };
  expect(evaluateRecentInclusion({ ...candidate, supportingArticles: [] }, [oldApproval, latestProposal]).status).toBe("unchanged_repeat");
});

for (const framing of ["hasn't", "denied it", "discussed whether it"]) {
  test(`a publisher's ${framing} wording cannot establish a new decision`, () => {
    const candidate: SourceArticle = {
      id: "decision", external_id: "decision", title: "European Commission solar funding decision",
      description: `The European Commission ${framing} approved funding for solar summit grid upgrades.`,
      snippet: null, url: "https://publisher.org/solar-funding", image_url: null, publisher: "Publisher",
      published_at: "2026-10-22T10:00:00Z", language: "en", categories: ["science"], locale: null,
    };
    expect(detectEventUpdate(candidate, {
      title: candidate.title, sourceUrl: candidate.url, category: "science", publishedAt: "2026-10-21T10:00:00Z",
      sourceReports: [{ url: candidate.url, publishedAt: "2026-10-21T10:00:00Z",
        text: `The European Commission ${framing} proposed funding for solar summit grid upgrades.` }],
    }).isUpdate).toBe(false);
  });
}

test("an approval already delivered through another publisher is not a new fact", () => {
  const candidate: SourceArticle = {
    id: "decision", external_id: "decision", title: "European Commission solar funding decision",
    description: "The European Commission approved funding for solar summit grid upgrades.",
    snippet: null, url: "https://publisher.org/solar-funding", image_url: null, publisher: "Publisher",
    published_at: "2026-10-22T10:00:00Z", language: "en", categories: ["science"], locale: null,
  };
  expect(detectEventUpdate(candidate, {
    title: candidate.title, sourceUrl: candidate.url, category: "science", publishedAt: "2026-10-21T10:00:00Z",
    sourceReports: [
      { url: candidate.url, publishedAt: "2026-10-21T08:00:00Z", text: "The European Commission proposed funding for solar summit grid upgrades." },
      { url: "https://other-publisher.org/decision", publishedAt: "2026-10-21T10:00:00Z", text: candidate.description! },
    ],
  }).isUpdate).toBe(false);
});

test("a report repeating an already delivered decision is not a new update even alongside its old proposal", () => {
  const proposal = "The European Commission proposed funding for solar summit grid upgrades.";
  const decision = "The European Commission approved funding for solar summit grid upgrades.";
  const candidate: SourceArticle = {
    id: "decision", external_id: "decision", title: "European Commission solar funding decision",
    description: decision, snippet: null, url: "https://publisher.org/solar-funding",
    image_url: null, publisher: "Publisher", published_at: "2026-10-22T10:00:00Z",
    language: "en", categories: ["science"], locale: null,
  };
  expect(detectEventUpdate(candidate, {
    title: candidate.title, sourceUrl: candidate.url, category: "science", publishedAt: "2026-10-21T10:00:00Z",
    sourceReports: [{ url: candidate.url, publishedAt: "2026-10-21T10:00:00Z", text: `${proposal} ${decision}` }],
  }).isUpdate).toBe(false);
  expect(detectEventUpdate(candidate, {
    title: candidate.title, sourceUrl: candidate.url, category: "science", publishedAt: "2026-10-21T10:00:00Z",
    sourceReports: [
      { url: candidate.url, publishedAt: "2026-10-20T10:00:00Z", text: proposal },
      { url: candidate.url, publishedAt: "2026-10-21T10:00:00Z", text: decision },
    ],
  }).isUpdate).toBe(false);
});
