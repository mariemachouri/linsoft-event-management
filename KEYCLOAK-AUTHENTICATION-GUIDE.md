# Configuration et Intégration Keycloak

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [User Stories Implémentées](#user-stories-implémentées)
5. [Endpoints API](#endpoints-api)
6. [Guide de Démarrage](#guide-de-démarrage)
7. [Configuration Keycloak](#configuration-keycloak)
8. [Tests](#tests)

## Vue d'ensemble

Ce document décrit l'intégration de Keycloak pour l'authentification et la gestion des utilisateurs dans le système de gestion d'événements.

### Fonctionnalités
- ✅ **US-01**: Authentification avec Keycloak (Login/Refresh Token)
- ✅ **US-02**: CRUD Utilisateurs complet
- ✅ **US-03**: Gestion des rôles

## Architecture

```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│   Keycloak      │  │  Users Service  │
│   (Auth)        │  │   (Quarkus)     │
└────────┬────────┘  └────────┬────────┘
         │                     │
         │                     ▼
         │              ┌─────────────┐
         └──────────────┤  MongoDB    │
                        └─────────────┘
```

### Composants

1. **Keycloak** (Port 8180)
   - Serveur d'authentification et d'autorisation
   - Gestion centralisée des utilisateurs et rôles
   - Émission de JWT tokens

2. **Users Service** (Port 8083)
   - API REST pour la gestion des utilisateurs
   - Synchronisation avec Keycloak
   - Stockage des profils utilisateurs dans MongoDB

3. **MongoDB** (Port 27017)
   - Base de données pour les profils utilisateurs
   - Stockage des métadonnées utilisateur

## Configuration

### Docker Compose

Le fichier `docker-compose.yml` configure automatiquement:
- Keycloak avec base de données PostgreSQL
- MongoDB pour le service utilisateurs
- Variables d'environnement pour la connexion

### Variables d'Environnement

```bash
# Keycloak
KEYCLOAK_URL=http://keycloak:8080/realms/event-mgmt
KEYCLOAK_ADMIN_URL=http://keycloak:8080
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_REALM=event-mgmt
KEYCLOAK_CLIENT_SECRET=users-service-secret

# MongoDB
MONGODB_CONNECTION_STRING=mongodb://admin:admin123@mongodb:27017/users_db?authSource=admin
```

## User Stories Implémentées

### US-01: Login avec Keycloak

**Description**: Authentification des utilisateurs via Keycloak

**Endpoints**:
```
POST /api/auth/login
POST /api/auth/refresh
```

**Exemple de Login**:
```bash
curl -X POST http://localhost:8083/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "password": "password123"
  }'
```

**Réponse**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "token_type": "Bearer",
  "expires_in": 300,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "refresh_expires_in": 1800
}
```

### US-02: CRUD Utilisateurs

**Description**: Gestion complète des utilisateurs

**Endpoints**:
- `GET /api/users` - Liste tous les utilisateurs
- `GET /api/users/{id}` - Récupérer un utilisateur par ID
- `GET /api/users/username/{username}` - Récupérer un utilisateur par username
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/{id}` - Mettre à jour un utilisateur
- `DELETE /api/users/{id}` - Supprimer un utilisateur

**Exemple de Création**:
```bash
curl -X POST http://localhost:8083/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "username": "john.doe",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePassword123!",
    "phoneNumber": "+1234567890",
    "roles": ["user"],
    "enabled": true
  }'
```

**Exemple de Mise à Jour**:
```bash
curl -X PUT http://localhost:8083/api/users/{id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "email": "john.new@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "roles": ["user", "event-organizer"]
  }'
```

### US-03: Gestion des Rôles

**Description**: Gestion des rôles Keycloak

**Endpoints**:
- `GET /api/roles` - Liste tous les rôles
- `GET /api/roles/{name}` - Récupérer un rôle par nom
- `POST /api/roles` - Créer un rôle
- `PUT /api/roles/{name}` - Mettre à jour un rôle
- `DELETE /api/roles/{name}` - Supprimer un rôle
- `POST /api/users/{id}/roles` - Assigner des rôles à un utilisateur
- `DELETE /api/users/{id}/roles` - Retirer des rôles d'un utilisateur

**Exemple de Création de Rôle**:
```bash
curl -X POST http://localhost:8083/api/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "event-organizer",
    "description": "Utilisateur pouvant créer et gérer des événements"
  }'
```

**Exemple d'Attribution de Rôle**:
```bash
curl -X POST http://localhost:8083/api/users/{userId}/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '["event-organizer", "admin"]'
```

## Endpoints API

### Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/auth/login` | Connexion utilisateur | Non |
| POST | `/api/auth/refresh` | Rafraîchir le token | Non |

### Utilisateurs (`/api/users`)

| Méthode | Endpoint | Description | Rôle Requis |
|---------|----------|-------------|-------------|
| GET | `/api/users` | Liste des utilisateurs | admin, user |
| GET | `/api/users/{id}` | Détails utilisateur | admin, user |
| GET | `/api/users/username/{username}` | Recherche par username | admin, user |
| POST | `/api/users` | Créer utilisateur | admin |
| PUT | `/api/users/{id}` | Modifier utilisateur | admin |
| DELETE | `/api/users/{id}` | Supprimer utilisateur | admin |
| POST | `/api/users/{id}/roles` | Assigner rôles | admin |
| DELETE | `/api/users/{id}/roles` | Retirer rôles | admin |

### Rôles (`/api/roles`)

| Méthode | Endpoint | Description | Rôle Requis |
|---------|----------|-------------|-------------|
| GET | `/api/roles` | Liste des rôles | admin |
| GET | `/api/roles/{name}` | Détails rôle | admin |
| POST | `/api/roles` | Créer rôle | admin |
| PUT | `/api/roles/{name}` | Modifier rôle | admin |
| DELETE | `/api/roles/{name}` | Supprimer rôle | admin |

## Guide de Démarrage

### Prérequis
- Docker et Docker Compose
- Java 21+
- Maven 3.9+

### Démarrage Rapide

1. **Démarrer les services**:
```bash
docker-compose up -d keycloak keycloak-db mongodb
```

2. **Attendre que Keycloak soit prêt** (environ 60 secondes):
```bash
docker-compose logs -f keycloak
```

3. **Configurer Keycloak** (voir section suivante)

4. **Démarrer le service utilisateurs**:
```bash
cd services/users-service
mvn clean quarkus:dev
```

### Configuration Keycloak

#### 1. Accéder à la console d'administration
- URL: http://localhost:8180
- Username: `admin`
- Password: `admin`

#### 2. Créer le Realm `event-mgmt`

1. Cliquer sur le menu déroulant en haut à gauche (actuellement "master")
2. Cliquer sur "Create Realm"
3. Nom: `event-mgmt`
4. Enabled: ✓
5. Cliquer sur "Create"

#### 3. Créer le Client `users-service`

1. Dans le realm `event-mgmt`, aller à "Clients"
2. Cliquer sur "Create client"
3. Configuration:
   - Client ID: `users-service`
   - Client authentication: ON
   - Authorization: OFF
   - Valid redirect URIs: `*`
   - Web origins: `*`
4. Dans l'onglet "Credentials", copier le "Client Secret"
5. Mettre à jour `KEYCLOAK_CLIENT_SECRET` si nécessaire

#### 4. Créer les Rôles Standards

Dans "Realm roles", créer:
- `admin` - Administrateur système
- `user` - Utilisateur standard
- `event-organizer` - Organisateur d'événements
- `participant` - Participant aux événements

#### 5. Créer un Utilisateur Admin Initial

1. Aller à "Users" → "Add user"
2. Configuration:
   - Username: `admin`
   - Email: `admin@example.com`
   - First name: `Admin`
   - Last name: `User`
   - Email verified: ✓
   - Enabled: ✓
3. Sauvegarder
4. Onglet "Credentials":
   - Définir mot de passe: `admin123`
   - Temporary: OFF
5. Onglet "Role mapping":
   - Assigner le rôle `admin`

## Tests

### Test de Login
```bash
# Login
curl -X POST http://localhost:8083/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Test de Création d'Utilisateur
```bash
# Utiliser le token obtenu lors du login
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI..."

curl -X POST http://localhost:8083/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "test.user",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPassword123!",
    "roles": ["user"]
  }'
```

### Test de Liste des Utilisateurs
```bash
curl -X GET http://localhost:8083/api/users \
  -H "Authorization: Bearer $TOKEN"
```

## Swagger UI

Documentation interactive disponible à:
- http://localhost:8083/q/swagger-ui

## Sécurité

### Bonnes Pratiques

1. **Mots de passe**: Minimum 8 caractères
2. **Tokens**: Expiration de 5 minutes (access) et 30 minutes (refresh)
3. **CORS**: Configuré pour le développement, à restreindre en production
4. **HTTPS**: Recommandé en production

### Permissions par Défaut

- `/api/auth/*` - Public
- `/api/users/*` - Authentification requise
- `/api/roles/*` - Rôle `admin` requis

## Monitoring

### Health Check
```bash
curl http://localhost:8083/q/health
```

### Logs
```bash
# Keycloak
docker-compose logs -f keycloak

# Users Service
docker-compose logs -f users-service

# MongoDB
docker-compose logs -f mongodb
```

## Dépannage

### Problème de Connexion à Keycloak

1. Vérifier que Keycloak est démarré:
```bash
docker-compose ps keycloak
```

2. Vérifier les logs:
```bash
docker-compose logs keycloak
```

3. Vérifier la configuration du realm et du client

### Problème de Connexion à MongoDB

1. Tester la connexion:
```bash
docker-compose exec mongodb mongosh -u admin -p admin123
```

2. Vérifier les logs:
```bash
docker-compose logs mongodb
```

## Prochaines Étapes

- [ ] Configuration d'un Identity Provider externe (Google, GitHub, etc.)
- [ ] Mise en place de l'authentification à deux facteurs (2FA)
- [ ] Implémentation de la vérification d'email
- [ ] Gestion des sessions utilisateurs
- [ ] Audit des connexions et actions utilisateurs
