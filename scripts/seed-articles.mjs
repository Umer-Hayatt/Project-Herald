import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const token = process.env.THENEWSAPI_TOKEN;

if (!supabaseUrl || !supabaseKey || !token) {
  console.log("Missing config");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const url = new URL("https://api.thenewsapi.com/v1/news/all");
url.search = new URLSearchParams({
  api_token: token,
  language: "en",
  limit: "3",
}).toString();

console.log("Fetching live news from TheNewsAPI...");
const res = await fetch(url);
const body = await res.json();

if (!Array.isArray(body?.data) || body.data.length === 0) {
  console.error("No articles returned", body);
  process.exit(1);
}

const now = new Date();
const records = body.data.map((item) => ({
  external_id: item.uuid,
  title: item.title,
  description: item.description || null,
  snippet: item.snippet || null,
  url: item.url,
  image_url: item.image_url || null,
  publisher: item.source || "News Publisher",
  published_at: item.published_at || now.toISOString(),
  retrieved_at: now.toISOString(),
  language: item.language || "en",
  categories: Array.isArray(item.categories) && item.categories.length > 0 ? item.categories : ["general"],
  locale: item.locale || null,
}));

const { error } = await supabase.from("source_articles").upsert(records, { onConflict: "external_id" });
if (error) {
  console.error("Failed to insert source_articles:", error);
  process.exit(1);
}

await supabase.from("reporting_cache_meta").upsert({
  id: "news_supply",
  last_fetched_at: now.toISOString(),
  daily_request_count: 1,
  day_date: now.toISOString().slice(0, 10),
  is_fetching: false,
});

console.log(`Successfully seeded ${records.length} real source articles into Supabase!`);
