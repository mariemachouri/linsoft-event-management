# 🔔 Guide d'Intégration Firebase Push Notifications

## ✅ Ce qui a été fait

### 1. Dépendances installées
- ✅ `firebase` v9.23.0
- ✅ `@angular/fire` v7.6.1

### 2. Fichiers créés

#### Service de notifications
- ✅ `src/app/core/services/firebase-messaging.service.ts`
  - Initialisation Firebase
  - Gestion des tokens FCM
  - Écoute des messages en temps réel

#### Service Worker
- ✅ `src/firebase-messaging-sw.js`
  - Gestion des notifications en arrière-plan
  - Affichage des notifications même quand l'app est fermée

#### Composant de test
- ✅ `src/app/pages/push-notifications/`
  - Interface pour activer les notifications
  - Affichage du token FCM
  - Liste des notifications reçues
  - Bouton de test

### 3. Configuration
- ✅ Firebase config ajoutée dans `environment.ts`
- ✅ Service worker ajouté dans `angular.json`

---

## 🚀 Prochaines étapes

### Étape 1 : Obtenir la clé VAPID de Firebase

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet `event-mgmt-97441`
3. Allez dans **Project Settings** (⚙️) > **Cloud Messaging**
4. Dans l'onglet **Cloud Messaging**, trouvez **Web Push certificates**
5. Cliquez sur **Generate key pair** si vous n'en avez pas
6. Copiez la clé VAPID (elle commence par `B...`)

### Étape 2 : Ajouter la clé VAPID

Modifiez le fichier :
```
src/app/core/services/firebase-messaging.service.ts
```

Ligne 51, remplacez :
```typescript
vapidKey: 'VOTRE_VAPID_KEY' // À remplacer
```

Par :
```typescript
vapidKey: 'BXXXxxxXXXxxxXXX...' // Votre vraie clé VAPID
```

### Étape 3 : Installer les dépendances

```powershell
cd BackOffice\back-offiice
npm install
```

### Étape 4 : Ajouter la route (optionnel)

Si vous voulez une page dédiée aux notifications, ajoutez dans votre routing :

```typescript
// Dans src/app/layouts/admin-layout/admin-layout.routing.ts
import { PushNotificationsComponent } from '../../pages/push-notifications/push-notifications.component';

{
  path: 'notifications-push',
  component: PushNotificationsComponent
}
```

Et dans le module :
```typescript
// Dans src/app/layouts/admin-layout/admin-layout.module.ts
import { PushNotificationsComponent } from '../../pages/push-notifications/push-notifications.component';

declarations: [
  // ... autres composants
  PushNotificationsComponent
]
```

### Étape 5 : Démarrer l'application

```powershell
npm start
```

---

## 🔧 Configuration Backend

### Ajouter le endpoint pour sauvegarder les tokens FCM

Dans `users-service`, ajoutez un endpoint pour stocker le token FCM :

```java
@PUT("/fcm-token")
public Response updateFcmToken(@RequestBody Map<String, String> request) {
    String userId = request.get("userId");
    String fcmToken = request.get("fcmToken");
    
    // Sauvegarder le token dans MongoDB
    userRepository.updateFcmToken(userId, fcmToken);
    
    return Response.ok().build();
}
```

### Télécharger la clé privée Firebase (pour le backend)

1. Dans Firebase Console : **Project Settings** > **Service Accounts**
2. Cliquez sur **Generate new private key**
3. Téléchargez le fichier JSON
4. Placez-le dans `services/notifications-service/config/firebase-credentials.json`

### Activer Firebase dans docker-compose.yml

```yaml
notifications-service:
  environment:
    - FIREBASE_ENABLED=true
    - FIREBASE_CREDENTIALS_PATH=config/firebase-credentials.json
  volumes:
    - ./services/notifications-service/config:/app/config
```

---

## 📝 Utilisation

### 1. Dans l'application Angular

```typescript
// Dans n'importe quel composant
constructor(private firebaseMessaging: FirebaseMessagingService) {}

ngOnInit() {
  // Demander la permission
  this.firebaseMessaging.requestPermission();
  
  // Écouter les messages
  this.firebaseMessaging.getMessages$().subscribe(message => {
    console.log('Notification reçue:', message);
  });
}
```

### 2. Envoyer une notification depuis le backend

```bash
POST http://localhost:8084/api/notifications
Content-Type: application/json

{
  "recipientId": "FCM_TOKEN_HERE",
  "type": "PUSH",
  "message": "Votre événement commence dans 1 heure !",
  "status": "PENDING"
}
```

### 3. Via Kafka (automatique)

Quand un événement est créé/modifié, le `notifications-service` recevra automatiquement le message Kafka et enverra les notifications push aux utilisateurs concernés.

---

## 🧪 Tester les notifications

1. **Ouvrir l'app** : http://localhost:4200
2. **Activer les notifications** : Cliquez sur le bouton "Activer"
3. **Autoriser dans le navigateur**
4. **Copier le token FCM** affiché
5. **Envoyer un test** via Swagger ou curl :

```bash
curl -X POST http://localhost:8084/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "VOTRE_TOKEN_FCM",
    "type": "PUSH",
    "message": "Test de notification !",
    "status": "PENDING"
  }'
```

---

## 🐛 Troubleshooting

### Problème : Permission refusée
- Vérifiez les paramètres de notification de votre navigateur
- Réinitialisez les permissions : chrome://settings/content/notifications

### Problème : Service worker ne se charge pas
- Vérifiez que `firebase-messaging-sw.js` est dans `src/`
- Vérifiez `angular.json` : le fichier doit être dans `assets`
- Hard refresh : Ctrl+Shift+R

### Problème : Token FCM non généré
- Vérifiez que la clé VAPID est correcte
- Vérifiez la configuration Firebase
- Consultez la console du navigateur

---

## 📚 Ressources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [AngularFire Documentation](https://github.com/angular/angularfire)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)

---

## ✅ Checklist finale

- [ ] Clé VAPID ajoutée dans `firebase-messaging.service.ts`
- [ ] `npm install` exécuté
- [ ] Route ajoutée (optionnel)
- [ ] Backend configuré avec le fichier JSON Firebase
- [ ] Test de notification réussi
- [ ] Notifications Kafka intégrées

**👉 Une fois tout fait, les notifications push seront opérationnelles ! 🎉**
