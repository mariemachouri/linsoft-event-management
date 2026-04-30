# Rapport d'Avancement — 23 Avril 2026

**Projet :** Event Management — Backoffice Angular + Microservices Quarkus  
**Date :** 23 Avril 2026  
**Auteur :** Mariem

---

## 1. Activation Firebase Push Notifications — Côté Serveur

### 1.1 Problème — Firebase non initialisé au démarrage

**Symptôme :** Aucun log "Firebase initialized successfully" au démarrage du conteneur `notifications-service`.

**Cause racine :** En Quarkus, un bean `@ApplicationScoped` utilise un proxy CDI **lazy** — le `@PostConstruct` ne s'exécute qu'au **premier appel** du bean, pas au démarrage de l'application.

**Solution :** Ajout de l'annotation `@Startup` sur `PushSender.java` :

```java
// Fichier : services/notifications-service/src/main/java/com/eventmgmt/notifications/sender/PushSender.java
import io.quarkus.runtime.Startup;

@ApplicationScoped
@Startup  // ← Force l'initialisation au démarrage
public class PushSender {
    @PostConstruct
    void init() {
        // Firebase Admin SDK initialisé ici
    }
}
```

**Résultat :** Log confirmé dans le thread `main` au démarrage :
```
Firebase initialized successfully
```

### 1.2 Rebuild de l'image Docker

- Rebuild : `docker compose build notifications-service` → BUILD SUCCESS
- Redémarrage : `docker compose up -d notifications-service`
- Démarrage confirmé en 4.401s
- Firebase initialisé sur le thread `main` ✅

---

## 2. Activation Firebase Push Notifications — Côté Angular

### 2.1 Ajout du composant PushNotificationsComponent aux routes

**Problème :** `PushNotificationsComponent` existait dans le code source mais n'était ni déclaré dans le module ni routé — inaccessible depuis le navigateur.

**Fichiers modifiés :**

**`admin-layout.routing.ts`** — Ajout de l'import et de la route :
```typescript
import { PushNotificationsComponent } from "../../pages/push-notifications/push-notifications.component";

{ path: "push-notifications", component: PushNotificationsComponent },
```

**`admin-layout.module.ts`** — Ajout de l'import et de la déclaration :
```typescript
import { PushNotificationsComponent } from "../../pages/push-notifications/push-notifications.component";

declarations: [
  // ...
  PushNotificationsComponent,
]
```

**`sidebar.component.ts`** — Ajout de l'entrée dans le menu :
```typescript
{
  path: "/push-notifications",
  title: "Push Notifications",
  rtlTitle: "الإشعارات",
  icon: "icon-mobile",
  class: ""
},
```

**Résultat :** Page accessible à `http://localhost:4200/#/push-notifications` ✅

### 2.2 Correction de la clé VAPID

**Problème :** Faute de frappe dans la clé VAPID — un `0` (zéro) au lieu d'un `O` (lettre).

**Fichier :** `src/app/core/services/firebase-messaging.service.ts`

```typescript
// ❌ Avant — caractère incorrect
vapidKey: 'BHJvqEoG4HlhtNv7DQPyEDp0hbRlWGqwOZ3W2jBE0ShOpYb...'

// ✅ Après — clé correcte correspondant à Firebase Console
vapidKey: 'BHJvqEoG4HlhtNv7DQPyEDp0hbRlWGqwOZ3W2jBEOShOpYb...'
```

### 2.3 Correction — Token FCM non récupéré si permission déjà accordée

**Problème :** Quand la permission navigateur était déjà accordée depuis une session précédente, `checkPermission()` mettait `isPermissionGranted = true` mais ne récupérait **pas** le token FCM → `this.fcmToken` restait `null` → le bouton "Envoyer une notification de test" affichait "Veuillez d'abord activer les notifications".

**Fichier :** `push-notifications.component.ts`

```typescript
// ✅ Après — récupère le token silencieusement si permission déjà accordée
async checkPermission(): Promise<void> {
  if ('Notification' in window) {
    this.isPermissionGranted = Notification.permission === 'granted';
    if (this.isPermissionGranted) {
      const token = await this.firebaseMessaging.requestPermission();
      if (token) {
        this.fcmToken = token;
      }
    }
  }
}
```

### 2.4 Enregistrement explicite du Service Worker

**Problème :** Après suppression du cache du service worker Firebase dans Chrome DevTools, l'appel `getToken` échouait avec :
```
AbortError: Failed to execute 'subscribe' on 'PushManager': 
Subscription failed - no active Service Worker
```

**Solution :** Enregistrement explicite du service worker avant l'appel `getToken` :

```typescript
// Enregistre le SW avant de demander le token
let swRegistration: ServiceWorkerRegistration | undefined;
if ('serviceWorker' in navigator) {
  swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  await navigator.serviceWorker.ready;
}

const token = await getToken(this.messaging, {
  vapidKey: '...',
  serviceWorkerRegistration: swRegistration
});
```

---

## 3. Investigations FCM Token 401 — Problème Non Résolu

### 3.1 Erreur persistante

Malgré toutes les corrections ci-dessus, l'obtention du token FCM échoue systématiquement :

```
fcmregistrations.googleapis.com/v1/projects/event-mgmt-97441/registrations → 401
FirebaseError: Messaging: A problem occurred while subscribing the user to FCM: 
Request is missing required authentication credential. 
Expected OAuth 2 access token, login cookie or other valid authentication credential.
(messaging/token-subscribe-failed)
```

### 3.2 Vérifications effectuées

| Élément | Statut |
|---------|--------|
| Firebase Cloud Messaging API activée | ✅ |
| Firebase Installations API dans la liste des API autorisées | ✅ |
| FCM Registration API dans la liste des API autorisées | ✅ |
| Clé API "Browser key" — aucune restriction d'application | ✅ |
| Clé VAPID corrigée (typo 0→O) | ✅ |
| Service Worker enregistré avant getToken | ✅ |
| Cache Chrome vidé (Service Workers + Storage) | ✅ |

### 3.3 Piste à investiguer à la reprise

La cause probable est une **discordance entre la configuration Firebase dans `environment.ts`** et l'application Web réellement enregistrée dans Firebase Console.

**À vérifier :**
1. Firebase Console → Paramètres du projet → **Vos applications** → Web App
2. Comparer `apiKey`, `messagingSenderId`, `appId` avec les valeurs dans `environment.ts`
3. Vérifier que l'application Web est bien enregistrée (pas seulement un projet Firebase sans app Web liée)

---

## 4. État des Services

| Service | Port | Statut |
|---------|------|--------|
| MongoDB | 27017 | ✅ Healthy |
| Zookeeper | 2181 | ✅ Healthy |
| Kafka | 9092 | ✅ Healthy |
| Keycloak DB | 5433 | ✅ Running |
| Keycloak | 8180 | ✅ Running |
| Eureka Server | 8761 | ✅ Healthy |
| Config Server | 8888 | ✅ Running |
| Gateway Service | 8080 | ✅ Running |
| Notifications Service | 8084 | ✅ Running — Firebase initialisé ✅ |
| BackOffice Angular | 4200 | ✅ Running |

---

## 5. Récapitulatif des Fichiers Modifiés

| Fichier | Modification |
|---------|-------------|
| `services/notifications-service/src/.../sender/PushSender.java` | Ajout `@Startup` |
| `BackOffice/.../layouts/admin-layout/admin-layout.routing.ts` | Import + route `push-notifications` |
| `BackOffice/.../layouts/admin-layout/admin-layout.module.ts` | Import + déclaration `PushNotificationsComponent` |
| `BackOffice/.../components/sidebar/sidebar.component.ts` | Entrée "Push Notifications" dans le menu |
| `BackOffice/.../core/services/firebase-messaging.service.ts` | Correction clé VAPID + enregistrement SW explicite |
| `BackOffice/.../pages/push-notifications/push-notifications.component.ts` | `checkPermission()` récupère le token si permission déjà accordée |

---

## 6. À Faire — Prochaine Session

- [ ] Résoudre le FCM token 401 — vérifier la Web App dans Firebase Console
- [ ] Une fois token obtenu → tester l'envoi end-to-end via Swagger (`http://localhost:8084/q/swagger-ui`)
- [ ] Vérifier et démarrer `charges-service`
- [ ] Vérifier et démarrer `dashboard-service`
- [ ] (Optionnel) Intégration Twilio SMS
