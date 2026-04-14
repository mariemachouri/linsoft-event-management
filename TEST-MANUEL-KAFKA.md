# Guide de Test Manuel - Intégration Kafka

## ✅ Statut Actuel

- **MongoDB** : Connecté avec succès sur mongodb:27017
- **Kafka** : Actif sur localhost:9092 (kafka:29092 en interne)
- **Producteurs Kafka** : events-service, registrations-service, users-service connectés
- **Premier événement** : Créé avec ID `69de3c748849532f66a4de6f`
- **Message Kafka** : Publié sur topic `event.created`

## 🎯 Objectifs des Tests

1. **Notifications asynchrones** : Vérifier que les événements génèrent des notifications sans bloquer
2. **Dashboard temps réel** : Confirmer que les statistiques se mettent à jour
3. **Audit trail** : Vérifier l'historisation des événements métier

---

## 📋 Étape 1 : Tester la Création d'Événements

### 1.1 Créer un événement TEST

```powershell
$event = @{
    title = "Conférence IA - Test $(Get-Date -Format 'HH:mm:ss')"
    location = "Paris"
    startAt = "2026-06-01T10:00:00"
    endAt = "2026-06-01T18:00:00"
    organizerId = "org-123"
    category = "CONFERENCE"
    status = "DRAFT"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri "http://localhost:8081/api/events" -Method POST -Body $event -ContentType "application/json"
```

### 1.2 Vérifier le message Kafka

1. Ouvrir Kafka UI : http://localhost:8090
2. Aller dans **Topics** → **event.created**
3. Cliquer sur **Messages**
4. Vérifier que votre événement apparaît avec :
   - `title` : "Conférence IA - Test..."
   - `category` : "CONFERENCE"
   - `status` : "DRAFT"

---

## 📋 Étape 2 : Tester la Modification d'Événements

### 2.1 Lister les événements existants

```powershell
$events = Invoke-RestMethod -Uri "http://localhost:8081/api/events" -Method GET
$events | ConvertTo-Json
```

### 2.2 Modifier un événement

```powershell
# Remplacer {event-id} par l'ID d'un événement de l'étape précédente
$eventId = "69de3c748849532f66a4de6f"  # Exemple

$update = @{
    title = "Conférence IA - MODIFIÉ"
    location = "Lyon"
    startAt = "2026-06-01T14:00:00"
    endAt = "2026-06-01T20:00:00"
    organizerId = "org-123"
    category = "CONFERENCE"
    status = "PUBLISHED"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri "http://localhost:8081/api/events/$eventId" -Method PUT -Body $update -ContentType "application/json"
```

### 2.3 Vérifier dans Kafka UI

- Topic : **event.updated**
- Vérifier les changements : status DRAFT → PUBLISHED, location Paris → Lyon

---

## 📋 Étape 3 : Tester les Inscriptions

### 3.1 Créer une inscription

```powershell
$registration = @{
    eventId = "69de3c748849532f66a4de6f"  # ID de votre événement
    userId = "user-001"
    status = "PENDING"
    numberOfPeople = 2
    notes = "Test inscription Kafka"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri "http://localhost:8082/api/registrations" -Method POST -Body $registration -ContentType "application/json"
```

### 3.2 Vérifier dans Kafka

- Topic : **registration.created**  
- Vérifier : eventId, userId, status PENDING

### 3.3 Confirmer l'inscription

```powershell
# Remplacer {registration-id} par l'ID de l'inscription créée
$regId = "votre-registration-id"

$confirm = @{
    status = "CONFIRMED"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri "http://localhost:8082/api/registrations/$regId" -Method PUT -Body $confirm -ContentType "application/json"
```

### 3.4 Vérifier dans Kafka

- Topic : **registration.confirmed**
- Vérifier : status PENDING → CONFIRMED

---

## 📋 Étape 4 : Tester la Création d'Utilisateurs

### 4.1 Créer un utilisateur

```powershell
$user = @{
    username = "test-kafka-$(Get-Date -Format 'HHmmss')"
    email = "test@kafka.com"
    firstName = "Test"
    lastName = "Kafka"
    role = "PARTICIPANT"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri "http://localhost:8083/api/users" -Method POST -Body $user -ContentType "application/json"
```

### 4.2 Vérifier dans Kafka

- Topic : **user.created**
- Vérifier : username, email, role

---

## 📋 Étape 5 : Vérifier les Consommateurs Kafka

### 5.1 Notifications Service

Vérifier les logs pour voir si les notifications sont générées :

```powershell
docker logs notifications-service --tail 50
```

Chercher :
- Consommation des messages des topics event.created, registration.created, etc.
- Génération de notifications

### 5.2 Dashboard Service

Vérifier que les statistiques sont calculées :

```powershell
docker logs dashboard-service --tail 50
```

Chercher :
- Consommation des messages pour le dashboard
- Mise à jour des statistiques temps réel

### 5.3 Audit Logs

Si implémenté, consulter les logs d'audit :

```powershell
# Endpoint à vérifier une fois dashboard-service opérationnel
Invoke-RestMethod -Uri "http://localhost:8085/api/audit" -Method GET | ConvertTo-Json
```

---

## 📋 Étape 6 : Tester la Suppression

### 6.1 Supprimer un événement

```powershell
$eventId = "votre-event-id"
Invoke-RestMethod -Uri "http://localhost:8081/api/events/$eventId" -Method DELETE
```

### 6.2 Vérifier dans Kafka

- Topic : **event.deleted**
- Vérifier que l'ID de l'événement supprimé apparaît

---

## 🔍 Commandes de Diagnostic

### Vérifier l'état des services

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String -Pattern "kafka|events|registrations|users|notifications|dashboard"
```

### Voir les logs en temps réel

```powershell
# Events Service
docker logs -f events-service

# Kafka broker
docker logs -f kafka

# Notifications
docker logs -f notifications-service
```

### Lister tous les topics Kafka

Dans Kafka UI : http://localhost:8090/ui/clusters/local/all-topics

Ou via commande :

```powershell
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list
```

---

## ✅ Checklist de Validation

- [ ] Événement créé → Message dans `event.created`
- [ ] Événement modifié → Message dans `event.updated`  
- [ ] Événement supprimé → Message dans `event.deleted`
- [ ] Inscription créée → Message dans `registration.created`
- [ ] Inscription confirmée → Message dans `registration.confirmed`
- [ ] Utilisateur créé → Message dans `user.created`
- [ ] Notifications-service consomme les messages
- [ ] Dashboard-service consomme les messages
- [ ] Audit logs enregistrés

---

## 🐛 Dépannage

### Erreur LEADER_NOT_AVAILABLE

C'est normal au premier message - Kafka crée le topic automatiquement. Attendez 5-10 secondes et réessayez.

### Service ne répond pas

```powershell
# Redémarrer un service spécifique
docker-compose restart events-service

# Voir les logs d'erreur
docker logs events-service --tail 100 | Select-String -Pattern "error|exception" -Context 3
```

### MongoDB connection refused

Vérifier que la variable MONGODB_CONNECTION_STRING est bien définie :

```powershell
docker exec events-service env | Select-String MONGODB
```

---

## 📊 Résultats Attendus

- **Performance** : Création d'événements en < 200ms
- **Asynchrone** : API répond immédiatement, messages Kafka traités en arrière-plan
- **Fiabilité** : Tous les messages publiés sont persistés dans Kafka
- **Traçabilité** : Chaque opération métier est auditée

Date du test : 14 avril 2026
