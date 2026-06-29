export const environment = {
  production: true,
  // Vide → les appels deviennent relatifs (/api/...) et nginx les proxifie vers la gateway
  apiUrl: '',
  // URL publique du FrontOffice (Route OpenShift) — login unifié / redirections
  frontOfficeUrl: 'https://frontoffice-intern-machoury.apps.hlab.linsoft.local',
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',

  // Microservices via la gateway (chemins relatifs proxifiés par nginx)
  services: {
    users: '/api/users',
    events: '/api/events',
    registrations: '/api/registrations',
    notifications: '/api/notifications',
    dashboard: '/api/dashboard',
    charges: '/api/charges'
  },

  // Keycloak (Route OpenShift)
  keycloak: {
    url: 'https://keycloak-intern-machoury.apps.hlab.linsoft.local',
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
