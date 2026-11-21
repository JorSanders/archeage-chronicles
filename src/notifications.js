import { formatLocalTime } from "./format.js";

export const reminderMinutes = 10;

const preferenceKey = "notifications";
const remindedOccurrences = new Set();

export function notificationsSupported() {
  return "Notification" in window && "serviceWorker" in navigator;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch (error) {
    console.error("Could not register the service worker, falling back to plain notifications.", error);
  }
}

function readPreference() {
  try {
    return localStorage.getItem(preferenceKey) === "on";
  } catch (error) {
    return false;
  }
}

function storePreference(enabled) {
  try {
    localStorage.setItem(preferenceKey, enabled ? "on" : "off");
  } catch (error) {
    // Storage can be unavailable, the choice then lasts for this page view only.
  }
}

let enabledForThisPageView = readPreference();

export function notificationState() {
  if (!notificationsSupported()) {
    return "unsupported";
  }
  if (Notification.permission === "denied") {
    return "blocked";
  }
  if (Notification.permission === "granted" && enabledForThisPageView) {
    return "on";
  }
  return "off";
}

export async function turnOnNotifications() {
  const permission = await Notification.requestPermission();
  enabledForThisPageView = permission === "granted";
  storePreference(enabledForThisPageView);
}

export function turnOffNotifications() {
  enabledForThisPageView = false;
  storePreference(false);
}

export async function showNotification(title, options) {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.showNotification(title, options);
    return;
  }
  new Notification(title, options);
}

function occurrenceKey(occurrence) {
  return `${occurrence.gameEvent.id}-${occurrence.start.toISOString()}`;
}

export function sendDueReminders(occurrences, now, onError) {
  if (notificationState() !== "on") {
    return;
  }
  for (const occurrence of occurrences) {
    const key = occurrenceKey(occurrence);
    const reminderTime = occurrence.start.getTime() - reminderMinutes * 60 * 1000;
    const isDue = now.getTime() >= reminderTime && now < occurrence.start;
    if (!isDue || remindedOccurrences.has(key)) {
      continue;
    }
    remindedOccurrences.add(key);
    const minutesLeft = Math.ceil((occurrence.start - now) / 60000);
    const title = `${occurrence.gameEvent.name} in ${minutesLeft} ${minutesLeft === 1 ? "minute" : "minutes"}`;
    showNotification(title, {
      body: `Starts at ${formatLocalTime(occurrence.start)} and runs for ${occurrence.gameEvent.durationMinutes} minutes.`,
      tag: key,
      icon: "./apple-touch-icon.png",
    }).catch(onError);
  }
}
