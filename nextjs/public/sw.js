// Service Worker for Lepos Trading Bot PWA Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/bot";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/bot") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "Lepos Trading Bot Alert";
    const options = {
      body: payload.body || "Thông báo biến động thị trường phái sinh",
      icon: payload.icon || "/logo_nonbg.png",
      badge: payload.badge || "/logo_nonbg.png",
      vibrate: [200, 100, 200],
      tag: payload.tag || "lepos-bot-alert",
      renotify: true,
      data: {
        url: payload.url || "/bot",
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("Lepos Trading Bot", {
        body: text,
        icon: "/logo_nonbg.png",
      })
    );
  }
});
