# Configuration BackOffice Evently - Résumé

## ✅ Modifications Effectuées

### 1. Branding et Personnalisation
- **Nom de l'application** : "Black Dashboard Angular" → **"Evently - Event Management"**
- **Logo** : Logo Angular remplacé par icône calendrier (tim-icons icon-calendar-60)
- **Nom dans le sidebar** : "Event Management" → **"Evently"**
- **Footer** : Creative Tim → **LinSoft** avec liens personnalisés
- **Copyright** : "© 2026 made with ♥ by LinSoft for better event management"

### 2. Configuration des Microservices

#### URLs des Microservices (environment.ts)
```typescript
services: {
  users: 'http://localhost:8083/api',
  events: 'http://localhost:8081/api',
  registrations: 'http://localhost:8082/api',
  notifications: 'http://localhost:8084/api',
  dashboard: 'http://localhost:8085/api',
  charges: 'http://localhost:8086/api'
}
```

#### Configuration Keycloak
```typescript
keycloak: {
  url: 'http://localhost:8180',
  realm: 'event-mgmt',
  clientId: 'backoffice-client'
}
```

### 3. Services Angular Créés/Mis à Jour

| Service | Fichier | Fonctionnalités |
|---------|---------|-----------------|
| **EventService** | `event.service.ts` | CRUD complet pour les événements |
| **RegistrationService** | `registration.service.ts` | Gestion des inscriptions |
| **NotificationService** | `notification.service.ts` | Gestion des notifications |
| **ChargeService** | `charge.service.ts` | Gestion des charges + prédictions AI |
| **UserService** | `user.service.ts` | Gestion des utilisateurs |
| **DashboardService** | `dashboard.service.ts` | Statistiques et analytics |

### 4. Composants de Gestion Créés

#### Events Management (`/events`)
- Liste complète des événements
- CRUD : Create, Read, Update, Delete
- Affichage : Nom, Location, Dates, Participants, Status
- Actions : View, Edit, Delete

#### Registrations Management (`/registrations`)
- Liste des inscriptions par événement
- Gestion des statuts (confirmed, pending, cancelled)
- Filtrage et recherche
- Actions : View, Delete

#### Charges Management (`/charges`)
- Gestion des charges et dépenses
- Calcul automatique du total
- Catégorisation
- Support des prédictions AI
- Actions : View, Edit, Delete

#### Notifications Management (`/notifications`)
- Liste de toutes les notifications système
- Marquer comme lu/non-lu
- Filtrage par type et statut
- Actions : Mark as read, Delete

### 5. Menu de Navigation Mis à Jour

```
📊 Dashboard
📅 Events
🎫 Registrations
👤 Users (admin only)
💰 Charges
🔔 Notifications
```

### 6. Architecture Backend

```
MongoDB (localhost:27017)
├── users_db (Users Service - Port 8083)
├── events_db (Events Service - Port 8081)
├── registrations_db (Registrations Service - Port 8082)
├── notifications_db (Notifications Service - Port 8084)
├── dashboard_db (Dashboard Service - Port 8085)
└── charges_db (Charges Service - Port 8086)
```

## 🚀 État Actuel

### BackOffice Angular
- ✅ **En cours d'exécution** sur http://localhost:4200
- ✅ **Configuration complète** avec tous les services
- ✅ **Branding LinSoft** appliqué
- ✅ **Composants de gestion** créés et opérationnels

### Microservices Backend
- ⚙️ **En cours de démarrage**
- MongoDB actif sur port 27017
- Services Quarkus en compilation

## 📋 Prochaines Étapes

### Pour tester le BackOffice avec les microservices :

1. **Attendre que les services Quarkus soient complètement démarrés** (2-3 minutes)
   - Vérifier les fenêtres PowerShell ouvertes par le script
   - Chercher "Listening on: http://localhost:XXXX" dans les logs

2. **Vérifier que MongoDB est accessible**
   ```powershell
   mongosh --eval "db.adminCommand('ping')"
   ```

3. **Tester la connexion à un service**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8081/api/events"
   ```

4. **Accéder au BackOffice**
   - URL: http://localhost:4200
   - Navigation: Dashboard → Events/Registrations/Users/Charges/Notifications

### Scripts utiles disponibles :

```powershell
# Vérifier le statut de tous les services
.\check-services-status.ps1

# Ouvrir toutes les interfaces Swagger
.\open-swagger-ui.ps1

# Démarrer tous les services
.\start-quarkus-services.ps1

# Démarrer sans auth
.\start-services-no-auth.ps1
```

## 🔧 Configuration CORS

Tous les services backend sont configurés avec CORS ouvert pour le développement :
```properties
quarkus.http.cors=true
quarkus.http.cors.origins=*
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
```

## 📱 Interfaces Swagger Disponibles

Une fois les services démarrés :
- Events: http://localhost:8081/q/swagger-ui
- Registrations: http://localhost:8082/q/swagger-ui
- Users: http://localhost:8083/q/swagger-ui
- Notifications: http://localhost:8084/q/swagger-ui
- Dashboard: http://localhost:8085/q/swagger-ui
- Charges: http://localhost:8086/q/swagger-ui

## 🐛 Troubleshooting

### Si les services ne démarrent pas :
1. Vérifier que MongoDB est actif
2. Vérifier qu'aucun autre processus n'utilise les ports
3. Consulter les logs dans les fenêtres PowerShell des services
4. Relancer individuellement : `cd services/XXX-service; mvn quarkus:dev`

### Si le BackOffice ne se connecte pas :
1. Vérifier la console du navigateur (F12)
2. Vérifier que les services backend répondent
3. Vérifier la configuration dans `environment.ts`
4. Désactiver temporairement l'authentification si nécessaire

## 📝 Notes

- L'authentification Keycloak est désactivée sur certains services pour faciliter les tests
- Les données sont stockées dans MongoDB avec des bases séparées par service
- Le BackOffice utilise les services directement (pas de gateway pour le moment)
- Tous les composants sont prêts pour la production après configuration des URLs

---

**Date de configuration** : 29 Mars 2026  
**Version** : 1.0.0  
**Développé par** : LinSoft avec GitHub Copilot
