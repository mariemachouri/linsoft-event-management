# Event Management System - Microservices Architecture

Système de gestion d'événements basé sur une architecture microservices avec Spring Boot et Quarkus.

## 🏗️ Architecture

### Services Principaux
- **Eureka Server** (Port 8761) - Service Discovery
- **Config Server** (Port 8888) - Configuration centralisée
- **Gateway Service** (Port 8080) - API Gateway
- **Keycloak** (Port 8180) - Authentification & Autorisation

### Microservices Métier
- **Users Service** (Port 8083) - Gestion des utilisateurs et authentification
- **Events Service** (Port 8081) - Gestion des événements
- **Registrations Service** (Port 8082) - Inscriptions aux événements
- **Notifications Service** (Port 8084) - Notifications et alertes
- **Dashboard Service** (Port 8085) - Tableaux de bord et analytics
- **Charges Service** (Port 8086) - Gestion des paiements

### Bases de Données
- **MongoDB** (Port 27017) - Base de données pour Users Service
- **PostgreSQL** - Base de données pour Keycloak

## ✅ Fonctionnalités Implémentées

### Authentification & Utilisateurs
- ✅ **US-01**: Login avec Keycloak
- ✅ **US-02**: CRUD Utilisateurs complet
- ✅ **US-03**: Gestion des rôles et permissions

📚 Voir [USER-STORIES-AUTH.md](USER-STORIES-AUTH.md) pour les détails

### Infrastructure
- ✅ Service Discovery avec Eureka
- ✅ Configuration centralisée
- ✅ API Gateway avec Spring Cloud Gateway
- ✅ Containerisation avec Docker

## 🚀 Démarrage Rapide

### Prérequis
- Java 21
- Maven 3.9+
- Docker & Docker Compose
- PowerShell (pour Windows)

### 1. Démarrer l'infrastructure

```bash
# Démarrer tous les services
docker-compose up -d

# Ou services spécifiques
docker-compose up -d keycloak keycloak-db mongodb eureka-server
```

### 2. Configurer Keycloak

```powershell
# Exécuter le script de configuration
.\setup-keycloak.ps1
```

Suivre les instructions pour:
- Créer le realm `event-mgmt`
- Créer le client `users-service`
- Créer les rôles (admin, user, event-organizer, participant)
- Créer l'utilisateur admin initial

📚 Guide complet: [KEYCLOAK-AUTHENTICATION-GUIDE.md](KEYCLOAK-AUTHENTICATION-GUIDE.md)

### 3. Démarrer les services en développement

```bash
# Users Service
cd services/users-service
mvn clean quarkus:dev

# Events Service
cd services/events-service
mvn clean quarkus:dev
```

Ou démarrer tous les services avec:
```powershell
.\start-all-services.ps1
```

### 4. Tester l'API

```powershell
# Exécuter les tests automatisés
.\test-users-api.ps1
```

Ou manuellement:
```bash
# Login
curl -X POST http://localhost:8083/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Utiliser le token pour les requêtes
curl -X GET http://localhost:8083/api/users \
  -H "Authorization: Bearer {votre-token}"
```

## 📖 Documentation

### Guides Techniques
- [MICROSERVICES-ARCHITECTURE.md](MICROSERVICES-ARCHITECTURE.md) - Architecture globale
- [EUREKA-INTEGRATION-GUIDE.md](EUREKA-INTEGRATION-GUIDE.md) - Service Discovery
- [SERVICES-CONFIGURATION.md](SERVICES-CONFIGURATION.md) - Configuration des services
- [KEYCLOAK-AUTHENTICATION-GUIDE.md](KEYCLOAK-AUTHENTICATION-GUIDE.md) - Authentification

### User Stories
- [USER-STORIES-AUTH.md](USER-STORIES-AUTH.md) - Authentification & Utilisateurs

### API Documentation
- **Users Service**: http://localhost:8083/q/swagger-ui
- **Events Service**: http://localhost:8081/q/swagger-ui
- **Registrations Service**: http://localhost:8082/q/swagger-ui

### Interfaces d'Administration
- **Eureka Dashboard**: http://localhost:8761
- **Keycloak Admin**: http://localhost:8180 (admin/admin)

## 🔐 Sécurité

### Authentification
- Tous les endpoints sont sécurisés via Keycloak OIDC
- Tokens JWT avec expiration (5 minutes access, 30 minutes refresh)
- Refresh tokens pour renouveler l'accès

### Autorisation
- Contrôle d'accès basé sur les rôles (RBAC)
- Rôles standards:
  - `admin` - Accès complet
  - `user` - Accès utilisateur standard
  - `event-organizer` - Gestion des événements
  - `participant` - Participation aux événements

## 🔧 Configuration

### Variables d'Environnement

#### Users Service
```bash
# MongoDB
MONGODB_CONNECTION_STRING=mongodb://admin:admin123@mongodb:27017/users_db?authSource=admin

# Keycloak
KEYCLOAK_URL=http://keycloak:8080/realms/event-mgmt
KEYCLOAK_ADMIN_URL=http://keycloak:8080
KEYCLOAK_REALM=event-mgmt
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_CLIENT_SECRET=users-service-secret
```

#### Autres Services
```bash
# Eureka
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server:8761/eureka/

# Config Server (si utilisé)
SPRING_CLOUD_CONFIG_URI=http://config-server:8888
```

## 🧪 Tests

### Tests API Utilisateurs
```powershell
# Tests complets avec PowerShell
.\test-users-api.ps1
```

### Tests Manuels
```bash
# Health checks
curl http://localhost:8083/q/health
curl http://localhost:8761/actuator/health

# Login
curl -X POST http://localhost:8083/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📊 Monitoring

### Health Checks
- Keycloak: http://localhost:8180/health/ready
- Users Service: http://localhost:8083/q/health
- Eureka: http://localhost:8761/actuator/health

### Logs
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f users-service
docker-compose logs -f keycloak
docker-compose logs -f mongodb
```

## 🛠️ Développement

### Structure du Projet
```
event-management/
├── services/
│   ├── eureka-server/         # Service Discovery
│   ├── config-server/         # Configuration Server
│   ├── gateway-service/       # API Gateway
│   ├── users-service/         # Gestion utilisateurs (Quarkus)
│   ├── events-service/        # Gestion événements (Quarkus)
│   ├── registrations-service/ # Inscriptions (Quarkus)
│   ├── notifications-service/ # Notifications (Quarkus)
│   ├── dashboard-service/     # Analytics (Spring Boot)
│   └── charges-service/       # Paiements (Spring Boot)
├── docker-compose.yml
├── setup-keycloak.ps1
├── test-users-api.ps1
└── start-all-services.ps1
```

### Ajouter un Nouveau Service

1. Créer le service dans `services/`
2. Ajouter la dépendance Eureka Client
3. Configurer `application.properties`:
   ```properties
   spring.application.name=mon-service
   eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
   ```
4. Ajouter au `docker-compose.yml`
5. Mettre à jour la documentation

### Build et Déploiement

```bash
# Build tous les services
mvn clean package -DskipTests

# Build Docker images
docker-compose build

# Déployer
docker-compose up -d
```

## 🐛 Dépannage

### Keycloak ne démarre pas
```bash
# Vérifier les logs
docker-compose logs keycloak

# Redémarrer
docker-compose restart keycloak
```

### Service ne peut pas se connecter à Eureka
1. Vérifier qu'Eureka est démarré: http://localhost:8761
2. Vérifier la configuration `eureka.client.service-url.defaultZone`
3. Attendre 30 secondes pour l'enregistrement

### Problème d'authentification
1. Vérifier que Keycloak est accessible: http://localhost:8180
2. Vérifier que le realm `event-mgmt` existe
3. Vérifier que le client `users-service` est configuré
4. Vérifier le secret client dans `application.properties`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT.

## 👥 Équipe

- Architecture microservices
- Authentification Keycloak
- User Stories implémentées

## 📅 Versions

### v1.0.0 (23 Février 2026)
- ✅ Architecture microservices avec Eureka
- ✅ Authentification Keycloak
- ✅ Users Service complet (CRUD + Rôles)
- ✅ API Gateway
- ✅ Configuration centralisée
- ✅ Containerisation Docker

---

**Note**: Ce projet est en développement actif. Consultez la documentation pour les dernières mises à jour.
