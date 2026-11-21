import { rifts, dailyReset, currentOrNextOccurrence, occurrencesBetween, upcomingOccurrences, isLive } from "./schedule.js";
import {
  formatCountdown,
  formatLocalDate,
  formatLocalDay,
  formatLocalTime,
  formatUtcTime,
  localTimeZone,
} from "./format.js";
import {
  notificationState,
  registerServiceWorker,
  reminderMinutes,
  sendDueReminders,
  showNotification,
  turnOffNotifications,
  turnOnNotifications,
} from "./notifications.js";

const timelineEvents = [...rifts, dailyReset];
const secondsInDay = 24 * 60 * 60;

const statusElement = document.getElementById("notification-status");
const toggleButton = document.getElementById("notification-toggle");
const testButton = document.getElementById("notification-test");

function renderTimeZone() {
  if (localTimeZone) {
    document.getElementById("time-zone").textContent = ` (${localTimeZone})`;
  }
}

function renderAxis() {
  const labels = [];
  for (let hour = 0; hour <= 24; hour += 1) {
    const label = document.createElement("span");
    label.className = hour % 3 === 0 ? "timeline-hour" : "timeline-hour is-minor";
    label.style.left = `${(hour / 24) * 100}%`;
    label.textContent = String(hour);
    labels.push(label);
  }
  document.getElementById("timeline-axis").replaceChildren(...labels);
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfNextLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function percentOfLocalDay(date, dayStart, dayEnd) {
  if (date <= dayStart) {
    return 0;
  }
  if (date >= dayEnd) {
    return 100;
  }
  const secondsIntoDay = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return (secondsIntoDay / secondsInDay) * 100;
}

function describeOccurrence(occurrence) {
  const utcStart = formatUtcTime(occurrence.start);
  if (occurrence.gameEvent.durationMinutes === 0) {
    return `${formatLocalTime(occurrence.start)}, ${utcStart}`;
  }
  return `${formatLocalTime(occurrence.start)} to ${formatLocalTime(occurrence.end)}, starts ${utcStart}`;
}

function renderTrack(gameEvent, dayStart, dayEnd) {
  const occurrenceList = document.createElement("ol");
  occurrenceList.className = "timeline-occurrences";
  for (const occurrence of occurrencesBetween(gameEvent, dayStart, dayEnd)) {
    const isMarker = gameEvent.durationMinutes === 0;
    const left = percentOfLocalDay(occurrence.start, dayStart, dayEnd);
    const item = document.createElement("li");
    item.className = isMarker ? "timeline-marker" : "timeline-bar";
    item.style.left = `${left}%`;
    if (!isMarker) {
      item.style.width = `${percentOfLocalDay(occurrence.end, dayStart, dayEnd) - left}%`;
    }
    item.dataset.start = String(occurrence.start.getTime());
    item.dataset.end = String(occurrence.end.getTime());
    item.title = describeOccurrence(occurrence);
    const description = document.createElement("span");
    description.className = "visually-hidden";
    description.textContent = describeOccurrence(occurrence);
    item.append(description);
    occurrenceList.append(item);
  }
  const nowLine = document.createElement("div");
  nowLine.className = "timeline-now";
  document
    .querySelector(`[data-event="${gameEvent.id}"] [data-field="track"]`)
    .replaceChildren(occurrenceList, nowLine);
}

function renderDay(now) {
  const dayStart = startOfLocalDay(now);
  const dayEnd = startOfNextLocalDay(now);
  document.getElementById("schedule-date").textContent = formatLocalDate(now);
  for (const gameEvent of timelineEvents) {
    renderTrack(gameEvent, dayStart, dayEnd);
  }
}

function updateTimeline(now) {
  const nowPercent = percentOfLocalDay(now, startOfLocalDay(now), startOfNextLocalDay(now));
  for (const nowLine of document.querySelectorAll(".timeline-now")) {
    nowLine.style.left = `${nowPercent}%`;
  }
  for (const item of document.querySelectorAll(".timeline-bar, .timeline-marker")) {
    const start = Number(item.dataset.start);
    const end = Number(item.dataset.end);
    item.classList.toggle("is-past", end <= now.getTime() && start < now.getTime());
    item.classList.toggle("is-live", start <= now.getTime() && now.getTime() < end);
  }
}

function renderStatus(gameEvent, now) {
  const row = document.querySelector(`[data-event="${gameEvent.id}"]`);
  const occurrence = currentOrNextOccurrence(gameEvent, now);
  const live = isLive(occurrence, now);
  row.classList.toggle("is-live", live);
  const status = row.querySelector('[data-field="status"]');
  if (live) {
    const liveLabel = document.createElement("strong");
    liveLabel.textContent = "Live now";
    status.replaceChildren(liveLabel, `, ends in ${formatCountdown(occurrence.end - now)}`);
    return;
  }
  status.textContent = `${formatLocalDay(occurrence.start, now)} ${formatLocalTime(occurrence.start)}, in ${formatCountdown(occurrence.start - now)}`;
}

function renderNotificationControls() {
  const state = notificationState();
  toggleButton.hidden = state === "unsupported" || state === "blocked";
  testButton.hidden = state !== "on";
  toggleButton.textContent = state === "on" ? "Turn off notifications" : "Turn on notifications";
  toggleButton.classList.toggle("button-outline", state === "on");

  const messages = {
    unsupported:
      "Your browser can't show notifications from this page. On an iPhone or iPad that only works after adding the page to your home screen, which I haven't tried.",
    blocked:
      "Notifications are blocked for this site. Allow them in your browser's site settings and reload the page.",
    on: `On. I'll notify you ${reminderMinutes} minutes before every rift, as long as this page stays open in a tab.`,
    off: `Off. Turn them on to get a notification ${reminderMinutes} minutes before every rift. It only works while this page is open in a tab.`,
  };
  statusElement.textContent = messages[state];
}

function showError(error) {
  console.error(error);
  statusElement.textContent = `Something went wrong showing a notification: ${error.message}`;
}

toggleButton.addEventListener("click", async () => {
  try {
    if (notificationState() === "on") {
      turnOffNotifications();
    } else {
      await turnOnNotifications();
    }
    renderNotificationControls();
    tick();
  } catch (error) {
    showError(error);
  }
});

testButton.addEventListener("click", async () => {
  try {
    await showNotification("Test from the rift timer", {
      body: "This is what a reminder looks like.",
      tag: "test",
      icon: "./apple-touch-icon.png",
    });
  } catch (error) {
    showError(error);
  }
});

let renderedLocalDay = null;

function tick() {
  const now = new Date();
  const localDay = startOfLocalDay(now).getTime();
  if (renderedLocalDay !== localDay) {
    renderDay(now);
    renderedLocalDay = localDay;
  }
  updateTimeline(now);
  for (const gameEvent of timelineEvents) {
    renderStatus(gameEvent, now);
  }
  sendDueReminders(upcomingOccurrences(now), now, showError);
}

renderTimeZone();
renderAxis();
renderNotificationControls();
tick();
setInterval(tick, 1000);
registerServiceWorker();
