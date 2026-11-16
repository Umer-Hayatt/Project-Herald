import { test, expect } from "@playwright/test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("licensed coverage observation records real sample dates and shortages without publishing article text", () => {
  const directory = mkdtempSync(join(tmpdir(), "herald-licensed-coverage-"));
  const mock = join(directory, "feed.mjs");
  writeFileSync(mock, `
const text = "Local residents published new plans for community library access after a public consultation. Council members will review longer opening hours and additional study spaces at their next public meeting.";
const item = slug => '<item><title>Residents publish new community library access plans</title><link>https://globalvoices.org/2026/10/24/'+slug+'/</link><dc:creator>Controlled Author</dc:creator><pubDate>'+new Date().toUTCString()+'</pubDate><category>Education</category><content:encoded><![CDATA[<p>'+text+'</p>]]></content:encoded></item>';
let calls = 0;
globalThis.fetch = async input => {
  if (String(input) !== 'https://globalvoices.org/feed/' || ++calls > 1) throw Error('Unexpected request');
  return new Response('<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><language>en</language>'+item('controlled-library-plans')+'</channel></rss>', { headers: {'content-type':'application/rss+xml'} });
};
`);
  try {
    const run = (approved: boolean) => execFileSync(process.execPath, ["--import", pathToFileURL(mock).href,
      resolve("scripts/record-globalvoices-coverage.mjs")], { cwd: directory, encoding: "utf8",
      env: { ...process.env, GLOBALVOICES_ENABLED: "true", GLOBALVOICES_PUBLIC_REPORTING_ENABLED: String(approved) } });
    run(true);
    run(false);
    const files = readdirSync(join(directory, "tmp/daily-coverage")).filter(name => name.endsWith(".json"));
    expect(files).toHaveLength(2);
    const reports = files.map(name => JSON.parse(readFileSync(join(directory, "tmp/daily-coverage", name), "utf8")));
    const approved = reports.find(report => report.publicApproval === true);
    expect(approved).toMatchObject({ provider: "Global Voices", timeZone: "Asia/Karachi", providerCalls: 1,
      acceptedCandidates: 1, eligiblePublicCandidates: 1, uniqueStories: 1, status: "supplementary_observation_unreviewed",
      threeDayAcceptance: "not_established", databaseWrites: false, modelCalls: 0 });
    expect(approved.sampleDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isFinite(Date.parse(approved.sampledAt))).toBe(true);
    expect(approved.sources[0].license).toBe("CC BY 3.0");
    expect(reports.find(report => report.publicApproval === false)).toMatchObject({ acceptedCandidates: 1, eligiblePublicCandidates: 0 });
    for (const report of reports) {
      expect(JSON.stringify(report)).not.toContain("Council members will review");
      expect(JSON.stringify(report)).not.toContain("Residents publish new community");
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("coverage distinguishes an unavailable feed from a successful feed with no eligible reporting", () => {
  const directory = mkdtempSync(join(tmpdir(), "herald-coverage-unavailable-"));
  const mock = join(directory, "feed.mjs");
  writeFileSync(mock, `globalThis.fetch = async () => process.env.COVERAGE_CASE === 'outage'
    ? new Response('', {status: 503})
    : new Response('<rss version="2.0"><channel><language>en</language></channel></rss>', {headers:{'content-type':'application/rss+xml'}});`);
  try {
    for (const example of ["outage", "empty"]) {
      const result = spawnSync(process.execPath, ["--import", pathToFileURL(mock).href,
        resolve("scripts/record-globalvoices-coverage.mjs")], { cwd: directory, encoding: "utf8",
        env: { ...process.env, GLOBALVOICES_ENABLED: "true", GLOBALVOICES_PUBLIC_REPORTING_ENABLED: "true", COVERAGE_CASE: example } });
      expect(result.status).toBe(example === "outage" ? 1 : 0);
    }
    const reports = readdirSync(join(directory, "tmp/daily-coverage")).map(name => JSON.parse(readFileSync(join(directory, "tmp/daily-coverage", name), "utf8")));
    expect(reports.map(report => report.status).sort()).toEqual(["no_eligible_reporting", "provider_unavailable"]);
    expect(reports.every(report => report.eligiblePublicCandidates === 0 && report.threeDayAcceptance === "not_established")).toBe(true);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("an image credit line does not exclude an article, while a rights notice in the article text still does", () => {
  const directory = mkdtempSync(join(tmpdir(), "herald-coverage-captions-"));
  const mock = join(directory, "feed.mjs");
  writeFileSync(mock, `
const text = "Local residents published new plans for community library access after a public consultation. Council members will review longer opening hours and additional study spaces at their next public meeting.";
const item = (slug, content) => '<item><title>Residents publish new community library access plans '+slug+'</title><link>https://globalvoices.org/2026/11/16/'+slug+'/</link><dc:creator>Controlled Author</dc:creator><pubDate>'+new Date().toUTCString()+'</pubDate><category>Education</category><content:encoded><![CDATA['+content+']]></content:encoded></item>';
const items = [
  item('wp-caption-photo-credit', '<div id="attachment_1" style="width: 800px" class="wp-caption aligncenter"><img src="https://globalvoices.org/photo.jpg" /><p class="wp-caption-text">Library entrance. Photo by Controlled Photographer. Used with permission.</p></div><p>'+text+'</p>'),
  item('figure-photo-licence', '<figure><img src="https://globalvoices.org/photo.jpg" /><figcaption>This file is licensed under the <a href="https://creativecommons.org/licenses/by/2.0/deed.en">Attribution 2.0 Generic</a> license.</figcaption></figure><p>'+text+'</p>'),
  item('notice-in-article-text', '<p>'+text+' This article is used with permission.</p>'),
  item('notice-in-caption-without-image', '<div class="wp-caption"><p class="wp-caption-text">This article is copyright its author. All rights reserved.</p></div><p>'+text+'</p>'),
  item('notice-in-quotation', '<blockquote>Reproduced with permission of the publisher.</blockquote><p>'+text+'</p>'),
];
globalThis.fetch = async () => new Response('<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><language>en</language>'+items.join('')+'</channel></rss>', { headers: {'content-type':'application/rss+xml'} });
`);
  try {
    execFileSync(process.execPath, ["--import", pathToFileURL(mock).href, resolve("scripts/record-globalvoices-coverage.mjs")],
      { cwd: directory, encoding: "utf8", env: { ...process.env, GLOBALVOICES_ENABLED: "true", GLOBALVOICES_PUBLIC_REPORTING_ENABLED: "true" } });
    const [name] = readdirSync(join(directory, "tmp/daily-coverage"));
    const report = JSON.parse(readFileSync(join(directory, "tmp/daily-coverage", name), "utf8"));
    expect(report.sources.map((source: { url: string }) => source.url.split("/").at(-2)).sort())
      .toEqual(["figure-photo-licence", "wp-caption-photo-credit"]);
    // The credit line itself is never part of the reporting Herald keeps: only the two body sentences are counted.
    expect(report.sources.every((source: { words: number }) => source.words === 29)).toBe(true);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
