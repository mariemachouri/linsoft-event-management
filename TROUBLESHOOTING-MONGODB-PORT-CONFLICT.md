# Résolution du Conflit MongoDB Local vs Docker

**Date :** 3 Mai 2026  
**Symptôme :** `AuthenticationFailed` (code 18) sur Quarkus events-service malgré des credentials corrects  
**Durée de diagnostic :** ~2h

---

## Le Problème

### Symptôme observé
```
MongoSecurityException: Exception authenticating MongoCredential{mechanism=SCRAM-SHA-1, userName='admin', source='admin', password=<hidden>}
MongoCommandException: Command failed with error 18 (AuthenticationFailed)
```

### Cause racine
**Deux instances MongoDB écoutaient sur le port 27017 simultanément :**

| PID  | Processus           | Port              | Source                  |
|------|---------------------|-------------------|-------------------------|
| 4144 | com.docker.backend  | 0.0.0.0:27017     | Docker (container MongoDB) |
| 5468 | mongod              | 127.0.0.1:27017   | **MongoDB LOCAL Windows installé** |

Quand Quarkus (JVM sur localhost) tentait de se connecter à `localhost:27017`, Windows routait la connexion vers le MongoDB **local** (PID 5468) qui captait `127.0.0.1:27017` en priorité sur Docker.

Ce MongoDB local n'avait **aucun user configuré** → l'auth `admin/admin123` échouait systématiquement.

### Pourquoi c'était difficile à diagnostiquer
- `docker exec mongodb mongosh -u admin -p admin123 ... ping` retournait `{ ok: 1 }` ✅ (connexion depuis l'intérieur du container, pas de conflit)
- Les credentials étaient réellement corrects dans le container Docker
- Les env vars Quarkus étaient propres (pas d'override)
- Le `target/classes/application.properties` contenait bien les bonnes valeurs
- PowerShell masquait `<hidden>` dans les messages d'erreur Java → le password semblait vide alors qu'il ne l'était pas

---

## La Solution Appliquée (Court Terme)

### Changer le port Docker MongoDB de 27017 → 27018

**Fichier :** `docker-compose.yml`
```yaml
# AVANT
mongodb:
  ports:
    - "27017:27017"

# APRÈS
mongodb:
  ports:
    - "27018:27017"   # port hôte 27018, port container 27017
```

**Fichier :** `services/events-service/src/main/resources/application.properties`
```properties
# AVANT
quarkus.mongodb.connection-string=mongodb://admin:admin123@localhost:27017/?authSource=admin

# APRÈS (config explicite sur port 27018)
quarkus.mongodb.hosts=127.0.0.1:27018
quarkus.mongodb.credentials.username=admin
quarkus.mongodb.credentials.password=admin123
quarkus.mongodb.credentials.auth-source=admin
quarkus.mongodb.database=events_db
quarkus.mongodb.devservices.enabled=false
```

---

## Solution Permanente Recommandée

### Option A — Désactiver le service MongoDB local (recommandé)

> ⚠️ Nécessite PowerShell en **mode Administrateur**

```powershell
# Ouvrir PowerShell en tant qu'Administrateur, puis :

# Arrêter le service
Stop-Service -Name "MongoDB" -Force

# Empêcher le démarrage automatique
Set-Service -Name "MongoDB" -StartupType Disabled

# Vérifier
Get-Service -Name "MongoDB" | Select-Object Name, Status, StartType
```

### Option B — Changer le port du MongoDB local

Modifier `C:\Program Files\MongoDB\Server\X.X\bin\mongod.cfg` :
```yaml
net:
  port: 27019   # Changer de 27017 à un autre port
  bindIp: 127.0.0.1
```
Puis redémarrer le service : `Restart-Service MongoDB`

### Option C — Revenir au port 27017 après désactivation du MongoDB local

Une fois le MongoDB local désactivé (Option A), remettre dans `docker-compose.yml` :
```yaml
ports:
  - "27017:27017"
```
Et dans `application.properties` :
```properties
quarkus.mongodb.connection-string=mongodb://admin:admin123@localhost:27017/?authSource=admin
```

---

## État Actuel du Projet (après correction)

| Service         | Port Hôte | Port Interne | Status |
|----------------|-----------|--------------|--------|
| MongoDB Docker  | **27018** | 27017        | ✅ Running |
| MongoDB Local   | 27017     | —            | ⚠️ Toujours actif (non désactivable sans admin) |
| events-service  | 8081      | —            | ✅ Running |
| Keycloak        | 8180      | 8080         | ✅ Running |
| Angular BackOffice | 4200   | —            | ✅ Running |

---

## Commande de Vérification

Pour vérifier rapidement si le conflit existe sur votre machine :
```powershell
netstat -ano | Select-String ":27017 .* LISTEN"
# Si vous voyez DEUX lignes différentes avec des PIDs différents → conflit !

# Identifier les processus :
Get-Process -Id <PID1>, <PID2> | Select-Object Id, ProcessName, Path
```

---

## À Faire Au Prochain Démarrage

```powershell
# 1. Démarrer les containers Docker (MongoDB sur 27018)
cd "C:\Users\LYESS\Desktop\Event Management"
docker compose up -d keycloak-db keycloak mongodb

# 2. Vérifier MongoDB (port 27018 depuis l'hôte)
docker exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.adminCommand({ping:1})" --quiet

# 3. Démarrer events-service
cd services/events-service
mvn quarkus:dev -DskipTests

# 4. Démarrer BackOffice
cd "BackOffice/back-offiice"
$env:NODE_OPTIONS="--openssl-legacy-provider"
ng serve
```
