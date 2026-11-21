self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(focusOrOpenPage());
});

async function focusOrOpenPage() {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const openPage = windows.find((client) => client.url.startsWith(self.registration.scope));
  if (openPage) {
    return openPage.focus();
  }
  return self.clients.openWindow(self.registration.scope);
}
