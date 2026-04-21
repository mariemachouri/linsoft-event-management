# 🚀 Guide Rapide - Notifications Push Firebase

## ✅ Configuration Terminée !

### Ce qui est fait :
- ✅ Clé VAPID configurée
- ✅ Firebase et AngularFire installés (105 packages)
- ✅ Service FirebaseMessagingService créé
- ✅ Service Worker configuré
- ✅ Composant de test prêt

---

## 📋 Prochaine Étape : Télécharger la Clé Privée Backend

### 1. Aller sur Firebase Console : Service Accounts

**URL directe :**
https://console.firebase.google.com/project/event-mgmt-97441/settings/serviceaccounts/adminsdk

### 2. Télécharger la clé

1. Cliquez sur **"Générer une nouvelle clé privée"**
2. Téléchargez le fichier JSON
3. Renommez-le : `firebase-credentials.json`

### 3. Placer le fichier

```
Event Management/
└── services/
    └── notifications-service/
        └── config/
            └── firebase-credentials.json  ← ICI
```

**Créer le dossier si nécessaire :**
```powershell
mkdir "services\notifications-service\config"
# Puis déplacer le fichier téléchargé dedans
```

---

## 🧪 Tester les Notifications Push

### Option 1 : Via l'Interface Web (Recommandé)

```powershell
# 1. Démarrer l'application
cd BackOffice\back-offiice
npm start

# 2. Ouvrir http://localhost:4200
# 3. Modifier le menu pour ajouter le lien (voir ci-dessous)
```

### Option 2 : Test Direct Sans Interface

Vous pouvez tester Firebase sans créer de page dans le menu en ajoutant temporairement ce code dans `app.component.ts` :

```typescript
// BackOffice/back-offiice/src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { FirebaseMessagingService } from './core/services/firebase-messaging.service';

export class AppComponent implements OnInit {
  constructor(private firebaseMsg: FirebaseMessagingService) {}
  
  ngOnInit() {
    // Test Firebase au démarrage
    this.testFirebase();
  }
  
  async testFirebase() {
    const token = await this.firebaseMsg.requestPermission();
    console.log('🔔 FCM Token:', token);
    
    // Écouter les messages
    this.firebaseMsg.getMessages$().subscribe(msg => {
      console.log('📩 Message reçu:', msg);
    });
  }
}
```

---

## 🎯 Envoyer une Notification de Test

### 1. Démarrer les services backend
```powershell
docker-compose up -d
```

### 2. Récupérer le token FCM

Ouvrez la console du navigateur (F12), vous verrez :
```
🔔 FCM Token: eXXX...XXX
```

Copiez ce token.

### 3. Envoyer via Swagger

1. Ouvrir : http://localhost:8084/swagger-ui
2. Aller à : `POST /api/notifications`
3. Envoyer :

```json
{
  "recipientId": "VOTRE_TOKEN_FCM_ICI",
  "type": "PUSH",
  "message": "🎉 Test de notification push !",
  "status": "PENDING"
}
```

### 4. Envoyer via PowerShell

```powershell
$token = "VOTRE_TOKEN_FCM_ICI"

$body = @{
    recipientId = $token
    type = "PUSH"
    message = "🎉 Hello depuis PowerShell !"
    status = "PENDING"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8084/api/notifications" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

---

## 📱 Ajouter au Menu (Optionnel)

### Étape 1 : Ajouter le composant au module

Fichier : `src/app/layouts/admin-layout/admin-layout.module.ts`

```typescript
import { PushNotificationsComponent } from '../../pages/push-notifications/push-notifications.component';

@NgModule({
  imports: [
    // ... autres imports
  ],
  declarations: [
    // ... autres composants
    PushNotificationsComponent  // ← Ajouter ici
  ]
})
```

### Étape 2 : Ajouter la route

Fichier : `src/app/layouts/admin-layout/admin-layout.routing.ts`

```typescript
import { PushNotificationsComponent } from '../../pages/push-notifications/push-notifications.component';

export const AdminLayoutRoutes: Routes = [
  // ... autres routes
  {
    path: 'push-notifications',
    component: PushNotificationsComponent
  }
];
```

### Étape 3 : Ajouter au menu

Fichier : `src/app/components/sidebar/sidebar.component.ts`

```typescript
export const ROUTES: RouteInfo[] = [
  // ... autres items
  {
    path: '/push-notifications',
    title: 'Notifications Push',
    icon: 'icon-bell-55',
    class: ''
  }
];
```

---

## 🐛 Troubleshooting

### Problème : Permission refusée
**Solution :** Réinitialisez les permissions du navigateur
- Chrome : `chrome://settings/content/notifications`
- Cherchez `localhost:4200` et supprimez
- Rafraîchissez la page (Ctrl+Shift+R)

### Problème : Token FCM non généré
**Vérifier :**
1. Clé VAPID correcte dans `firebase-messaging.service.ts`
2. Console navigateur pour les erreurs
3. Service worker enregistré : `chrome://serviceworker-internals`

### Problème : Notification ne s'affiche pas
**Vérifier :**
1. Backend : Firebase credentials configuré
2. Notification envoyée : vérifier logs du notifications-service
3. Token correct : celui affiché dans la console

---

## ✅ Checklist Finale

- [x] Clé VAPID configurée
- [x] Dépendances installées
- [ ] Clé privée backend téléchargée et placée
- [ ] Application démarrée
- [ ] Token FCM obtenu
- [ ] Test notification envoyé et reçu
- [ ] Route ajoutée au menu (optionnel)

---

## 🎉 Résultat Attendu

Quand tout fonctionne :

1. **Application démarre** sans erreur
2. **Permission accordée** dans le navigateur
3. **Token FCM** affiché dans la console
4. **Notification de test** reçue (même app fermée !)
5. **Kafka events** déclenchent des notifications push automatiquement

---

## 📞 Support

**Fichiers de référence :**
- Guide complet : `BackOffice/FIREBASE-PUSH-INTEGRATION.md`
- Récap : `FIREBASE-PUSH-RECAP.md`
- Service : `BackOffice/back-offiice/src/app/core/services/firebase-messaging.service.ts`

**Logs importants :**
- Console navigateur (F12)
- `docker logs notifications-service`
- Network tab pour voir les requêtes Firebase

---

**👉 Prochaine action : Télécharger la clé privée backend !**

https://console.firebase.google.com/project/event-mgmt-97441/settings/serviceaccounts/adminsdk
