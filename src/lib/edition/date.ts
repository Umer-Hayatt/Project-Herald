/**
 * Computes a reader's local calendar date (YYYY-MM-DD) based on their IANA time zone.
 * Falls back safely to 'Asia/Karachi' if the time zone is invalid or unspecified.
 */
export function getReaderLocalDate(timeZone?: string, referenceDate: Date = new Date()): string {
  const fallbackZone = "Asia/Karachi";
  const zoneToUse = timeZone && isValidTimeZone(timeZone) ? timeZone : fallbackZone;

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: zoneToUse,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(referenceDate);
  } catch {
    const fallbackFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: fallbackZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fallbackFormatter.format(referenceDate);
  }
}

function isValidTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== "string" || tz.length > 100) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
