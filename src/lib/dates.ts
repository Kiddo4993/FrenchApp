/**
 * The time zone whose midnight starts a new day for streaks and daily goals.
 * Set APP_TIME_ZONE to an IANA name like "America/Vancouver"; defaults to UTC.
 */
export const APP_TIME_ZONE = process.env.APP_TIME_ZONE || "UTC";

/** `now` as a YYYY-MM-DD calendar day in `timeZone` (UTC if the zone isn't recognized). */
export function calendarDay(now: Date, timeZone: string): string {
  const format = (zone: string) =>
    // en-CA formats dates as YYYY-MM-DD.
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  try {
    return format(timeZone);
  } catch {
    return format("UTC");
  }
}
