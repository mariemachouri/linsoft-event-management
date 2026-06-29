// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// FORCE REBUILD - Timestamp: 2026-04-18 12:36

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',  // Gateway — routes all /api/* calls correctly
  frontOfficeUrl: 'http://localhost:4300',  // FrontOffice local (login unifié / redirections)
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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
