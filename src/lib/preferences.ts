import { z } from "zod";
export const interests = ["general", "science", "technology", "business", "health", "sports", "entertainment", "politics", "travel", "food"] as const;
export const regions = { global: "Global", pk: "Pakistan", us: "United States", gb: "United Kingdom", in: "India", ca: "Canada", au: "Australia" } as const;
export const fallbackTimeZone = "Asia/Karachi";
export function isTimeZone(value: string) { try { new Intl.DateTimeFormat("en", { timeZone: value }); return value.length <= 100; } catch { return false; } }
export const preferenceInput = z.object({
  interests: z.array(z.enum(interests)).max(interests.length).transform((values) => [...new Set(values)]),
  preferred_region: z.enum(["global", "pk", "us", "gb", "in", "ca", "au"]),
  reading_length: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  time_zone: z.string().refine(isTimeZone, "Choose a valid IANA time zone."),
  onboarding_complete: z.boolean(),
}).strict().refine((value) => !value.onboarding_complete || value.interests.length > 0, { message: "Choose at least one interest.", path: ["interests"] });
export type Preferences = z.infer<typeof preferenceInput>;

