# Guide de Résolution - Problème d'Authentification

## 🔴 Problème Constaté
```
POST http://localhost:8083/api/auth/login
401 Unauthorized
{
  "message": "Invalid credentials"
}
```

## 🔍 Diagnostic

Le problème vient de **Keycloak qui n'est pas démarré** ou **pas configuré**.

### Vérification Rapide
```powershell
# Vérifier si les conteneurs Docker sont actifs
docker-compose ps

# Vérifier si Keycloak répond
curl http://localhost:8180
```

---

## 🛠️ Solutions

### Solution 1: Démarrer et Configurer Keycloak (Recommandé)

#### Étape 1: Démarrer les conteneurs Docker
```powershell
docker-compose up -d
```

**⏱️ Temps estimé**: 
- Première fois (téléchargement des images): 5-10 minutes
- Démarrages suivants: 30-60 secondes

#### Étape 2: Attendre que Keycloak soit prêt
```powershell
# Attendre environ 60 secondes
Start-Sleep -Seconds 60

# Vérifier que Keycloak répond
curl http://localhost:8180
```

#### Étape 3: Configurer Keycloak
```powershell
.\setup-keycloak.ps1
```

Suivez les instructions du script pour:
1. Créer le realm `event-mgmt`
2. Créer le client `users-service`
3. Créer les rôles (admin, user, event-organizer, participant)
4. Créer l'utilisateur admin avec le mot de passe `admin123`

#### Étape 4: Redémarrer le Users Service
Dans la fenêtre où Users Service est en cours d'exécution, appuyez sur **Ctrl+C** puis:
```powershell
mvn quarkus:dev
```

#### Étape 5: Tester à nouveau
Ouvrir Swagger UI: http://localhost:8083/q/swagger-ui

Essayer le login:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

---

### Solution 2: Tester les Autres Services (Sans Authentification)

En attendant que Keycloak soit configuré, vous pouvez tester les autres services qui n'ont pas de dépendance forte à Keycloak:

#### Events Service
```powershell
cd services\events-service
mvn quarkus:dev
```

**Swagger UI**: http://localhost:8081/q/swagger-ui

**Tests sans authentification**:
- ✅ GET /api/events (liste des événements)
- ✅ POST /api/events (créer un événement)
- ✅ GET /api/events/{id} (obtenir un événement)
- ✅ DELETE /api/events/{id} (supprimer)

**Exemple de création d'événement**:
```json
{
  "name": "Conférence Tech 2026",
  "description": "Une conférence sur les technologies",
  "location": "Paris, France",
  "startDate": "2026-06-15T09:00:00",
  "endDate": "2026-06-15T18:00:00",
  "maxParticipants": 200
}
```

---

#### Registrations Service
```powershell
cd services\registrations-service
mvn quarkus:dev
```

**Swagger UI**: http://localhost:8082/q/swagger-ui

**Tests sans authentification**:
- ✅ GET /api/registrations
- ✅ POST /api/registrations
- ✅ GET /api/registrations/{id}
- ✅ DELETE /api/registrations/{id}

---

#### Charges Service
```powershell
cd services\charges-service
mvn quarkus:dev
```

**Swagger UI**: http://localhost:8086/q/swagger-ui

**Tests sans authentification**:
- ✅ GET /api/charges
- ✅ POST /api/charges
- ✅ GET /api/charges/by-event/{eventId}
- ✅ DELETE /api/charges/{id}

---

### Solution 3: Désactiver Temporairement l'Authentification (Dev Uniquement)

⚠️ **Attention**: À utiliser uniquement pour le développement/test!

#### Modifier application.properties
Fichier: `services/users-service/src/main/resources/application.properties`

Commenter les lignes d'authentification:
```properties
# Désactiver l'authentification temporairement
#quarkus.http.auth.permission.authenticated.paths=/api/*
#quarkus.http.auth.permission.authenticated.policy=authenticated
```

Puis redémarrer le service.

---

## 📋 Checklist de Vérification

Avant de tester l'authentification:

- [ ] Docker Desktop est démarré
- [ ] `docker-compose ps` montre 3 conteneurs actifs (mongodb, keycloak, keycloak-db)
- [ ] http://localhost:8180 répond (page Keycloak)
- [ ] http://localhost:27017 (MongoDB est accessible)
- [ ] Keycloak a été configuré avec `.\setup-keycloak.ps1`
- [ ] Le realm `event-mgmt` existe dans Keycloak
- [ ] L'utilisateur `admin` existe avec le mot de passe `admin123`
- [ ] Users Service a été redémarré après la configuration

---

## 🔧 Commandes de Diagnostic

### Vérifier Docker
```powershell
# Statut Docker Desktop
docker version

# Conteneurs actifs
docker-compose ps

# Logs Keycloak
docker-compose logs keycloak

# Logs MongoDB
docker-compose logs mongodb
```

### Vérifier les Services
```powershell
# État de tous les services
.\check-services-status.ps1

# Tester Keycloak manuellement
curl http://localhost:8180/realms/event-mgmt
```

### Ports Utilisés
```powershell
# Vérifier les ports
netstat -ano | findstr "8180"  # Keycloak
netstat -ano | findstr "27017" # MongoDB
netstat -ano | findstr "8083"  # Users Service
```

---

## 🎯 Plan d'Action Recommandé

### Si Docker télécharge encore les images
1. ⏳ Attendre la fin du téléchargement
2. ✅ Tester les autres services (Events, Registrations, Charges)
3. 📚 Lire la documentation pendant ce temps

### Une fois Docker prêt
1. ✅ Lancer `docker-compose up -d`
2. ⏱️ Attendre 60 secondes
3. 🔧 Exécuter `.\setup-keycloak.ps1`
4. 🔄 Redémarrer Users Service
5. 🧪 Tester l'authentification

---

## 📞 Support

Si le problème persiste:

1. **Vérifier les logs**:
   ```powershell
   docker-compose logs -f keycloak
   ```

2. **Créer manuellement l'utilisateur dans Keycloak**:
   - Ouvrir http://localhost:8180
   - Login: admin/admin
   - Créer le realm `event-mgmt`
   - Créer l'utilisateur `admin` avec le mot de passe `admin123`
   - Assigner le rôle `admin`

3. **Utiliser les autres services** en attendant que Users Service soit opérationnel

---

## ✅ Test Rapide Sans Keycloak

Pour tester rapidement les fonctionnalités CRUD sans authentification:

```powershell
# Démarrer Events Service
cd services\events-service
mvn quarkus:dev
```

Puis dans Swagger (http://localhost:8081/q/swagger-ui):

1. **Créer un événement** (POST /api/events)
2. **Lister les événements** (GET /api/events)
3. **Obtenir un événement** (GET /api/events/{id})
4. **Supprimer** (DELETE /api/events/{id})

Tous ces tests fonctionnent **sans authentification** ! 🎉
