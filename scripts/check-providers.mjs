import { mkdirSync, writeFileSync } from "node:fs";
const report = {
  checkedAt: new Date().toISOString(),
  news: { status: "blocked", reason: "THENEWSAPI_TOKEN missing" },
  gemini: {
    status: "blocked",
    reason: "GEMINI_API_KEY or GEMINI_MODEL missing",
  },
};
if (process.env.THENEWSAPI_TOKEN) {
  try {
    const url = new URL("https://api.thenewsapi.com/v1/news/all");
    url.search = new URLSearchParams({
      api_token: process.env.THENEWSAPI_TOKEN,
      language: "en",
      limit: "3",
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) }),
      body = await response.json();
    report.news = {
      status:
        response.ok && Array.isArray(body.data) && body.data.length
          ? "passed"
          : "failed",
      httpStatus: response.status,
      fields: Object.keys(body.data?.[0] || {}),
      localesObserved: [
        ...new Set((body.data || []).map((item) => item.locale)),
      ],
      categoriesObserved: [
        ...new Set((body.data || []).flatMap((item) => item.categories || [])),
      ],
      articleCount: body.data?.length || 0,
      quotaHeaders: Object.fromEntries(
        [...response.headers].filter(([key]) => /rate.?limit/i.test(key)),
      ),
    };
  } catch {
    report.news = {
      status: "failed",
      reason:
        "Request failed or timed out. Check account access without logging the credential-bearing URL.",
    };
  }
}
if (process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL) {
  try {
    const model = process.env.GEMINI_MODEL;
    if (!/^[a-z0-9.-]+$/.test(model)) throw Error("Invalid model");
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          contents: [
            { parts: [{ text: "Reply with the single word Herald." }] },
          ],
          generationConfig: { maxOutputTokens: 64 },
        }),
      },
    );
    const body = await response.json(),
      text = body.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();
    report.gemini = {
      status: response.ok && text ? "passed" : "failed",
      httpStatus: response.status,
      model,
      returnedText: Boolean(text),
      usage: body.usageMetadata || null,
    };
  } catch {
    report.gemini = {
      status: "failed",
      reason:
        "Request failed or timed out. Check the chosen free-tier model and account quota.",
    };
  }
}
mkdirSync("docs/evidence", { recursive: true });
writeFileSync(
  "docs/evidence/provider-access.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (report.news.status !== "passed" || report.gemini.status !== "passed")
  process.exitCode = 1;
