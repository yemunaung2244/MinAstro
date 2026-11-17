// Retire the previous notification service worker on returning devices.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const subscription = await self.registration.pushManager.getSubscription();
    try {
      if (subscription) await subscription.unsubscribe();
    } finally {
      await self.registration.unregister();
    }
  })());
});
