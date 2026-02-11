# Event Management Backend (Quarkus Microservices)

Backend microservices for event management using Quarkus and MongoDB, secured with Keycloak (OIDC).

## Services
- events-service
- registrations-service
- users-service
- notifications-service
- dashboard-service
- charges-service

## Prerequisites
- Java 17
- Maven
- MongoDB
- Keycloak

## Run a service in dev mode
Example for events:

```bash
mvn -f services/events-service/pom.xml quarkus:dev
```

## Environment variables
Each service uses the same variable names:
- MONGODB_CONNECTION_STRING (default: mongodb://localhost:27017)
- KEYCLOAK_URL (default: http://localhost:8080/realms/event-mgmt)
- KEYCLOAK_CLIENT_SECRET (default: change-me)

## Default ports
- events-service: 8081
- registrations-service: 8082
- users-service: 8083
- notifications-service: 8084
- dashboard-service: 8085
- charges-service: 8086

Note: The Keycloak and MongoDB values are placeholders and should be replaced for each environment.
