self.addEventListener('push', (event) => {
  const { name, effect } = event.data.json();
  event.waitUntil(self.registration.showNotification('နာဒီကာ · ' + name, { body: effect }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/#calculator'));
});
