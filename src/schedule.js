export const rifts = [
  {
    id: "crimson-rift",
    name: "Crimson Rift",
    startHoursUtc: [3, 11, 19],
    durationMinutes: 30,
  },
  {
    id: "brutal-nightmare",
    name: "Brutal Nightmare",
    startHoursUtc: [4, 12, 20],
    durationMinutes: 30,
  },
];

export const dailyResetHourUtc = 4;

const minuteInMilliseconds = 60 * 1000;
const dayInMilliseconds = 24 * 60 * minuteInMilliseconds;

function startOfUtcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function nextDailyReset(now) {
  const resetToday = new Date(startOfUtcDay(now) + dailyResetHourUtc * 60 * minuteInMilliseconds);
  if (resetToday > now) {
    return resetToday;
  }
  return new Date(resetToday.getTime() + dayInMilliseconds);
}

function occurrencesAround(rift, now) {
  const today = startOfUtcDay(now);
  const occurrences = [];
  for (const dayStart of [today - dayInMilliseconds, today, today + dayInMilliseconds]) {
    for (const hour of rift.startHoursUtc) {
      const start = new Date(dayStart + hour * 60 * minuteInMilliseconds);
      const end = new Date(start.getTime() + rift.durationMinutes * minuteInMilliseconds);
      occurrences.push({ rift, start, end });
    }
  }
  return occurrences;
}

export function currentOrNextOccurrence(rift, now) {
  return occurrencesAround(rift, now).find((occurrence) => occurrence.end > now);
}

export function upcomingOccurrences(now) {
  return rifts
    .flatMap((rift) => occurrencesAround(rift, now))
    .filter((occurrence) => occurrence.end > now)
    .sort((first, second) => first.start - second.start);
}

export function isLive(occurrence, now) {
  return occurrence.start <= now && now < occurrence.end;
}
