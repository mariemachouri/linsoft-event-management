# Rapport d'Avancement — 11 Mai 2026

## Résumé de la session

Séance de debugging et de corrections fonctionnelles end-to-end sur les modules **FrontOffice** et **BackOffice**, couvrant le flux d'inscription aux événements, la synchronisation des données entre services et la cohérence des filtres.

---

## Corrections effectuées

### 1. BackOffice — URLs API (ports directs)

**Problème :** Les environnements Angular pointaient vers le port 8080 (gateway) au lieu des ports directs des microservices.

**Correction :** Mise à jour de `environment.ts` et `environment.prod.ts` :
- events-service → `http://localhost:8081`
- registrations-service → `http://localhost:8082`
- users-service → `http://localhost:8083`

---

### 2. FrontOffice — Proxy Vite (0 événements affichés)

**Problème :** Le proxy Vite envoyait toutes les requêtes `/api/*` vers le port 8083 (users-service), empêchant le chargement des événements.

**Correction :** `vite.config.ts` — ajout de règles de proxy spécifiques par service :
```typescript
'/api/events'         → http://localhost:8081
'/api/registrations'  → http://localhost:8082
'/api'                → http://localhost:8083  (catch-all)
```

---

### 3. FrontOffice — Flux d'inscription (erreur 500 + CORS)

**Problème :** Cliquer sur "Register for this Event" échouait avec une erreur 500 et un rejet CORS. Trois causes distinctes :

1. CORS du registrations-service n'incluait pas `localhost:4300`
2. Le FrontOffice envoyait `userId` mais le modèle backend attend `participantId`
3. L'URL MongoDB du registrations-service pointait vers `localhost:27017` au lieu de `127.0.0.1:27018`

**Corrections :**
- `services/registrations-service/src/main/resources/application.properties` : CORS + URL MongoDB
- `services/events-service/src/main/resources/application.properties` : CORS
- `FrontOffice/src/pages/EventDetail/EventDetail.tsx` : `userId` → `participantId`
- `FrontOffice/src/services/registrations.service.ts` : mise à jour signature de `create()`

---

### 4. FrontOffice — Dashboard (0 inscriptions affichées)

**Problème :** Après une inscription réussie ("Registration successful !"), le dashboard affichait toujours 0 inscriptions.

**Cause :** Le type TypeScript `Registration` déclarait `userId` mais le backend persiste `participantId`. Le filtre `r.userId === auth.user.id` ne matchait donc jamais.

**Corrections :**
- `FrontOffice/src/types/index.ts` : `userId` → `participantId` dans l'interface `Registration`
- `FrontOffice/src/pages/Dashboard/Dashboard.tsx` : filtre corrigé `r.participantId === auth.user.id`
- `FrontOffice/src/services/registrations.service.ts` : helper `getUserRegistrations` corrigé

---

### 5. FrontOffice — Filtres événements non fonctionnels

**Problème :** Le filtre "Conferences" affichait "No events found" alors que des événements existent.

**Causes :**
1. Les catégories FrontOffice (`CONCERT`, `SPORT`, `NETWORKING`, `FESTIVAL`, `OTHER`) ne correspondent pas au modèle backend Java (`CONFERENCE`, `WORKSHOP`, `MEETUP`, `SEMINAR`)
2. Les événements créés sans catégorie ont `category=null`, ce qui faisait crasher le filtre

**Corrections :**
- `FrontOffice/src/types/index.ts` : `EventCategory` alignée sur le backend
- `FrontOffice/src/pages/Events/Events.tsx` : catégories corrigées + filtre null-safe

---

### 6. BackOffice — Catégorie non sauvegardée à la création/édition

**Problème :** La catégorie sélectionnée dans le formulaire BackOffice n'était pas persistée en base de données.

**Cause :** Le champ `category` était présent dans le `FormGroup` Angular mais oublié dans l'objet `eventData` envoyé au service dans `onSubmit()`.

**Corrections :**
- `BackOffice/back-offiice/src/app/pages/events-management/event-create/event-create.component.ts`
- `BackOffice/back-offiice/src/app/pages/events-management/event-edit/event-edit.component.ts`

```typescript
// Ajout dans eventData :
category: this.f['category'].value || undefined,
```

---

## État des services

| Service | Port | Statut |
|---|---|---|
| FrontOffice (React/Vite) | 4300 | ✅ Opérationnel |
| BackOffice (Angular) | 4200 | ✅ Opérationnel |
| events-service (Quarkus) | 8081 | ✅ Opérationnel |
| registrations-service (Quarkus) | 8082 | ✅ Opérationnel |
| users-service (Quarkus) | 8083 | ✅ Opérationnel |
| MongoDB | 27018 | ✅ Opérationnel |
| Keycloak | 8180 | ✅ Opérationnel |
| Kafka | 9092 | ⚠️ Non démarré (non bloquant) |

---

## Flux validés end-to-end

- ✅ Connexion utilisateur via Keycloak (FrontOffice)
- ✅ Affichage des événements dans le FrontOffice
- ✅ Inscription à un événement depuis la page détail
- ✅ Affichage des inscriptions dans le Dashboard utilisateur
- ✅ Création d'événement avec catégorie depuis le BackOffice
- ✅ Édition d'événement avec catégorie depuis le BackOffice
- ✅ Filtres par catégorie dans la liste des événements (FrontOffice)

---

## Fichiers modifiés

### BackOffice
- `BackOffice/back-offiice/src/environments/environment.ts`
- `BackOffice/back-offiice/src/environments/environment.prod.ts`
- `BackOffice/back-offiice/src/app/pages/events-management/event-create/event-create.component.ts`
- `BackOffice/back-offiice/src/app/pages/events-management/event-edit/event-edit.component.ts`

### FrontOffice
- `FrontOffice/vite.config.ts`
- `FrontOffice/src/types/index.ts`
- `FrontOffice/src/services/registrations.service.ts`
- `FrontOffice/src/pages/EventDetail/EventDetail.tsx`
- `FrontOffice/src/pages/Dashboard/Dashboard.tsx`
- `FrontOffice/src/pages/Events/Events.tsx`

### Services
- `services/events-service/src/main/resources/application.properties`
- `services/registrations-service/src/main/resources/application.properties`
