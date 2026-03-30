# 🎉 Guide de Test - Users Service

## ✅ Configuration Complète

**Keycloak:**
- URL: http://localhost:8180
- Realm: `event-mgmt`
- Client ID: `users-service`
- Client Secret: `your-secure-client-secret-change-in-production`

**Utilisateur Test:**
- Username: `admin`
- Password: `admin123`
- Roles: admin (par défaut)

**Users Service:**
- URL: http://localhost:8083
- Swagger UI: http://localhost:8083/q/swagger-ui
- Status: ✅ **EN LIGNE**

---

## 📝 Tests dans Swagger UI

### 1️⃣ Authentification

#### Test 1: Login avec admin
```
POST /api/auth/login
```

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Réponse attendue:** ✅ Access Token + Refresh Token
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 300,
  "refresh_token": "eyJhbGc...",
  "refresh_expires_in": 1800
}
```

#### Test 2: Refresh Token
```
POST /api/auth/refresh
```

**Body:**
```json
{
  "refreshToken": "VOTRE_REFRESH_TOKEN"
}
```

#### Test 3: Logout
```
POST /api/auth/logout
```

**Body:**
```json
{
  "refreshToken": "VOTRE_REFRESH_TOKEN"
}
```

---

### 2️⃣ Autorisation dans Swagger

**Important:** Avant de tester les endpoints protégés:

1. Cliquez sur le bouton **"Authorize"** 🔓 en haut à droite
2. Dans le champ `bearerAuth`, collez votre access token (sans "Bearer")
3. Cliquez sur **"Authorize"** puis **"Close"**

---

### 3️⃣ Gestion du Profil Utilisateur

#### Test 4: Obtenir son profil
```
GET /api/profile
```

**Headers:** Authorization: Bearer {votre_access_token}

**Réponse attendue:**
```json
{
  "id": "14ec66f8-f3d1-4b88-8e33-42a955e5c875",
  "username": "admin",
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "emailVerified": true,
  "enabled": true,
  "roles": ["admin"]
}
```

#### Test 5: Mettre à jour son profil
```
PUT /api/profile
```

**Body:**
```json
{
  "firstName": "Admin Modifié",
  "lastName": "User Test",
  "email": "admin@example.com"
}
```

---

### 4️⃣ Gestion des Rôles (Admin uniquement)

#### Test 6: Lister tous les rôles
```
GET /api/roles
```

**Réponse attendue:**
```json
[
  {
    "id": "...",
    "name": "admin",
    "description": "Role admin"
  },
  {
    "id": "...",
    "name": "user",
    "description": "Role user"
  },
  {
    "id": "...",
    "name": "event-organizer",
    "description": "Role event-organizer"
  },
  {
    "id": "...",
    "name": "participant",
    "description": "Role participant"
  }
]
```

#### Test 7: Obtenir un rôle spécifique
```
GET /api/roles/{roleName}
```

Exemple: `GET /api/roles/admin`

---

## 🧪 Tests via curl (Terminal)

### Login
```powershell
curl.exe -X POST "http://localhost:8083/api/auth/login" `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"admin123\"}'
```

### Get Profile (avec token)
```powershell
$token = "VOTRE_ACCESS_TOKEN"
curl.exe -X GET "http://localhost:8083/api/profile" `
  -H "Authorization: Bearer $token"
```

### List Roles
```powershell
curl.exe -X GET "http://localhost:8083/api/roles" `
  -H "Authorization: Bearer $token"
```

---

## 🔐 Tests de Sécurité

### Test 8: Accès sans authentification (doit échouer)
```
GET /api/profile
```

**Sans Authorization header**

**Réponse attendue:** ❌ 401 Unauthorized

### Test 9: Token expiré (après 5 minutes)
```
GET /api/profile
```

**Avec un ancien token**

**Réponse attendue:** ❌ 401 Unauthorized

---

## 📊 Résumé des Endpoints Disponibles

| Endpoint | Méthode | Authentification | Description |
|----------|---------|------------------|-------------|
| `/api/auth/login` | POST | ❌ Public | Connexion |
| `/api/auth/refresh` | POST | ❌ Public | Rafraîchir token |
| `/api/auth/logout` | POST | ❌ Public | Déconnexion |
| `/api/profile` | GET | ✅ Requise | Obtenir profil |
| `/api/profile` | PUT | ✅ Requise | MAJ profil |
| `/api/roles` | GET | ✅ Admin | Liste rôles |
| `/api/roles/{name}` | GET | ✅ Admin | Détail rôle |
| `/q/health` | GET | ❌ Public | Health check |
| `/q/swagger-ui` | GET | ❌ Public | Documentation API |

---

## 🚀 Prochaines Étapes

1. **✅ TERMINÉ:** Users Service avec authentification Keycloak
2. **🔄 À FAIRE:** Tester Events Service (http://localhost:8081)
3. **🔄 À FAIRE:** Tester Registrations Service (http://localhost:8082)
4. **🔄 À FAIRE:** Intégrer l'authentification dans les autres services

---

## 🐛 Troubleshooting

### Problème: 401 Unauthorized
**Solution:** 
1. Vérifier que Keycloak est démarré: `docker ps | findstr keycloak`
2. Vérifier que le token n'est pas expiré (durée: 5 minutes)
3. Rafraîchir le token avec `/api/auth/refresh`

### Problème: Cannot connect to Keycloak
**Solution:**
```powershell
docker-compose up -d keycloak
```

### Problème: Port 8083 déjà utilisé
**Solution:**
```powershell
Get-NetTCPConnection -LocalPort 8083 | `
  Select-Object -ExpandProperty OwningProcess | `
  ForEach-Object { Stop-Process -Id $_ -Force }
```

---

## 🎯 Tests de Validation

| Test | Status | Résultat |
|------|--------|----------|
| Keycloak configuré | ✅ | Realm + Client + Roles + User |
| Login admin/admin123 | ✅ | Access token reçu |
| Users Service démarré | ✅ | Port 8083 en écoute |
| Swagger UI accessible | ✅ | http://localhost:8083/q/swagger-ui |
| GET /api/profile | ⏳ | À tester dans Swagger |
| PUT /api/profile | ⏳ | À tester dans Swagger |
| GET /api/roles | ⏳ | À tester dans Swagger |

**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Status Global:** ✅ **PRÊT POUR LES TESTS**
