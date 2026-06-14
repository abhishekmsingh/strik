// strik service worker.
//
// fetch: pure pass-through (no caching yet) — required so Chrome offers
//        the install prompt.
// push:  show a notification using the payload's title/body/url.
// notificationclick: focus an open tab on that URL or open one.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "strik", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "strik";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url || "/" },
    tag: payload.tag || undefined,
    renotify: !!payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // focus an existing tab if one is already open
      for (const client of all) {
        try {
          const url = new URL(client.url);
          if (url.pathname === target || url.pathname === new URL(target, url.origin).pathname) {
            await client.focus();
            return;
          }
        } catch {
          // ignore malformed URL
        }
      }
      // otherwise open a fresh window
      if (self.clients.openWindow) {
        await self.clients.openWindow(target);
      }
    })(),
  );
});
