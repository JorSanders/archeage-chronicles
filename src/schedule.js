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

export const dailyReset = {
  id: "daily-reset",
  name: "Daily reset",
  startHoursUtc: [4],
  durationMinutes: 0,
};

const minuteInMilliseconds = 60 * 1000;
const dayInMilliseconds = 24 * 60 * minuteInMilliseconds;

function startOfUtcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function occurrencesAround(gameEvent, now) {
  const today = startOfUtcDay(now);
  const occurrences = [];
  for (const dayStart of [today - dayInMilliseconds, today, today + dayInMilliseconds]) {
    for (const hour of gameEvent.startHoursUtc) {
      const start = new Date(dayStart + hour * 60 * minuteInMilliseconds);
      const end = new Date(start.getTime() + gameEvent.durationMinutes * minuteInMilliseconds);
      occurrences.push({ gameEvent, start, end });
    }
  }
  return occurrences;
}

export function occurrencesBetween(gameEvent, from, to) {
  return occurrencesAround(gameEvent, from).filter(
    (occurrence) => occurrence.start < to && (occurrence.end > from || occurrence.start >= from),
  );
}

export function currentOrNextOccurrence(gameEvent, now) {
  return occurrencesAround(gameEvent, now).find((occurrence) => occurrence.end > now);
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
