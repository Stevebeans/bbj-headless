// src/lib/bean/time.js
// Current time as a human label in Pacific ("BB Time"), so the Bean greets with the
// right time of day instead of guessing (and saying "Good evening" at 9 AM).
export function pacificNowLabel(date = new Date()) {
  const tz = "America/Los_Angeles";
  const clock = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date); // e.g. "Wednesday, 9:25 AM"
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(date)
  );
  const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `${part} (${clock} Pacific)`;
}

/** Just the part of day (morning/afternoon/evening) for a given hour 0-23. */
export function partOfDay(hour) {
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
}
