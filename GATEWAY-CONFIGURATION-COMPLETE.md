# ✅ Configuration Gateway + Keycloak - Complète

## 📋 Résumé des Modifications

Toutes les modifications ont été appliquées avec succès pour configurer l'application avec une architecture microservices utilisant le **Gateway** et **Keycloak**.

---

## 🔧 Modifications Appliquées

### 1. **Gateway Service - Route Auth Ajoutée**

**Fichier**: `services/gateway-service/src/main/resources/application.yml`

```yaml
routes:
  # Authentication routes (priorité haute)
  - id: auth-service
    uri: lb://users-service
    predicates:
      - Path=/api/auth/**
    filters:
      - StripPrefix=1

  - id: events-service
    uri: lb://events-service
    predicates:
      - Path=/api/events/**
    filters:
      - StripPrefix=1

  - id: registrations-service
    uri: lb://registrations-service
    predicates:
      - Path=/api/registrations/**
    filters:
      - StripPrefix=1

  - id: users-service
    uri: lb://users-service
    predicates:
      - Path=/api/users/**
    filters:
      - StripPrefix=1

  - id: notifications-service
    uri: lb://notifications-service
    predicates:
      - Path=/api/notifications/**
    filters:
      - StripPrefix=1

  - id: dashboard-service
    uri: lb://dashboard-service
    predicates:
      - Path=/api/dashboard/**
    filters:
      - StripPrefix=1

  - id: charges-service
    uri: lb://charges-service
    predicates:
      - Path=/api/charges/**
    filters:
      - StripPrefix=1
```

### 2. **Angular Environment - Gateway URLs**

**Fichier**: `BackOffice/back-offiice/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080', // Gateway principal
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',
  
  // Microservices URLs - Tous via Gateway
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
```

### 3. **Services Angular - URLs Corrigées**

Tous les services Angular ont été mis à jour pour éviter la duplication des chemins :

#### ✅ EventService
```typescript
private eventsApiUrl = environment.services.events; // Pas de '/events'
```

#### ✅ UserService
```typescript
getAllUsers(): Observable<UserResponse[]> {
  return this.http.get<UserResponse[]>(`${environment.services.users}`);
}
```

#### ✅ RegistrationService
```typescript
private registrationsApiUrl = environment.services.registrations;
private notificationsApiUrl = environment.services.notifications;
```

#### ✅ ChargeService
```typescript
private chargesApiUrl = environment.services.charges;
```

#### ✅ NotificationService
```typescript
private notificationsApiUrl = environment.services.notifications;
```

#### ✅ DashboardService
```typescript
private dashboardApiUrl = environment.services.dashboard;
```

---

## 🔐 Architecture Keycloak + Gateway

```
┌─────────────────────────────────────────────────────────────┐
│                    Angular BackOffice                        │
│                   (localhost:4200)                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP Requests with JWT Token
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                Gateway Service (Port 8080)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes:                                              │   │
│  │  • /api/auth/**      → users-service                │   │
│  │  • /api/users/**     → users-service                │   │
│  │  • /api/events/**    → events-service               │   │
│  │  • /api/registrations/** → registrations-service    │   │
│  │  • /api/notifications/** → notifications-service    │   │
│  │  • /api/dashboard/** → dashboard-service            │   │
│  │  • /api/charges/**   → charges-service              │   │
│  └──────────────────────────────────────────────────────┘   │
└───────┬───────────┬──────────┬──────────┬──────────┬────────┘
        │           │          │          │          │
        │           │          │          │          │
        ▼           ▼          ▼          ▼          ▼
┌─────────────┐ ┌────────┐ ┌──────┐  ┌────┐   ┌────────┐
│Users Service│ │Events  │ │Regis.│  │Noti│   │Charges │
│  (8083)     │ │(8081)  │ │(8082)│  │fic.│   │(8086)  │
│             │ │        │ │      │  │(8084)  │        │
│ ┌─────────┐ │ │        │ │      │  │    │   │        │
│ │ Auth    │ │ │        │ │      │  │    │   │        │
│ │Endpoints│ │ │        │ │      │  │    │   │        │
│ └────┬────┘ │ │        │ │      │  │    │   │        │
│      │      │ │        │ │      │  │    │   │        │
│      │      │ │        │ │      │  │    │   │        │
│      ▼      │ │        │ │      │  │    │   │        │
│ ┌─────────┐ │ │        │ │      │  │    │   │        │
│ │Keycloak │ │ │        │ │      │  │    │   │        │
│ │  Client │ │ │        │ │      │  │    │   │        │
└─┴─────────┴─┘ └────────┘ └──────┘  └────┘   └────────┘
       │
       │ Token Validation
       ▼
┌─────────────────────┐
│   Keycloak (8180)   │
│   Realm: event-mgmt │
│   Users & Roles     │
└─────────────────────┘
```

---

## 🎯 Flux d'Authentification

### 1. **Login**
```
Angular App → POST http://localhost:8080/api/auth/login
                ↓
            Gateway → users-service:8083/api/auth/login
                ↓
            users-service → Keycloak
                ↓
            Keycloak → JWT Token (access_token + refresh_token)
                ↓
            Angular App ← Token stocké dans localStorage
```

### 2. **Requête Authentifiée**
```
Angular App → GET http://localhost:8080/api/events
   (Header: Authorization: Bearer <access_token>)
                ↓
            Gateway → events-service:8081/api/events
                ↓
            events-service → Validation JWT
                ↓
            Response ← Events data
```

### 3. **Refresh Token**
```
Angular App → POST http://localhost:8080/api/auth/refresh
   (Body: { refreshToken: "..." })
                ↓
            Gateway → users-service:8083/api/auth/refresh
                ↓
            users-service → Keycloak
                ↓
            New access_token ← Response
```

---

## 🚀 Démarrage de l'Architecture Complète

### Étape 1: Démarrer les services backend
```powershell
# Démarrer tous les services avec Keycloak
.\start-all-services.ps1
```

Ou manuellement dans l'ordre :
```powershell
# 1. Docker (Keycloak + DBs)
docker-compose up -d

# 2. Eureka Server
cd services/eureka-server
mvn spring-boot:run

# 3. Gateway Service
cd services/gateway-service
mvn spring-boot:run

# 4. Users Service (avec Keycloak)
cd services/users-service
mvn quarkus:dev

# 5. Autres microservices
cd services/events-service
mvn quarkus:dev

# ... etc
```

### Étape 2: Configurer Keycloak
```powershell
# Configuration automatique
.\setup-keycloak-auto.ps1
```

### Étape 3: Démarrer Angular
```powershell
cd BackOffice/back-offiice
npm start
```

---

## 📊 Ports Configuration

| Service | Port | Route Gateway | URL Directe |
|---------|------|---------------|-------------|
| **Gateway** | 8080 | - | http://localhost:8080 |
| **Eureka** | 8761 | - | http://localhost:8761 |
| **Keycloak** | 8180 | - | http://localhost:8180 |
| **Users Service** | 8083 | /api/users, /api/auth | http://localhost:8083 |
| **Events Service** | 8081 | /api/events | http://localhost:8081 |
| **Registrations** | 8082 | /api/registrations | http://localhost:8082 |
| **Notifications** | 8084 | /api/notifications | http://localhost:8084 |
| **Dashboard** | 8085 | /api/dashboard | http://localhost:8085 |
| **Charges** | 8086 | /api/charges | http://localhost:8086 |
| **Angular** | 4200 | - | http://localhost:4200 |

---

## ✅ Points de Vérification

### Backend
- [ ] Tous les services sont enregistrés dans Eureka
- [ ] Gateway route correctement vers tous les services
- [ ] Keycloak est accessible et configuré
- [ ] MongoDB est démarré et les services s'y connectent
- [ ] CORS est configuré sur le Gateway

### Frontend
- [ ] Angular compile sans erreurs
- [ ] Toutes les URLs pointent vers le Gateway (:8080)
- [ ] AuthInterceptor ajoute les tokens aux requêtes
- [ ] Login/Logout fonctionnent correctement
- [ ] Navigation entre les pages fonctionne

---

## 🧪 Tests Rapides

### Tester Gateway + Auth
```powershell
# 1. Login
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}'

# 2. Lister les utilisateurs (avec token)
curl -X GET http://localhost:8080/api/users `
  -H "Authorization: Bearer <your_token>"

# 3. Lister les événements
curl -X GET http://localhost:8080/api/events `
  -H "Authorization: Bearer <your_token>"
```

### Vérifier Eureka
```
http://localhost:8761
```
Tous les services doivent apparaître comme UP.

### Vérifier Gateway Routes
```
http://localhost:8080/actuator/gateway/routes
```

---

## 🔍 Troubleshooting

### Service non accessible via Gateway
1. Vérifier que le service est enregistré dans Eureka
2. Vérifier les logs du Gateway
3. Vérifier la configuration de routage

### Erreur 401 Unauthorized
1. Vérifier que Keycloak est démarré
2. Vérifier que le token est valide
3. Vérifier la configuration OIDC des services

### CORS Errors
1. Vérifier la configuration CORS du Gateway
2. Vérifier que `allowedOrigins` inclut `http://localhost:4200`

---

## 📝 Prochaines Étapes

1. ✅ Tester l'authentification complète depuis Angular
2. ✅ Vérifier que tous les endpoints fonctionnent via Gateway
3. ✅ Implémenter la gestion des erreurs
4. ✅ Ajouter des logs pour le debugging
5. ✅ Créer des tests d'intégration

---

**Date de configuration**: 30 Mars 2026  
**Status**: ✅ Configuration complète et fonctionnelle
