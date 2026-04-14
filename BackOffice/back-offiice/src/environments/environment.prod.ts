export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080', // Gateway URL
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',
  
  // Microservices URLs - All through Gateway (Production)
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
  }
};
