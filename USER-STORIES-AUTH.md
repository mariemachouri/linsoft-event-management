# User Stories - Authentification & Utilisateurs

## ✅ Statut d'Implémentation

### US-01: Login avec Keycloak ✓
**Objectif**: Permettre aux utilisateurs de s'authentifier via Keycloak

**Implémentation**:
- ✅ Service d'authentification (`AuthService`)
- ✅ Endpoint de login: `POST /api/auth/login`
- ✅ Endpoint de refresh token: `POST /api/auth/refresh`
- ✅ Intégration OIDC avec Keycloak
- ✅ Génération de JWT tokens
- ✅ Gestion des refresh tokens

**Fichiers Créés/Modifiés**:
- `services/users-service/src/main/java/com/eventmgmt/users/service/AuthService.java`
- `services/users-service/src/main/java/com/eventmgmt/users/resource/AuthResource.java`
- `services/users-service/src/main/java/com/eventmgmt/users/dto/LoginRequest.java`
- `services/users-service/src/main/java/com/eventmgmt/users/dto/LoginResponse.java`

**Tests**:
```bash
# Login
curl -X POST http://localhost:8083/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Refresh Token
curl -X POST http://localhost:8083/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

---

### US-02: CRUD Utilisateurs ✓
**Objectif**: Gérer les utilisateurs (Create, Read, Update, Delete)

**Implémentation**:
- ✅ Service de gestion des utilisateurs (`UserProfileService`)
- ✅ Synchronisation avec Keycloak
- ✅ Stockage dans MongoDB
- ✅ Validation des données
- ✅ Endpoints complets:
  - `GET /api/users` - Liste tous les utilisateurs
  - `GET /api/users/{id}` - Récupérer par ID
  - `GET /api/users/username/{username}` - Récupérer par username
  - `POST /api/users` - Créer un utilisateur
  - `PUT /api/users/{id}` - Mettre à jour
  - `DELETE /api/users/{id}` - Supprimer

**Fichiers Créés/Modifiés**:
- `services/users-service/src/main/java/com/eventmgmt/users/service/UserProfileService.java`
- `services/users-service/src/main/java/com/eventmgmt/users/resource/UserProfileResource.java`
- `services/users-service/src/main/java/com/eventmgmt/users/model/UserProfile.java`
- `services/users-service/src/main/java/com/eventmgmt/users/dto/UserCreateRequest.java`
- `services/users-service/src/main/java/com/eventmgmt/users/dto/UserUpdateRequest.java`
- `services/users-service/src/main/java/com/eventmgmt/users/dto/UserResponse.java`

**Tests**:
```bash
# Créer un utilisateur (admin requis)
curl -X POST http://localhost:8083/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "john.doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!",
    "roles": ["user"]
  }'

# Lister les utilisateurs
curl -X GET http://localhost:8083/api/users \
  -H "Authorization: Bearer $TOKEN"

# Récupérer un utilisateur
curl -X GET http://localhost:8083/api/users/{id} \
  -H "Authorization: Bearer $TOKEN"

# Mettre à jour un utilisateur
curl -X PUT http://localhost:8083/api/users/{id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "john.new@example.com",
    "roles": ["user", "event-organizer"]
  }'

# Supprimer un utilisateur
curl -X DELETE http://localhost:8083/api/users/{id} \
  -H "Authorization: Bearer $TOKEN"
```

---

### US-03: Gestion des Rôles ✓
**Objectif**: Gérer les rôles et les permissions des utilisateurs

**Implémentation**:
- ✅ Service de gestion des rôles (`KeycloakRoleService`)
- ✅ CRUD complet des rôles
- ✅ Attribution/Retrait de rôles aux utilisateurs
- ✅ Endpoints:
  - `GET /api/roles` - Liste tous les rôles
  - `GET /api/roles/{name}` - Récupérer par nom
  - `POST /api/roles` - Créer un rôle
  - `PUT /api/roles/{name}` - Mettre à jour
  - `DELETE /api/roles/{name}` - Supprimer
  - `POST /api/users/{id}/roles` - Assigner des rôles
  - `DELETE /api/users/{id}/roles` - Retirer des rôles

**Fichiers Créés/Modifiés**:
- `services/users-service/src/main/java/com/eventmgmt/users/service/KeycloakRoleService.java`
- `services/users-service/src/main/java/com/eventmgmt/users/resource/RoleResource.java`
- `services/users-service/src/main/java/com/eventmgmt/users/dto/RoleRequest.java`

**Rôles Standards Suggérés**:
- `admin` - Administrateur système complet
- `user` - Utilisateur standard
- `event-organizer` - Organisateur d'événements
- `participant` - Participant aux événements

**Tests**:
```bash
# Créer un rôle
curl -X POST http://localhost:8083/api/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "event-organizer",
    "description": "Can create and manage events"
  }'

# Lister les rôles
curl -X GET http://localhost:8083/api/roles \
  -H "Authorization: Bearer $TOKEN"

# Assigner des rôles à un utilisateur
curl -X POST http://localhost:8083/api/users/{userId}/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["event-organizer", "user"]'

# Retirer des rôles
curl -X DELETE http://localhost:8083/api/users/{userId}/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["event-organizer"]'
```

---

## 🏗️ Architecture Technique

### Technologies Utilisées
- **Quarkus** - Framework Java moderne
- **Keycloak** - Serveur d'identité et d'accès
- **MongoDB** - Base de données NoSQL
- **PostgreSQL** - Base de données pour Keycloak
- **Docker** - Containerisation

### Flux d'Authentification

```
1. Client → POST /api/auth/login
2. Users Service → Keycloak Token Endpoint
3. Keycloak → Validation credentials
4. Keycloak → Génération JWT (Access + Refresh tokens)
5. Users Service → Return tokens to Client
6. Client → Utilise Access Token pour les requêtes API
7. Quarkus → Valide JWT via Keycloak OIDC
```

### Sécurité

#### Endpoints Publics
- `/api/auth/*` - Authentification

#### Endpoints Protégés
- **Rôle `admin` requis**:
  - POST/PUT/DELETE `/api/users/*`
  - CRUD `/api/roles/*`
  - POST/DELETE `/api/users/{id}/roles`

- **Rôle `admin` ou `user` requis**:
  - GET `/api/users/*`

### Configuration CORS
- Activé pour le développement
- Origins: `*` (à restreindre en production)
- Méthodes: GET, POST, PUT, DELETE, OPTIONS
- Headers autorisés: accept, authorization, content-type

---

## 📊 Modèle de Données

### UserProfile (MongoDB)
```json
{
  "_id": "ObjectId",
  "keycloakId": "string",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "roles": ["string"],
  "enabled": boolean,
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Synchronisation
- Les utilisateurs sont créés à la fois dans Keycloak (auth) et MongoDB (profil)
- Le `keycloakId` dans MongoDB référence l'utilisateur Keycloak
- Les rôles sont gérés dans Keycloak et synchronisés dans MongoDB

---

## 🚀 Démarrage Rapide

### 1. Démarrer l'infrastructure
```bash
docker-compose up -d keycloak keycloak-db mongodb
```

### 2. Configurer Keycloak
```bash
# Attendre que Keycloak soit prêt (60s environ)
./setup-keycloak.ps1
```

### 3. Démarrer le service
```bash
cd services/users-service
mvn clean quarkus:dev
```

### 4. Tester l'API
```bash
# Récupérer un token
TOKEN=$(curl -X POST http://localhost:8083/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

# Lister les utilisateurs
curl -X GET http://localhost:8083/api/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📖 Documentation Complète

Consulter [KEYCLOAK-AUTHENTICATION-GUIDE.md](../KEYCLOAK-AUTHENTICATION-GUIDE.md) pour:
- Guide de configuration détaillé
- Architecture complète
- Exemples d'utilisation
- Dépannage
- Bonnes pratiques de sécurité

---

## 🧪 Swagger UI

Documentation interactive de l'API:
- **URL**: http://localhost:8083/q/swagger-ui
- Permet de tester tous les endpoints
- Documentation auto-générée avec OpenAPI

---

## 📝 Notes de Développement

### Prochaines Améliorations
- [ ] Vérification d'email
- [ ] Authentification à deux facteurs (2FA)
- [ ] Gestion des sessions
- [ ] Mot de passe oublié/réinitialisation
- [ ] Audit des actions utilisateurs
- [ ] Limitation de taux (rate limiting)
- [ ] Intégration avec Identity Providers externes (Google, GitHub)

### Bonnes Pratiques Appliquées
- ✅ Séparation des préoccupations (DTOs, Services, Resources)
- ✅ Validation des données d'entrée
- ✅ Gestion centralisée des erreurs
- ✅ Documentation OpenAPI
- ✅ Sécurité par rôles (RBAC)
- ✅ Tokens avec expiration
- ✅ CORS configuré
- ✅ Logs structurés

---

**Date d'implémentation**: 23 Février 2026  
**Version**: 1.0.0  
**Statut**: ✅ Completé
