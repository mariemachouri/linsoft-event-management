# Event Management System - Services Configuration

## 🎯 Service Registry

| Service | Port | Type | Technology | Purpose |
|---------|------|------|------------|---------|
| **Eureka Server** | 8761 | Infrastructure | Spring Boot | Service Discovery |
| **Config Server** | 8888 | Infrastructure | Spring Boot | Configuration Management |
| **Gateway** | 8080 | Infrastructure | Spring Cloud Gateway | API Gateway & Routing |
| **Events Service** | 8081 | Business | Quarkus | Event Management |
| **Registrations Service** | 8082 | Business | Quarkus | Registration Management |
| **Users Service** | 8083 | Business | Quarkus | User Management |
| **Notifications Service** | 8084 | Business | Quarkus | Notification Handling |
| **Dashboard Service** | 8085 | Business | Quarkus | Analytics & Dashboard |
| **Charges Service** | 8086 | Business | Quarkus | Payment & AI Predictions |

## 🌐 API Routes (via Gateway)

All business services are accessible through the Gateway at `http://localhost:8080`

| Service | Gateway Route | Direct URL | Swagger UI |
|---------|--------------|------------|------------|
| Events | `/api/events/**` | http://localhost:8081 | http://localhost:8081/q/swagger-ui |
| Registrations | `/api/registrations/**` | http://localhost:8082 | http://localhost:8082/q/swagger-ui |
| Users | `/api/users/**` | http://localhost:8083 | http://localhost:8083/q/swagger-ui |
| Notifications | `/api/notifications/**` | http://localhost:8084 | http://localhost:8084/q/swagger-ui |
| Dashboard | `/api/dashboard/**` | http://localhost:8085 | http://localhost:8085/q/swagger-ui |
| Charges | `/api/charges/**` | http://localhost:8086 | http://localhost:8086/q/swagger-ui |

## 🔧 Infrastructure URLs

- **Eureka Dashboard**: http://localhost:8761
- **Config Server Health**: http://localhost:8888/actuator/health
- **Gateway Actuator**: http://localhost:8080/actuator
- **Gateway Routes**: http://localhost:8080/actuator/gateway/routes

## 📊 Example API Calls

### Via Gateway (Production-like)
```bash
# Get all events
curl http://localhost:8080/api/events/events

# Get all users
curl http://localhost:8080/api/users/users

# Get registrations
curl http://localhost:8080/api/registrations/registrations

# Get charges
curl http://localhost:8080/api/charges/charges
```

### Direct Service Access (Development)
```bash
# Events Service
curl http://localhost:8081/api/events

# Users Service
curl http://localhost:8083/api/users
```

## 🗄️ Database Configuration

All Quarkus services use MongoDB:

| Service | Database Name | Connection String |
|---------|--------------|-------------------|
| Events | `events_db` | mongodb://localhost:27017 |
| Registrations | `registrations_db` | mongodb://localhost:27017 |
| Users | `users_db` | mongodb://localhost:27017 |
| Notifications | `notifications_db` | mongodb://localhost:27017 |
| Dashboard | `dashboard_db` | mongodb://localhost:27017 |
| Charges | `charges_db` | mongodb://localhost:27017 |

## 🔐 Security Configuration

All services are configured with Keycloak OIDC (currently disabled for testing):

```properties
KEYCLOAK_URL=http://localhost:8080/realms/event-mgmt
KEYCLOAK_CLIENT_SECRET=change-me
```

## 🚀 Quick Start Commands

### Start Infrastructure Services
```powershell
# Start Eureka Server
cd services/eureka-server
mvn spring-boot:run

# Start Config Server (wait for Eureka)
cd services/config-server
mvn spring-boot:run

# Start Gateway (wait for Config Server)
cd services/gateway-service
mvn spring-boot:run
```

### Start Business Services
```powershell
# All Quarkus services in parallel
cd services/events-service && mvn quarkus:dev
cd services/registrations-service && mvn quarkus:dev
cd services/users-service && mvn quarkus:dev
cd services/notifications-service && mvn quarkus:dev
cd services/dashboard-service && mvn quarkus:dev
cd services/charges-service && mvn quarkus:dev
```

### Or use the automated script
```powershell
.\start-all-services.ps1
```

## 📦 Build All Services
```bash
mvn clean install
```

## 🐳 Docker Deployment
```bash
docker-compose up --build
```

## 🔍 Health Checks

Check if all services are running:

```bash
# Eureka registry
curl http://localhost:8761/eureka/apps

# Gateway health
curl http://localhost:8080/actuator/health

# Individual service health
curl http://localhost:8081/q/health
curl http://localhost:8082/q/health
curl http://localhost:8083/q/health
curl http://localhost:8084/q/health
curl http://localhost:8085/q/health
curl http://localhost:8086/q/health
```

## 🎨 Architecture Diagram

```
                    ┌─────────────────┐
                    │  Eureka Server  │
                    │    :8761        │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  Config Server  │
                    │    :8888        │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │    Gateway      │
                    │    :8080        │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────┴─────┐        ┌─────┴────┐        ┌─────┴────┐
   │ Events   │        │  Users   │        │  Charges │
   │  :8081   │        │  :8083   │        │  :8086   │
   └──────────┘        └──────────┘        └──────────┘
        │                    │                    │
   ┌────┴─────┐        ┌─────┴────┐        ┌─────┴────┐
   │  Reg.    │        │  Notif.  │        │Dashboard │
   │  :8082   │        │  :8084   │        │  :8085   │
   └──────────┘        └──────────┘        └──────────┘
```

## 📝 Notes

- Infrastructure services (Eureka, Config, Gateway) use **Spring Boot 3.2.5** with **Java 21**
- Business services use **Quarkus 3.8.4** with **Java 21**
- All services support hot-reload in development mode
- Gateway provides load balancing and service discovery integration
- CORS is configured globally at the Gateway level
