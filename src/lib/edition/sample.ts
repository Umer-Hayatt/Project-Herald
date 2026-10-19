import type { Edition } from "./types";

export const SAMPLE_EDITION_ID = "00000000-0000-4000-a000-000000000001";

/**
 * Returns a canonical, public Sample Edition built entirely from permitted reporting.
 * Completely devoid of private reader data, clearly labelled, with full canonical Story contracts.
 */
export function getPublicSampleEdition(todayDateStr?: string): Edition {
  const editionDate = todayDateStr || new Date().toISOString().slice(0, 10);
  return {
    id: SAMPLE_EDITION_ID,
    reader_id: "public-sample-reader",
    edition_date: editionDate,
    time_zone: "UTC",
    reading_length: 10,
    estimated_reading_minutes: 7,
    word_count: 1450,
    selection_version: "v1-sample",
    status: "completed",
    discovery_note: null,
    created_at: `${editionDate}T06:00:00Z`,
    stories: [
      {
        id: "sample-story-1",
        edition_id: SAMPLE_EDITION_ID,
        position: 1,
        title: "Clean Energy Infrastructure Outpaces Fossil Investments in Major Global Economies",
        excerpt: "International energy monitors report renewable generation reached record operational capacity this quarter.",
        briefing: "International energy monitors report renewable generation reached record operational capacity this quarter, driven by grid-scale solar and offshore wind installations across Europe and North America.",
        why_it_matters: "Grid transmission bottlenecks now determine whether industrial manufacturing can transition away from high-emission fossil fuels within current climate targets.",
        publisher: "Clean Energy Chronicle",
        source_url: "https://example.com/energy/clean-infrastructure-record",
        published_at: `${editionDate}T06:30:00Z`,
        category: "science",
        locale: "global",
        word_count: 380,
        section: "main",
        image_url: null,
        supporting_sources: [
          {
            title: "Renewable Grid Interconnection Queue Advances Across Western Interconnect",
            url: "https://example.com/energy/grid-queue-advances",
            publisher: "Power Markets Dispatch",
          },
        ],
      },
      {
        id: "sample-story-2",
        edition_id: SAMPLE_EDITION_ID,
        position: 2,
        title: "Semiconductor Consortia Establish Open Standard for Chiplet Interconnects",
        excerpt: "Hardware manufacturers agree on modular physical architectures to lower fabrication costs.",
        briefing: "Hardware manufacturers agree on modular physical architectures to lower fabrication costs and shorten design cycles for next-generation computing hardware.",
        why_it_matters: "Standardized physical interfaces enable smaller tech firms to assemble specialized artificial intelligence chips without proprietary foundry lock-in.",
        publisher: "Tech Architecture Gazette",
        source_url: "https://example.com/tech/chiplet-interconnect-standard",
        published_at: `${editionDate}T05:45:00Z`,
        category: "technology",
        locale: "global",
        word_count: 360,
        section: "main",
        image_url: null,
        supporting_sources: [
          {
            title: "Semiconductor Packaging Standards Working Group Ratifies Specification",
            url: "https://example.com/tech/chiplet-working-group",
            publisher: "Silicon Systems Today",
          },
        ],
      },
      {
        id: "sample-story-3",
        edition_id: SAMPLE_EDITION_ID,
        position: 3,
        title: "Central Banks Finalize Bilateral Digital Settlement Protocol",
        excerpt: "Cross-border payment infrastructure eliminates multiple intermediate settlement layers.",
        briefing: "Cross-border payment infrastructure eliminates multiple intermediate settlement layers, cutting retail foreign remittance fees and clearing times.",
        why_it_matters: "Direct sovereign wholesale rails challenge multi-decade dominance of correspondent banking networks in international trade finance.",
        publisher: "Monetary Affairs Herald",
        source_url: "https://example.com/economy/central-bank-digital-settlement",
        published_at: `${editionDate}T04:15:00Z`,
        category: "business",
        locale: "global",
        word_count: 340,
        section: "main",
        image_url: null,
        supporting_sources: [
          {
            title: "Multilateral Payment Systems Advance Wholesale Settlement Tests",
            url: "https://example.com/economy/multilateral-settlement-tests",
            publisher: "Global Banking Review",
          },
        ],
      },
      {
        id: "sample-story-4",
        edition_id: SAMPLE_EDITION_ID,
        position: 4,
        title: "International Restoration Alliance Preserves Endangered Renaissance Architectural Frescoes",
        excerpt: "Conservators employ non-invasive enzymatic cleaning techniques to rescue centuries-old historic frescoes.",
        briefing: "Conservators employ non-invasive enzymatic cleaning techniques to rescue centuries-old historic frescoes damaged by indoor humidity and microclimate degradation.",
        why_it_matters: "Demonstrates how biochemical techniques can rescue irreplaceable cultural heritage without harsh physical solvents that strip delicate paint layers.",
        publisher: "Heritage & Arts Quarterly",
        source_url: "https://example.com/arts/renaissance-fresco-restoration",
        published_at: `${editionDate}T03:00:00Z`,
        category: "arts",
        locale: "global",
        word_count: 370,
        section: "beyond_bubble",
        image_url: null,
        supporting_sources: [
          {
            title: "Conservation Teams Document Cultural Heritage Sites Under Climate Stress",
            url: "https://example.com/arts/conservation-cultural-heritage",
            publisher: "Museum Preservation Journal",
          },
        ],
      },
    ],
  };
}
