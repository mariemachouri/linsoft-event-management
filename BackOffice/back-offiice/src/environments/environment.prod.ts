export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080',
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',
  
  // Microservices URLs (update these for production)
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
