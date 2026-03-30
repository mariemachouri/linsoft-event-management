# 🚨 Guide de Démarrage Rapide - Situation Actuelle

## 📊 État Actuel du Système

### ❌ Problèmes Identifiés
1. **Docker/Keycloak**: Les conteneurs ne sont pas démarrés
2. **Eureka**: Seul Config Server est visible
3. **Services Quarkus**: Pas encore démarrés ou en cours de démarrage

---

## ✅ SOLUTION RAPIDE - Tester SANS Keycloak (RECOMMANDÉ)

Vous pouvez tester **maintenant** les fonctionnalités CRUD sans attendre Keycloak !

### Étape 1: Démarrer Events Service ⚡

Ouvrez un **nouveau terminal PowerShell** et exécutez:

```powershell
cd "C:\Users\LYESS\Desktop\Event Management\services\events-service"
mvn quarkus:dev
```

**Attendez** le message: `Quarkus X.X.X started in X.XXXs`

### Étape 2: Ouvrir Swagger et Tester 🎉

Une fois démarré, ouvrez: **http://localhost:8081/q/swagger-ui**

#### Test 1: Lister les événements
- Cliquer sur **GET /api/events**
- Cliquer sur **Try it out**
- Cliquer sur **Execute**
- Résultat: Liste vide `[]`

#### Test 2: Créer un événement
- Cliquer sur **POST /api/events**
- Cliquer sur **Try it out**
- Copier ce JSON:

```json
{
  "name": "Conférence Tech 2026",
  "description": "Une conférence sur les nouvelles technologies",
  "location": "Paris, France",
  "startDate": "2026-06-15T09:00:00",
  "endDate": "2026-06-15T18:00:00",
  "maxParticipants": 200
}
```

- Cliquer sur **Execute**
- **Succès!** Status 201, événement créé ✅

#### Test 3: Récupérer l'événement créé
- Copier l'**id** de la réponse (ex: `65abc123...`)
- Cliquer sur **GET /api/events/{id}**
- Coller l'ID
- **Execute**
- Vous voyez votre événement! ✅

#### Test 4: Lister à nouveau
- **GET /api/events**
- Maintenant vous voyez 1 événement dans la liste ✅

---

### Étape 3: Démarrer Plus de Services (Optionnel)

#### Registrations Service
**Nouveau terminal:**
```powershell
cd "C:\Users\LYESS\Desktop\Event Management\services\registrations-service"
mvn quarkus:dev
```

**Swagger**: http://localhost:8082/q/swagger-ui

#### Charges Service
**Nouveau terminal:**
```powershell
cd "C:\Users\LYESS\Desktop\Event Management\services\charges-service"
mvn quarkus:dev
```

**Swagger**: http://localhost:8086/q/swagger-ui

---

## 🔐 Pour Tester Users Service (Avec Authentification)

### Prérequis: Keycloak Doit Tourner

#### Option A: Utiliser Docker Desktop (Simple)

1. **Ouvrir Docker Desktop**
2. **Aller dans l'onglet Images**
3. **Télécharger manuellement ces images**:
   - `mongo:7.0`
   - `postgres:16-alpine`
   - `quay.io/keycloak/keycloak:24.0`

4. **Une fois téléchargées, dans PowerShell**:
```powershell
cd "C:\Users\LYESS\Desktop\Event Management"
docker-compose up -d
```

5. **Attendre 60 secondes**, puis:
```powershell
docker ps
```

Vous devriez voir 3 conteneurs: `mongodb`, `keycloak`, `keycloak-db`

6. **Configurer Keycloak**:
```powershell
.\setup-keycloak.ps1
```

7. **Redémarrer Users Service** (ou le démarrer s'il ne tourne pas):
```powershell
cd "C:\Users\LYESS\Desktop\Event Management\services\users-service"
mvn quarkus:dev
```

8. **Tester**: http://localhost:8083/q/swagger-ui

---

#### Option B: Utiliser MongoDB Local (Sans Docker)

Si Docker pose problème, installez MongoDB localement:

1. **Télécharger MongoDB**: https://www.mongodb.com/try/download/community
2. **Installer et démarrer** le service MongoDB
3. **Les services Quarkus fonctionneront** avec MongoDB local
4. **Users Service** nécessitera toujours Keycloak pour l'auth

---

## 🎯 QUE FAIRE MAINTENANT?

### Recommandation Simple ✅

**Testez Events Service MAINTENANT sans attendre Docker/Keycloak !**

1. Ouvrir un terminal
2. Exécuter:
```powershell
cd "C:\Users\LYESS\Desktop\Event Management\services\events-service"
mvn quarkus:dev
```
3. Attendre "Quarkus started"
4. Ouvrir: http://localhost:8081/q/swagger-ui
5. Créer et gérer des événements!

**C'est fonctionnel à 100% sans authentification!** 🎉

---

## 📞 Commandes de Vérification

### Vérifier les services actifs
```powershell
netstat -ano | findstr ":8081"  # Events
netstat -ano | findstr ":8082"  # Registrations
netstat -ano | findstr ":8083"  # Users
netstat -ano | findstr ":8086"  # Charges
```

### Vérifier Docker
```powershell
docker ps                        # Conteneurs actifs
docker images                    # Images téléchargées
```

### Vérifier Eureka
Ouvrir: http://localhost:8761

Si vous voyez des services enregistrés, c'est bon! ✅

---

## 🏁 Résumé des URL

| Service | URL Swagger | État Actuel |
|---------|------------|-------------|
| **Events** ⚡ | http://localhost:8081/q/swagger-ui | **À démarrer maintenant** |
| Registrations | http://localhost:8082/q/swagger-ui | Optionnel |
| Charges | http://localhost:8086/q/swagger-ui | Optionnel |
| Users | http://localhost:8083/q/swagger-ui | Nécessite Keycloak |
| Eureka | http://localhost:8761 | Déjà actif |

---

## 💡 Astuce

**Ne perdez pas de temps avec Docker/Keycloak si ça bloque.**

Démarrez **Events Service** et testez toutes les fonctionnalités CRUD immédiatement!

Vous pourrez configurer l'authentification plus tard quand Docker sera prêt.

---

## ❓ Besoin d'Aide?

**Problème de démarrage Quarkus?**
- Vérifiez que Java 21 est installé: `java -version`
- Vérifiez que Maven est installé: `mvn -version`

**Erreur de port déjà utilisé?**
```powershell
# Trouver le processus
netstat -ano | findstr ":8081"
# Tuer le processus (remplacer PID)
taskkill /PID <numero> /F
```

**Service ne démarre pas?**
- Vérifiez les logs dans le terminal
- Regardez s'il y a des erreurs de compilation
