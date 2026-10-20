import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { ReportingWriter } from "../edition/news-supply";

/** No reader cookies or private-data methods leave this server-only boundary. */
export function createReportingWriter(): ReportingWriter | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_REPORTING_SERVICE_KEY;
  if (!url || !key) return undefined;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return { rpc: client.rpc.bind(client) };
}
