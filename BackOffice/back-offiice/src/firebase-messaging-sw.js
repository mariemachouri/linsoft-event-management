// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCUfGMXmBKZn67N9QWhJmXX-w01rXtrtSU",
  authDomain: "event-mgmt-97441.firebaseapp.com",
  projectId: "event-mgmt-97441",
  storageBucket: "event-mgmt-97441.firebasestorage.app",
  messagingSenderId: "1041823417246",
  appId: "1:1041823417246:web:f274e919715687e56d0c8f",
  measurementId: "G-L759TT01BS"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'Event Management';
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez une nouvelle notification',
    icon: '/assets/img/brand/favicon.png',
    badge: '/assets/img/brand/favicon.png',
    data: payload.data,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Voir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
