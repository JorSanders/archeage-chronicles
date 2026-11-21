const localTimeFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const utcTimeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long" });
const dateFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });

export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatLocalTime(date) {
  return localTimeFormat.format(date);
}

export function formatLocalDate(date) {
  return dateFormat.format(date);
}

export function formatUtcTime(date) {
  return `${utcTimeFormat.format(date)} UTC`;
}

function localDayNumber(date) {
  return Math.round(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
}

export function formatLocalDay(date, now) {
  const daysAhead = localDayNumber(date) - localDayNumber(now);
  if (daysAhead === 0) {
    return "Today";
  }
  if (daysAhead === 1) {
    return "Tomorrow";
  }
  return weekdayFormat.format(date);
}

export function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}
