// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',
  
  // Microservices URLs
  services: {
    users: 'http://localhost:8083/api',
    events: 'http://localhost:8081/api',
    registrations: 'http://localhost:8082/api',
    notifications: 'http://localhost:8084/api',
    dashboard: 'http://localhost:8085/api',
    charges: 'http://localhost:8086/api'
  },
  
  // Keycloak Configuration
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'event-mgmt',
    clientId: 'backoffice-client'
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
