export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080',  // Gateway — routes all /api/* calls correctly
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',

  // Microservices URLs - via Gateway (port 8080)
  services: {
    users: 'http://localhost:8080/api/users',
    events: 'http://localhost:8080/api/events',
    registrations: 'http://localhost:8080/api/registrations',
    notifications: 'http://localhost:8080/api/notifications',
    dashboard: 'http://localhost:8080/api/dashboard',
    charges: 'http://localhost:8080/api/charges'
  },
  
  // Keycloak Configuration
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'event-mgmt',
    clientId: 'backoffice-client'
  },
  
  // Firebase Configuration
  firebase: {
    apiKey: "AIzaSyCUfGMXmBKZn67N9QWhJmXX-w01rXtrtSU",
    authDomain: "event-mgmt-97441.firebaseapp.com",
    projectId: "event-mgmt-97441",
    storageBucket: "event-mgmt-97441.firebasestorage.app",
    messagingSenderId: "1041823417246",
    appId: "1:1041823417246:web:f274e919715687e56d0c8f",
    measurementId: "G-L759TT01BS",
    vapidKey: "BDtvF_7VmvU7Ce9TiKkK4USnU8H6-mEBg4KFg-6NPIj_rg_M7yS-KSEAhe_gVVuc3kUHrgNsSDlqlMVf7dkEuyQ"
  }
};
