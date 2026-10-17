import { test, expect } from "@playwright/test";
import { getReaderLocalDate } from "../src/lib/edition/date";

test.describe("getReaderLocalDate", () => {
  test("computes correct calendar date for a given timezone", () => {
    // 2026-10-17 19:30:00 UTC is 2026-10-18 00:30:00 in Asia/Karachi (UTC+5)
    const utcDate = new Date("2026-10-17T19:30:00Z");
    const karachiDate = getReaderLocalDate("Asia/Karachi", utcDate);
    expect(karachiDate).toBe("2026-10-18");

    // At the exact same instant, New York (UTC-4) is still 2026-10-17
    const nyDate = getReaderLocalDate("America/New_York", utcDate);
    expect(nyDate).toBe("2026-10-17");
  });

  test("handles midnight boundary accurately", () => {
    // 2026-10-17 18:59:59 UTC is 2026-10-17 23:59:59 in Asia/Karachi
    const beforeMidnight = new Date("2026-10-17T18:59:59Z");
    expect(getReaderLocalDate("Asia/Karachi", beforeMidnight)).toBe("2026-10-17");

    // 1 second later: 2026-10-17 19:00:00 UTC is 2026-10-18 00:00:00 in Asia/Karachi
    const atMidnight = new Date("2026-10-17T19:00:00Z");
    expect(getReaderLocalDate("Asia/Karachi", atMidnight)).toBe("2026-10-18");
  });

  test("handles daylight saving transitions", () => {
    // London switches from BST (UTC+1) to GMT (UTC+0) on last Sunday of October
    // 2026-10-25 00:30 UTC is 01:30 BST
    const summerDate = new Date("2026-10-25T00:30:00Z");
    expect(getReaderLocalDate("Europe/London", summerDate)).toBe("2026-10-25");

    // 2026-10-25 23:30 UTC is 23:30 GMT (same day)
    const winterDate = new Date("2026-10-25T23:30:00Z");
    expect(getReaderLocalDate("Europe/London", winterDate)).toBe("2026-10-25");
  });

  test("falls back safely to Asia/Karachi if timezone is invalid or empty", () => {
    const ref = new Date("2026-10-17T12:00:00Z");
    expect(getReaderLocalDate("", ref)).toBe("2026-10-17");
    expect(getReaderLocalDate("Invalid/Timezone", ref)).toBe("2026-10-17");
  });
});
