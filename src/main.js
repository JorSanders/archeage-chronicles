import { rifts, currentOrNextOccurrence, upcomingOccurrences, isLive, nextDailyReset } from "./schedule.js";
import { formatCountdown, formatLocalDay, formatLocalTime, formatUtcTime, localTimeZone } from "./format.js";
import {
  notificationState,
  registerServiceWorker,
  reminderMinutes,
  sendDueReminders,
  showNotification,
  turnOffNotifications,
  turnOnNotifications,
} from "./notifications.js";

const statusElement = document.getElementById("notification-status");
const toggleButton = document.getElementById("notification-toggle");
const testButton = document.getElementById("notification-test");

function renderTimeZone() {
  if (localTimeZone) {
    document.getElementById("time-zone").textContent = ` (${localTimeZone})`;
  }
}

function minutesIntoLocalDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function renderDailyTimes(rift, listElement, now) {
  const starts = rift.startHoursUtc
    .map((hour) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour)))
    .sort((first, second) => minutesIntoLocalDay(first) - minutesIntoLocalDay(second));
  const items = starts.map((start) => {
    const item = document.createElement("li");
    const localTime = document.createElement("time");
    localTime.dateTime = start.toISOString();
    localTime.textContent = formatLocalTime(start);
    const utcTime = document.createElement("span");
    utcTime.className = "muted";
    utcTime.textContent = formatUtcTime(start);
    item.append(localTime, " ", utcTime);
    return item;
  });
  listElement.replaceChildren(...items);
}

function renderRift(rift, now) {
  const card = document.querySelector(`[data-rift="${rift.id}"]`);
  const occurrence = currentOrNextOccurrence(rift, now);
  const live = isLive(occurrence, now);

  const stateBadge = card.querySelector('[data-field="state"]');
  stateBadge.hidden = !live;
  stateBadge.textContent = "Live now";

  card.classList.toggle("is-live", live);
  card.querySelector('[data-field="countdown"]').textContent = live
    ? `Ends in ${formatCountdown(occurrence.end - now)}`
    : `Starts in ${formatCountdown(occurrence.start - now)}`;
  card.querySelector('[data-field="next"]').textContent =
    `${formatLocalDay(occurrence.start, now)} ${formatLocalTime(occurrence.start)} to ${formatLocalTime(occurrence.end)}`;
}

function renderDailyReset(now) {
  const reset = nextDailyReset(now);
  document.getElementById("reset-countdown").textContent = `Resets in ${formatCountdown(reset - now)}`;
  document.getElementById("reset-time").textContent =
    `${formatLocalDay(reset, now)} ${formatLocalTime(reset)}, ${formatUtcTime(reset)}`;
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

let renderedTimesForUtcDay = null;

function tick() {
  const now = new Date();
  const utcDay = now.toISOString().slice(0, 10);
  for (const rift of rifts) {
    if (renderedTimesForUtcDay !== utcDay) {
      renderDailyTimes(rift, document.querySelector(`[data-rift="${rift.id}"] [data-field="times"]`), now);
    }
    renderRift(rift, now);
  }
  renderedTimesForUtcDay = utcDay;
  renderDailyReset(now);
  sendDueReminders(upcomingOccurrences(now), now, showError);
}

renderTimeZone();
renderNotificationControls();
tick();
setInterval(tick, 1000);
registerServiceWorker();
