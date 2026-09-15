/**
 * Utility functions for strict Indian Standard Time (IST - Asia/Kolkata / UTC+05:30) formatting.
 */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Formats any Date, timestamp, or database date string into IST (Asia/Kolkata).
 * Output format: "15 Sep, 03:32 PM"
 *
 * NOTE: The backend stores literal IST timestamps (via getIstDate) into PostgreSQL.
 * When returned as JSON (e.g. "2026-09-15T15:32:00.000Z"), the string numbers
 * (15:32) ALREADY represent IST. This function directly extracts those numbers
 * so the frontend matches the database 1:1 without double timezone shifting.
 */
export const formatToIST = (dateInput: string | number | Date | null | undefined): string => {
  if (!dateInput) return "-";
  try {
    if (typeof dateInput === "string") {
      const trimmed = dateInput.trim();
      // Match ISO strings e.g. "2026-09-15T15:32:00.000Z" or "2026-09-15 15:32:00"
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
      if (match) {
        const [, , m, d, h, min] = match;
        let hour = parseInt(h, 10);
        const minute = min;
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        const hourStr = String(hour).padStart(2, "0");
        const monthStr = MONTH_NAMES[parseInt(m, 10) - 1] || m;
        return `${d} ${monthStr}, ${hourStr}:${minute} ${ampm}`;
      }
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "-";

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(d);

    const day = parts.find((p) => p.type === "day")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value?.toUpperCase() || "AM";

    return `${day} ${month}, ${hour}:${minute} ${dayPeriod}`;
  } catch {
    return "-";
  }
};

/**
 * Returns current timestamp formatted as ISO string in IST (matching getIstDate in backend).
 */
export const getNowIsoIST = (): string => {
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  return new Date(Date.now() + istOffsetMs).toISOString();
};

/**
 * Returns today's date in YYYY-MM-DD strictly calculated in IST (Asia/Kolkata).
 */
export const getTodayDateStringIST = (): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
};
