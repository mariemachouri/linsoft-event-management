# Guide Complet - Test des Microservices avec Swagger UI

## 📋 État Actuel des Services

Services actuellement disponibles pour les tests Swagger :
- ✅ **Users Service** (Port 8083) - http://localhost:8083/q/swagger-ui
- 🔄 **Events Service** (Port 8081) - Démarrez avec: `cd services\events-service; mvn quarkus:dev`
- 🔄 **Registrations Service** (Port 8082) - Démarrez avec: `cd services\registrations-service; mvn quarkus:dev`
- 🔄 **Charges Service** (Port 8086) - Démarrez avec: `cd services\charges-service; mvn quarkus:dev`

---

## 🔐 Test 1: Users Service - Authentification

### URL Swagger UI
**http://localhost:8083/q/swagger-ui**

### Endpoints Disponibles

#### 1️⃣ Login (POST /api/auth/login)
**Objectif**: Obtenir un token d'accès

**Étapes**:
1. Ouvrir Swagger UI: http://localhost:8083/q/swagger-ui
2. Trouver la section **auth-resource**
3. Cliquer sur **POST /api/auth/login**
4. Cliquer sur **Try it out**
5. Copier ce JSON dans le body:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
6. Cliquer sur **Execute**
7. **IMPORTANT**: Copier le `accessToken` de la réponse

**Réponse attendue**:
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "expiresIn": 300
}
```

---

#### 2️⃣ Autorisation Globale
**Étapes**:
1. En haut de la page Swagger, cliquer sur le bouton **Authorize** 🔓
2. Dans le champ, entrer: `Bearer <votre-access-token>`
   - Remplacer `<votre-access-token>` par le token copié précédemment
3. Cliquer sur **Authorize**
4. Fermer la popup
5. Vous êtes maintenant autorisé pour tous les endpoints protégés ✅

---

#### 3️⃣ Lister les Utilisateurs (GET /api/users)
**Objectif**: Récupérer tous les utilisateurs

**Étapes**:
1. Trouver la section **user-profile-resource**
2. Cliquer sur **GET /api/users**
3. Cliquer sur **Try it out**
4. Cliquer sur **Execute**

**Réponse attendue**: Liste des utilisateurs avec leurs profils

---

#### 4️⃣ Créer un Utilisateur (POST /api/users)
**Objectif**: Créer un nouvel utilisateur

**Étapes**:
1. Cliquer sur **POST /api/users**
2. Cliquer sur **Try it out**
3. Copier ce JSON:
```json
{
  "username": "jane.doe",
  "email": "jane.doe@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "password": "SecurePass123!",
  "roles": ["user", "event-organizer"]
}
```
4. Cliquer sur **Execute**
5. **Noter l'ID** de l'utilisateur créé dans la réponse

**Réponse attendue**: Status 201 avec l'utilisateur créé

---

#### 5️⃣ Obtenir un Utilisateur par ID (GET /api/users/{id})
**Étapes**:
1. Cliquer sur **GET /api/users/{id}**
2. Cliquer sur **Try it out**
3. Entrer l'ID de l'utilisateur créé précédemment
4. Cliquer sur **Execute**

---

#### 6️⃣ Mettre à Jour un Utilisateur (PUT /api/users/{id})
**Étapes**:
1. Cliquer sur **PUT /api/users/{id}**
2. Cliquer sur **Try it out**
3. Entrer l'ID de l'utilisateur
4. Copier ce JSON:
```json
{
  "email": "jane.updated@example.com",
  "firstName": "Jane Updated",
  "roles": ["user", "event-organizer", "admin"]
}
```
5. Cliquer sur **Execute**

---

#### 7️⃣ Gestion des Rôles (role-resource)

**Lister les Rôles** (GET /api/roles):
1. Cliquer sur **GET /api/roles**
2. Cliquer sur **Try it out**
3. Cliquer sur **Execute**

**Créer un Rôle** (POST /api/roles):
```json
{
  "name": "premium-user",
  "description": "Utilisateur premium avec accès étendu"
}
```

**Assigner des Rôles** (POST /api/users/{id}/roles):
```json
{
  "roles": ["user", "premium-user"]
}
```

---

## 🎉 Test 2: Events Service

### URL Swagger UI
**http://localhost:8081/q/swagger-ui**

### Démarrage
```powershell
cd services\events-service
mvn quarkus:dev
```
Attendre "Quarkus started", puis ouvrir: http://localhost:8081/q/swagger-ui

### Tests à Effectuer

#### 1️⃣ Lister les Événements (GET /api/events)
**Étapes**:
1. Ouvrir Swagger UI
2. Cliquer sur **GET /api/events**
3. **Try it out** → **Execute**

#### 2️⃣ Créer un Événement (POST /api/events)
**JSON à utiliser**:
```json
{
  "name": "Conférence Spring Boot 2026",
  "description": "Conférence annuelle sur Spring Boot et les microservices",
  "location": "Paris Convention Center, France",
  "startDate": "2026-06-15T09:00:00",
  "endDate": "2026-06-17T18:00:00",
  "maxParticipants": 500
}
```

#### 3️⃣ Obtenir un Événement (GET /api/events/{id})
- Utiliser l'ID de l'événement créé

#### 4️⃣ Supprimer un Événement (DELETE /api/events/{id})
- Utiliser l'ID de l'événement à supprimer

---

## 📝 Test 3: Registrations Service

### URL Swagger UI
**http://localhost:8082/q/swagger-ui**

### Démarrage
```powershell
cd services\registrations-service
mvn quarkus:dev
```

### Tests à Effectuer

#### Créer une Inscription (POST /api/registrations)
**JSON à utiliser**:
```json
{
  "eventId": "event-id-from-events-service",
  "userId": "user-id-from-users-service",
  "status": "CONFIRMED",
  "registrationDate": "2026-03-09T14:30:00"
}
```

#### Lister les Inscriptions (GET /api/registrations)

#### Obtenir une Inscription (GET /api/registrations/{id})

#### Supprimer une Inscription (DELETE /api/registrations/{id})

---

## 💰 Test 4: Charges Service

### URL Swagger UI
**http://localhost:8086/q/swagger-ui**

### Démarrage
```powershell
cd services\charges-service
mvn quarkus:dev
```

### Tests à Effectuer

#### Créer une Charge (POST /api/charges)
**JSON à utiliser**:
```json
{
  "eventId": "event-id-from-events-service",
  "description": "Location de salle",
  "amount": 2500.00,
  "category": "VENUE"
}
```

#### Lister les Charges (GET /api/charges)

#### Obtenir les Charges par Événement (GET /api/charges/by-event/{eventId})

---

## 🎯 Scénario de Test Complet

### 1. **Authentification**
   - Login avec admin/admin123
   - Copier le token
   - Autoriser dans Swagger

### 2. **Créer un Utilisateur**
   - POST /api/users
   - Noter l'ID utilisateur

### 3. **Créer un Événement**
   - POST /api/events
   - Noter l'ID événement

### 4. **Créer une Inscription**
   - POST /api/registrations
   - Utiliser l'ID événement et l'ID utilisateur

### 5. **Créer des Charges**
   - POST /api/charges
   - Ajouter plusieurs charges pour l'événement

### 6. **Consulter les Données**
   - GET /api/users (voir tous les utilisateurs)
   - GET /api/events (voir tous les événements)
   - GET /api/registrations (voir toutes les inscriptions)
   - GET /api/charges/by-event/{eventId} (voir les charges d'un événement)

---

## 🔧 Commandes Utiles

### Vérifier l'état des services
```powershell
.\check-services-status.ps1
```

### Ouvrir toutes les Swagger UI
```powershell
.\open-swagger-ui.ps1
```

### Démarrer un service spécifique
```powershell
# Users
cd services\users-service; mvn quarkus:dev

# Events
cd services\events-service; mvn quarkus:dev

# Registrations
cd services\registrations-service; mvn quarkus:dev

# Charges
cd services\charges-service; mvn quarkus:dev
```

---

## 📚 URLs de Référence

| Service | Swagger UI | Health Check |
|---------|-----------|--------------|
| Users | http://localhost:8083/q/swagger-ui | http://localhost:8083/q/health |
| Events | http://localhost:8081/q/swagger-ui | http://localhost:8081/q/health |
| Registrations | http://localhost:8082/q/swagger-ui | http://localhost:8082/q/health |
| Notifications | http://localhost:8084/q/swagger-ui | http://localhost:8084/q/health |
| Dashboard | http://localhost:8085/q/swagger-ui | http://localhost:8085/q/health |
| Charges | http://localhost:8086/q/swagger-ui | http://localhost:8086/q/health |
| Eureka | http://localhost:8761 | - |
| Keycloak | http://localhost:8180 | - |

---

## ✅ Checklist de Test

- [ ] Login réussi et token obtenu
- [ ] Autorisation configurée dans Swagger
- [ ] Liste des utilisateurs récupérée
- [ ] Nouvel utilisateur créé
- [ ] Utilisateur mis à jour
- [ ] Rôles gérés (création, assignation)
- [ ] Événement créé
- [ ] Événement récupéré par ID
- [ ] Inscription créée
- [ ] Charge créée et associée à un événement
- [ ] Toutes les listes récupérées (users, events, registrations, charges)

---

**💡 Astuce**: Gardez une fenêtre avec votre token visible pour pouvoir le copier rapidement lors des tests !
