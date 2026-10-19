import { z } from "zod";
export const interests = [
  "general",
  "science",
  "technology",
  "business",
  "health",
  "sports",
  "entertainment",
  "politics",
  "travel",
  "food",
] as const;
export const regions = {
  global: "Global",
  pk: "Pakistan",
  us: "United States",
  gb: "United Kingdom",
  in: "India",
  ca: "Canada",
  au: "Australia",
} as const;
export const fallbackTimeZone = "Asia/Karachi";

export const FAMILIAR_CITIES_MAP: Record<string, string> = {
  london: "Europe/London",
  "new york": "America/New_York",
  "san francisco": "America/Los_Angeles",
  "los angeles": "America/Los_Angeles",
  chicago: "America/Chicago",
  karachi: "Asia/Karachi",
  lahore: "Asia/Karachi",
  islamabad: "Asia/Karachi",
  tokyo: "Asia/Tokyo",
  sydney: "Australia/Sydney",
  melbourne: "Australia/Melbourne",
  toronto: "America/Toronto",
  vancouver: "America/Vancouver",
  paris: "Europe/Paris",
  berlin: "Europe/Berlin",
  dubai: "Asia/Dubai",
  singapore: "Asia/Singapore",
  mumbai: "Asia/Kolkata",
  delhi: "Asia/Kolkata",
};

export function resolveFamiliarTimeZone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallbackTimeZone;
  const lower = trimmed.toLowerCase();
  if (FAMILIAR_CITIES_MAP[lower]) return FAMILIAR_CITIES_MAP[lower];
  return trimmed;
}

export function isTimeZone(value: string) {
  try {
    const resolved = resolveFamiliarTimeZone(value);
    new Intl.DateTimeFormat("en", { timeZone: resolved });
    return resolved.length <= 100;
  } catch {
    return false;
  }
}
export const preferenceInput = z
  .object({
    interests: z
      .array(z.enum(interests))
      .max(interests.length)
      .transform((values) => [...new Set(values)]),
    preferred_region: z.enum(["global", "pk", "us", "gb", "in", "ca", "au"]),
    reading_length: z.union([z.literal(5), z.literal(10), z.literal(15)]),
    time_zone: z
      .string()
      .transform((val) => resolveFamiliarTimeZone(val))
      .refine(isTimeZone, "Choose a valid IANA time zone."),
    onboarding_complete: z.boolean(),
    subtopics: z
      .array(z.string().trim().min(1).max(100))
      .max(20)
      .default([])
      .optional()
      .transform((values) => [...new Set(values || [])]),
  })
  .strict()
  .refine((value) => !value.onboarding_complete || value.interests.length > 0, {
    message: "Choose at least one interest.",
    path: ["interests"],
  });
export type Preferences = z.infer<typeof preferenceInput>;
export const preferenceColumns =
  "interests,preferred_region,reading_length,time_zone,onboarding_complete";
