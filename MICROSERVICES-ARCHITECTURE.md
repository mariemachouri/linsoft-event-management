# Event Management System - Microservices Architecture

## 🏗️ Architecture Overview

Cette application utilise une architecture microservices avec les composants suivants :

### 🌐 Infrastructure Services

1. **Eureka Server** (Port: 8761)
   - Service Discovery et Registry
   - Permet aux microservices de se découvrir mutuellement
   - URL: http://localhost:8761

2. **Config Server** (Port: 8888)
   - Gestion centralisée de la configuration
   - Stockage des configurations pour tous les microservices
   - URL: http://localhost:8888

3. **Gateway Service** (Port: 8080)
   - Point d'entrée unique pour toutes les requêtes
   - Routage intelligent vers les microservices
   - Load balancing
   - URL: http://localhost:8080

### 📦 Business Services (Quarkus)

4. **Events Service** (Port: 8081)
   - Gestion des événements
   - Route: `/api/events/**`

5. **Registrations Service** (Port: 8082)
   - Gestion des inscriptions aux événements
   - Route: `/api/registrations/**`

6. **Users Service** (Port: 8083)
   - Gestion des utilisateurs
   - Route: `/api/users/**`

7. **Notifications Service** (Port: 8084)
   - Envoi de notifications
   - Route: `/api/notifications/**`

8. **Dashboard Service** (Port: 8085)
   - Tableau de bord et analytics
   - Route: `/api/dashboard/**`

9. **Charges Service** (Port: 8086)
   - Gestion des paiements et charges
   - Route: `/api/charges/**`

## 🚀 Démarrage des Services

### Ordre de démarrage recommandé :

1. **Eureka Server** - Service Discovery
   ```bash
   cd services/eureka-server
   mvn spring-boot:run
   ```

2. **Config Server** - Configuration centralisée
   ```bash
   cd services/config-server
   mvn spring-boot:run
   ```

3. **Gateway Service** - API Gateway
   ```bash
   cd services/gateway-service
   mvn spring-boot:run
   ```

4. **Business Services** - Services métiers (dans n'importe quel ordre)
   ```bash
   # Events Service
   cd services/events-service
   mvn quarkus:dev
   
   # Registrations Service
   cd services/registrations-service
   mvn quarkus:dev
   
   # Users Service
   cd services/users-service
   mvn quarkus:dev
   
   # Notifications Service
   cd services/notifications-service
   mvn quarkus:dev
   
   # Dashboard Service
   cd services/dashboard-service
   mvn quarkus:dev
   
   # Charges Service
   cd services/charges-service
   mvn quarkus:dev
   ```

## 🔗 Accès aux Services

### Via Gateway (Recommandé)
Tous les services sont accessibles via le Gateway :
- Events: `http://localhost:8080/api/events/`
- Registrations: `http://localhost:8080/api/registrations/`
- Users: `http://localhost:8080/api/users/`
- Notifications: `http://localhost:8080/api/notifications/`
- Dashboard: `http://localhost:8080/api/dashboard/`
- Charges: `http://localhost:8080/api/charges/`

### Accès Direct (Développement)
- Eureka Dashboard: `http://localhost:8761`
- Config Server: `http://localhost:8888`
- Gateway Actuator: `http://localhost:8080/actuator`

## 📊 Monitoring et Health Checks

Tous les services exposent des endpoints Actuator pour le monitoring :
- Health: `/actuator/health`
- Info: `/actuator/info`
- Metrics: `/actuator/metrics`

## 🔧 Configuration

### Enregistrement Eureka pour services Quarkus

Pour enregistrer les services Quarkus avec Eureka, ajoutez dans leur `application.properties` :

```properties
# Service name
quarkus.application.name=<service-name>

# Eureka configuration
eureka.client.service-url.default-zone=http://localhost:8761/eureka/
eureka.instance.prefer-ip-address=true
```

## 🛠️ Technologies Utilisées

- **Java 21** - Runtime
- **Spring Boot 3.2.5** - Infrastructure services (Eureka, Config, Gateway)
- **Spring Cloud 2023.0.1** - Cloud patterns
- **Quarkus 3.8.4** - Business services
- **Maven** - Build tool

## 📝 Notes

- Les services Spring Boot et Quarkus peuvent coexister dans la même architecture
- Le Gateway gère le load balancing automatiquement via Eureka
- Les configurations peuvent être centralisées dans le Config Server
- CORS est configuré au niveau du Gateway pour tous les services
