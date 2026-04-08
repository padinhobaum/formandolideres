/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

function resolveNotificationUrl(url?: string) {
  try {
    return new URL(url || "/home", self.location.origin).toString();
  } catch {
    return new URL("/home", self.location.origin).toString();
  }
}

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: { title: string; body: string; url?: string; icon?: string; badge?: string };
  try {
    data = event.data.json();
  } catch {
    data = { title: "Formando Líderes", body: event.data.text() };
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    data: { url: resolveNotificationUrl(data.url) },
    vibrate: [200, 100, 200],
    tag: "formando-lideres-" + Date.now(),
  } as NotificationOptions;

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = resolveNotificationUrl(event.notification.data?.url);

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      for (const client of clientList) {
        if (!("focus" in client)) continue;

        const sameOriginClient = client.url.startsWith(self.location.origin);
        if (!sameOriginClient) continue;

        const windowClient = client as WindowClient;
        await windowClient.focus();
        if (windowClient.url !== url && "navigate" in windowClient) {
          await windowClient.navigate(url);
        }
        return;
      }

      await self.clients.openWindow(url);
    })()
  );
});
