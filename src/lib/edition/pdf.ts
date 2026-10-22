import PDFDocument from "pdfkit";
import type { Edition, EditionStory } from "./types";

function formatFullDisplayDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Generates a traditional newspaper-inspired PDF from an existing saved Edition snapshot.
 *
 * Requirements:
 * - Does not call news or AI APIs (renders from snapshot only).
 * - Matches Edition date, ordered stories, text, discovery explanations, attribution, and source URLs.
 * - Traditional newspaper masthead, section hierarchy, and multi-page pagination.
 * - Clickable original and supporting source links.
 * - ASCII-safe glyphs only to prevent font rendering defects in standard Type-1 serif fonts.
 */
export async function generateEditionPdf(edition: Edition): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 45, bottom: 45, left: 45, right: 45 },
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `Herald - ${edition.edition_date}`,
          Author: "Herald",
          Subject: "Your Personal Morning Paper",
          CreationDate: new Date(edition.created_at || Date.now()),
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));

      const pageWidth = doc.page.width;
      const leftMargin = 45;
      const rightMargin = pageWidth - 45;
      const contentWidth = rightMargin - leftMargin;

      const formattedDate = formatFullDisplayDate(edition.edition_date);
      const estMinutes =
        edition.estimated_reading_minutes ||
        Math.ceil((edition.word_count || 1000) / 200) ||
        5;
      const wordCountFormatted = Number(edition.word_count || 0).toLocaleString();

      // ==========================================
      // Masthead (Page 1)
      // ==========================================
      // Double top border
      doc.lineWidth(2).strokeColor("#111827").moveTo(leftMargin, 40).lineTo(rightMargin, 40).stroke();
      doc.lineWidth(0.5).strokeColor("#111827").moveTo(leftMargin, 43).lineTo(rightMargin, 43).stroke();

      doc.y = 48;
      doc
        .font("Times-Bold")
        .fontSize(34)
        .fillColor("#111827")
        .text("THE HERALD", { align: "center", characterSpacing: 2 });

      // Subtitle Bar: Date | Subtitle | Meta
      doc.y = doc.y + 4;
      const metaY = doc.y;
      doc.font("Times-Italic").fontSize(9.5).fillColor("#374151");
      doc.text(formattedDate, leftMargin, metaY, {
        width: contentWidth / 3,
        align: "left",
        lineBreak: false,
      });
      doc.text("Your Personal Morning Paper", leftMargin + contentWidth / 3, metaY, {
        width: contentWidth / 3,
        align: "center",
        lineBreak: false,
      });
      doc.text(
        `~${estMinutes} min read | ${wordCountFormatted} words`,
        leftMargin + (contentWidth * 2) / 3,
        metaY,
        { width: contentWidth / 3, align: "right", lineBreak: false }
      );

      // Bottom bar rule
      doc.y = metaY + 16;
      doc.lineWidth(1).strokeColor("#111827").moveTo(leftMargin, doc.y).lineTo(rightMargin, doc.y).stroke();
      doc.y = doc.y + 12;

      if (edition.discovery_note) {
        doc.font("Times-Italic").fontSize(9).fillColor("#374151")
          .text(edition.discovery_note, leftMargin, doc.y, { width: contentWidth, lineGap: 2 });
        doc.y += 8;
      }

      // Group stories into main stories and beyond-bubble stories
      const stories = edition.stories || [];
      const mainStories = stories.filter((s) => s.section !== "beyond_bubble");
      const bubbleStories = stories.filter((s) => s.section === "beyond_bubble");

      // Helper function to render a section title banner
      const renderSectionBanner = (title: string, subtitle?: string) => {
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }
        doc.y = doc.y + 4;
        const bannerY = doc.y;
        const bannerHeight = subtitle ? 24 : 18;
        doc
          .rect(leftMargin, bannerY, contentWidth, bannerHeight)
          .fillAndStroke("#1f2937", "#1f2937");
        doc
          .font("Times-Bold")
          .fontSize(10.5)
          .fillColor("#ffffff")
          .text(title, leftMargin + 8, bannerY + 4, {
            characterSpacing: 1,
            lineBreak: false,
          });
        if (subtitle) {
          doc
            .font("Times-Italic")
            .fontSize(8.5)
            .fillColor("#e5e7eb")
            .text(subtitle, leftMargin + 8, bannerY + 14, {
              lineBreak: false,
            });
        }
        doc.y = bannerY + bannerHeight + 8;
      };

      // Helper function to render a single story
      const renderStory = (story: EditionStory) => {
        if (doc.y > doc.page.height - 110) {
          doc.addPage();
        }

        const startY = doc.y;

        // Meta header: Position badge, Category, Publisher
        doc.font("Times-Bold").fontSize(8.5).fillColor("#6b7280");
        const category = (story.category || "GENERAL").toUpperCase();
        const metaText = `[ STORY ${story.position} ]   ${category}   |   ${story.publisher}`;
        doc.text(metaText, leftMargin, startY);

        doc.y = doc.y + 3;

        // Story Headline
        doc
          .font("Times-Bold")
          .fontSize(13.5)
          .fillColor("#111827")
          .text(story.title, leftMargin, doc.y, {
            width: contentWidth,
            lineGap: 2,
          });

        doc.y = doc.y + 3;

        // Story Briefing / Excerpt
        doc
          .font("Times-Roman")
          .fontSize(10)
          .fillColor("#28303e")
          .text(story.briefing || story.excerpt, leftMargin, doc.y, {
            width: contentWidth,
            lineGap: 2.5,
            align: "justify",
          });

        if (story.update_explanation) {
          doc.y = doc.y + 4;
          doc.font("Times-Bold").fontSize(9.5).fillColor("#111827");
          doc.text("Follow-up: ", leftMargin, doc.y, { continued: true });
          doc.font("Times-Roman").fontSize(9.5).fillColor("#374151");
          doc.text(story.update_explanation, { lineGap: 2 });
        }

        if (story.why_it_matters) {
          doc.y = doc.y + 4;
          doc.font("Times-Bold").fontSize(9.5).fillColor("#111827");
          doc.text("Why it matters: ", leftMargin, doc.y, { continued: true });
          doc.font("Times-Italic").fontSize(9.5).fillColor("#374151");
          doc.text(story.why_it_matters, { lineGap: 2 });
        }

        doc.y = doc.y + 4;

        // Clickable original reporting source link (ASCII arrow "->")
        doc.font("Times-Italic").fontSize(9);
        doc.fillColor("#1d4ed8");
        doc.text("Read original reporting ->", leftMargin, doc.y, {
          link: story.source_url,
          underline: true,
        });

        // Supporting sources if present
        if (story.supporting_sources && story.supporting_sources.length > 0) {
          doc.y = doc.y + 2;
          doc.font("Times-Roman").fontSize(8.5).fillColor("#4b5563");
          doc.text("Supporting coverage: ", leftMargin, doc.y, { continued: true });
          story.supporting_sources.forEach((supp, idx) => {
            const isLast = idx === story.supporting_sources!.length - 1;
            doc.font("Times-Italic").fillColor("#1d4ed8");
            doc.text(`${supp.title} (${supp.publisher})`, {
              link: supp.url,
              underline: true,
              continued: !isLast,
            });
            if (!isLast) {
              doc.font("Times-Roman").fillColor("#4b5563").text(" | ", { continued: true });
            }
          });
          doc.text(""); // Reset continued
        }

        // Story separator rule
        doc.y = doc.y + 8;
        doc
          .lineWidth(0.5)
          .strokeColor("#e5e7eb")
          .moveTo(leftMargin, doc.y)
          .lineTo(rightMargin, doc.y)
          .stroke();
        doc.y = doc.y + 8;
      };

      // 1. Render Main Stories
      if (mainStories.length > 0) {
        renderSectionBanner("TODAY'S STORIES", "Curated for your daily reading");
        for (const story of mainStories) {
          renderStory(story);
        }
      }

      // 2. Render Beyond Your Bubble Stories
      if (bubbleStories.length > 0) {
        renderSectionBanner(
          "BEYOND YOUR BUBBLE",
          "Important coverage outside your routine interests"
        );
        for (const story of bubbleStories) {
          renderStory(story);
        }
      }

      // ==========================================
      // Two-Pass Header & Footer (Page numbering)
      // ==========================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        const savedBottom = doc.page.margins.bottom;
        const savedTop = doc.page.margins.top;
        doc.page.margins.bottom = 0;
        doc.page.margins.top = 0;

        // Running header on page 2+
        if (i > 0) {
          doc
            .lineWidth(0.5)
            .strokeColor("#9ca3af")
            .moveTo(leftMargin, 28)
            .lineTo(rightMargin, 28)
            .stroke();
          doc.font("Times-Italic").fontSize(8).fillColor("#6b7280");
          doc.text("THE HERALD", leftMargin, 16, {
            align: "left",
            width: contentWidth / 3,
            lineBreak: false,
          });
          doc.text(formattedDate, leftMargin + contentWidth / 3, 16, {
            align: "center",
            width: contentWidth / 3,
            lineBreak: false,
          });
          doc.text(`Page ${i + 1} of ${totalPages}`, leftMargin + (contentWidth * 2) / 3, 16, {
            align: "right",
            width: contentWidth / 3,
            lineBreak: false,
          });
        }

        // Running footer on all pages
        const footerY = doc.page.height - 28;
        doc
          .lineWidth(0.5)
          .strokeColor("#e5e7eb")
          .moveTo(leftMargin, footerY - 4)
          .lineTo(rightMargin, footerY - 4)
          .stroke();
        doc.font("Times-Roman").fontSize(8).fillColor("#6b7280");
        doc.text("The Herald | Preserved Personal Morning Paper", leftMargin, footerY, {
          align: "left",
          width: contentWidth / 2,
          lineBreak: false,
        });
        doc.text(`Page ${i + 1} of ${totalPages}`, rightMargin - 100, footerY, {
          width: 100,
          align: "right",
          lineBreak: false,
        });

        doc.page.margins.bottom = savedBottom;
        doc.page.margins.top = savedTop;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
