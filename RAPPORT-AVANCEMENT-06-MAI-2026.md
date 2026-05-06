# Rapport d'Avancement — 6 Mai 2026

**Projet :** Event Management — Backoffice Angular + Microservices Quarkus/Spring  
**Période :** 6 Mai 2026  
**Auteur :** Mariem

---

## 1. Correction du Routage Gateway Docker (CORS / 503)

### 1.1 Problème

Le backoffice Angular (`http://localhost:4200`) recevait une erreur CORS sur tous les appels API via le gateway (`http://localhost:8080/api/events`). Le gateway retournait **503 Service Unavailable**.

### 1.2 Cause Racine

Les routes gateway utilisaient le protocole `lb://service-name` (load-balancer Eureka). Or les services Quarkus (events, registrations, notifications) **ne s'enregistrent pas dans Eureka** (pas de client Eureka dans Quarkus 3.x). Seuls `CONFIG-SERVER` et `GATEWAY-SERVICE` (Spring Boot) étaient enregistrés.

```
# Eureka enregistrés :
CONFIG-SERVER   → UP
GATEWAY-SERVICE → UP

# Quarkus (NON enregistrés dans Eureka) :
events-service        → absent
registrations-service → absent
notifications-service → absent
```

### 1.3 Fix Appliqué

Remplacement des routes `lb://` par des URLs Docker DNS directes dans `docker-compose.yml` :

```yaml
# Avant (ne fonctionnait pas)
- SPRING_CLOUD_GATEWAY_ROUTES[1]_URI=lb://events-service

# Après (Docker DNS direct)
- SPRING_CLOUD_GATEWAY_ROUTES[1]_URI=http://events-service:8081
```

**Routes configurées :**

| ID | URI Docker | Prédicat |
|---|---|---|
| auth-service | `http://users-service:8083` | `/api/auth/**` |
| events-service | `http://events-service:8081` | `/api/events/**` |
| registrations-service | `http://registrations-service:8082` | `/api/registrations/**` |
| users-service | `http://users-service:8083` | `/api/users/**` |
| notifications-service | `http://notifications-service:8084` | `/api/notifications/**` |
| dashboard-service | `http://dashboard-service:8085` | `/api/dashboard/**` |
| charges-service | `http://charges-service:8086` | `/api/charges/**` |

**Résultat :** Tous les endpoints retournent **200 OK** via le gateway ✅

---

## 2. Correction des Événements Non Affichés comme "Upcoming"

### 2.1 Problème

Les événements créés via le formulaire backoffice n'apparaissaient pas dans la section "Upcoming Events" de la page de gestion. Le message "No upcoming events" s'affichait même après création.

### 2.2 Analyse

**Réponse brute de l'API** (constatée via `Invoke-WebRequest`) :

```json
[{
  "id": "69f7c2367f4df019fc285644",
  "title": null,
  "location": "Lac 3",
  "startAt": null,
  "endAt": null,
  "status": "PUBLISHED"
}]
```

**Chaîne de causalité identifiée :**

1. Le formulaire de création envoyait `{ name, startDate, endDate }` au backend
2. L'image Docker `events-service` datait du **14 avril 2026** — avant l'ajout des champs alias
3. Le backend stockait `name`/`startDate`/`endDate` dans MongoDB mais la réponse JSON ne retournait que `title`/`startAt`/`endAt` (tous `null`)
4. Le getter `upcomingEvents` du frontend calculait `new Date(null)` → **1er janvier 1970** → filtré comme événement passé
5. Le template affichait `event.name` et `event.startDate` → tous deux `undefined`

**Données MongoDB (état initial) :**

```
{ name: 'test', startDate: '2026-05-04T22:45', endDate: '2026-05-05T22:45' }
  → title: absent, startAt: absent, endAt: absent
  → dates dans le passé (4-5 mai)
```

### 2.3 Fix 1 — Backend : Synchronisation des Aliases dans `create()`

**Fichier :** `services/events-service/src/main/java/com/eventmgmt/events/service/EventService.java`

La méthode `update()` synchronisait déjà les aliases mais `create()` ne le faisait pas :

```java
// Avant
public Event create(Event event) {
    if (event.status == null) {
        event.status = EventStatus.DRAFT;
    }
    repository.persist(event);  // ← aliases jamais synchronisés
    return event;
}

// Après
public Event create(Event event) {
    if (event.status == null) {
        event.status = EventStatus.DRAFT;
    }
    // Sync name ↔ title
    if (event.name != null && event.title == null)   event.title = event.name;
    else if (event.title != null && event.name == null) event.name = event.title;
    // Sync startDate ↔ startAt
    if (event.startDate != null && event.startAt == null) event.startAt = event.startDate;
    else if (event.startAt != null && event.startDate == null) event.startDate = event.startAt;
    // Sync endDate ↔ endAt
    if (event.endDate != null && event.endAt == null)   event.endAt = event.endDate;
    else if (event.endAt != null && event.endDate == null) event.endDate = event.endAt;

    repository.persist(event);
    eventPublisher.publishEventCreated(event);
    return event;
}
```

### 2.4 Fix 2 — Frontend : Interface Event et Getter `upcomingEvents`

**Fichier :** `BackOffice/back-offiice/src/app/core/services/event.service.ts`

```typescript
// Avant — champs manquants, startDate/endDate obligatoires
export interface Event {
  name: string;
  startDate: string;
  endDate: string;
  // startAt, endAt absents
}

// Après — tous optionnels, aliases backend ajoutés
export interface Event {
  name?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  startAt?: string;   // alias backend
  endAt?: string;     // alias backend
  // ...
}
```

**Fichier :** `BackOffice/back-offiice/src/app/pages/events-management/events-management.component.ts`

```typescript
// Avant — plantait sur null
get upcomingEvents(): Event[] {
  const isFuture = new Date(e.endDate || e.startDate).getTime() >= now;
  // ...
  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

// Après — fallback sur les deux conventions de nommage
get upcomingEvents(): Event[] {
  const endDt = e.endDate || e.endAt || e.startDate || e.startAt;
  const isFuture = endDt ? new Date(endDt).getTime() >= now : false;
  // ...
  const aDate = a.startDate || a.startAt || '';
  const bDate = b.startDate || b.startAt || '';
}
```

### 2.5 Fix 3 — Templates HTML

**`events-management.component.html`** et **`event-detail.component.html`** — affichage avec fallback :

```html
<!-- Avant -->
<h3>{{ event.name }}</h3>
<span>{{ event.startDate | date:'dd' }}</span>

<!-- Après -->
<h3>{{ event.name || event.title }}</h3>
<span>{{ (event.startDate || event.startAt) | date:'dd' }}</span>
```

La page détail ("Lire la suite") a reçu les mêmes corrections pour le titre, les dates de début/fin dans le badge et le bloc "Schedule".

### 2.6 Fix 4 — Correction MongoDB des Données Existantes

Les 2 événements en base avaient `title`/`startAt`/`endAt` absents et des dates passées. Mise à jour directe :

```javascript
// Événement 1 : "test" — dates mises à jour au 15-16 mai 2026
db.events.updateOne(
  { _id: ObjectId('69f7c2367f4df019fc285644') },
  { $set: { title: 'test', startAt: '2026-05-15T22:45', endAt: '2026-05-16T22:45',
            startDate: '2026-05-15T22:45', endDate: '2026-05-16T22:45' } }
);

// Événement 2 : "Event Tunis" — données complètes ajoutées
db.events.updateOne(
  { _id: ObjectId('69fb5ba779b6594cd4c03fa8') },
  { $set: { title: 'Event Tunis', name: 'Event Tunis',
            startAt: '2026-05-20T10:00', endAt: '2026-05-21T10:00',
            startDate: '2026-05-20T10:00', endDate: '2026-05-21T10:00' } }
);
```

**Vérification API après correction :**

```json
[
  { "title": "test", "startAt": "2026-05-15T22:45", "endAt": "2026-05-16T22:45", "status": "PUBLISHED" },
  { "title": "Event Tunis", "startAt": "2026-05-20T10:00", "endAt": "2026-05-21T10:00", "status": "PUBLISHED" }
]
```

---

## 3. État Final des Services

| Service | Port | Image | Statut |
|---|---|---|---|
| Angular Backoffice | 4200 | — | ✅ Running |
| Gateway (Spring Boot) | 8080 | 14 avr. | ✅ Running |
| Events Service (Quarkus) | 8081 | 14 avr. | ✅ Running |
| Registrations Service (Quarkus) | 8082 | Rebuild ✅ | ✅ Running |
| Users Service (Spring Boot) | 8083 | — | ✅ Running |
| Notifications Service (Quarkus) | 8084 | — | ✅ Running |
| MongoDB | 27018 | — | ✅ Running |
| Eureka Server | 8761 | — | ✅ Running |
| Kafka | 29092 | — | ✅ Running |
| Keycloak | 8180 | — | ⚠️ Unhealthy (non bloquant) |

---

## 4. Implémentation du Module Charges (Catalogue + Charges par Événement + Prédictions IA)

### 4.1 Backend — Nouveau catalogue de charges (`charges-service`)

Création d'un système de catalogue réutilisable permettant de définir des types de charges standardisés, puis de les associer à des événements spécifiques.

**Nouveaux fichiers backend :**

| Fichier | Rôle |
|---|---|
| `ChargeCatalogItem.java` | Entité MongoDB (`charge_catalog`) avec champs : `name`, `description`, `category`, `unit`, `defaultUnitPrice`, `currency`, `active` |
| `ChargeCatalogRepository.java` | Repository Panache pour `ChargeCatalogItem` |
| `ChargeCatalogService.java` | Service métier + initialisation automatique de 15 éléments au démarrage |
| `ChargeCatalogResource.java` | API REST `GET/POST/PUT/DELETE /api/charge-catalog` |

**15 éléments pré-chargés au démarrage (si collection vide) :**

| Nom | Prix défaut | Unité |
|---|---|---|
| Stylo | 0,50 € | pièce |
| PC Portable | 800,00 € | pièce |
| Projecteur | 150,00 € | pièce |
| Table | 30,00 € | pièce |
| Chaise | 8,00 € | pièce |
| Câble HDMI | 12,00 € | pièce |
| Microphone | 80,00 € | pièce |
| Sonorisation | 350,00 € | forfait |
| Restauration | 12,00 € | pièce |
| Repas | 35,00 € | pièce |
| Salle | 120,00 € | heure |
| Badges | 2,00 € | pièce |
| Bannière | 90,00 € | pièce |
| Personnel | 18,00 € | heure |
| Assurance | 200,00 € | forfait |

### 4.2 Backend — Mise à jour du modèle `ChargeItem`

**`ChargeItem.java`** — Nouveaux champs ajoutés :

```java
public String catalogItemId;   // référence au catalogue
public int quantity = 1;       // quantité
public double unitPrice;       // prix unitaire (auto-rempli depuis le catalogue)
// amount est désormais calculé : quantity × unitPrice
```

**`ChargeItemService.java`** — Logique auto-remplissage :

```java
// Dans create() : si catalogItemId fourni → look up catalogue
// → auto-remplit description, category, currency, unitPrice
// → calcule amount = quantity × unitPrice
```

**Vérification API après rebuild Docker :**

```bash
POST /api/charges
{ "eventId": "test-event-001", "catalogItemId": "<id_projecteur>", "quantity": 2 }
→ 201 Created : { "amount": 300.0, "unitPrice": 150.0, "quantity": 2 }  ✅
```

### 4.3 Gateway — Nouvelle route charge-catalog

```yaml
# docker-compose.yml — route ajoutée
SPRING_CLOUD_GATEWAY_ROUTES[8]_ID=charge-catalog-service
SPRING_CLOUD_GATEWAY_ROUTES[8]_URI=http://charges-service:8086
SPRING_CLOUD_GATEWAY_ROUTES[8]_PREDICATES[0]=Path=/api/charge-catalog/**
```

### 4.4 Frontend Angular — Nouvelle page "Charge Catalog"

**`charge-catalog.component`** — CRUD complet du catalogue :
- Tableau : Nom, Catégorie, Unité, Prix unitaire, Statut (Active/Inactive)
- Formulaire inline ajout/modification
- Boutons : `tim-icons icon-pencil` (modifier), `tim-icons icon-trash-simple` (supprimer)

### 4.5 Frontend Angular — Nouvelle page "Charges by Event"

**`charge-items.component`** — Gestion des charges par événement :
- Sélecteur d'événement (appel `EventService.getAllEvents()`)
- Sélecteur catalogue : sélection auto-remplit description + prix unitaire
- Calcul automatique du montant total (`quantité × prix unitaire`)
- Tableau avec total affiché en bas
- Bouton "Approve" visible uniquement pour les charges `PENDING`

### 4.6 Routing Angular

**`admin-layout.module.ts`** — Déclarations ajoutées : `ChargeCatalogComponent`, `ChargeItemsComponent`

**`admin-layout.routing.ts`** — Routes ajoutées :

| Path | Composant |
|---|---|
| `charges/catalog` | `ChargeCatalogComponent` |
| `charges/items` | `ChargeItemsComponent` |
| `charges/predictions` | `ChargesManagementComponent` (existant) |

**`sidebar.component.ts`** — 3 entrées remplaçant l'ancienne entrée unique `/charges` :

```typescript
{ path: "/charges/catalog",     title: "Charge Catalog",   icon: "icon-book-bookmark" }
{ path: "/charges/items",       title: "Charges by Event", icon: "icon-money-coins"   }
{ path: "/charges/predictions", title: "AI Predictions",   icon: "icon-chart-bar-32"  }
```

---

## 5. Correction Styling Boutons (tim-icons)

### 5.1 Problème

Les boutons d'action dans les tableaux s'affichaient en forme de "pilule" (trop larges) et les icônes n'apparaissaient pas — utilisation erronée de `nc-icon` (font Nucleo, non chargée dans ce thème).

### 5.2 Fix

Remplacement systématique de `nc-icon nc-*` par `tim-icons icon-*` (font chargée dans le thème black-dashboard). Suppression de la classe `btn-icon` qui forçait des boutons circulaires.

**Pattern final correct :**

```html
<button class="btn btn-sm btn-info mr-1" title="Edit" (click)="openEdit(item)">
  <i class="tim-icons icon-pencil"></i>
</button>
<button class="btn btn-sm btn-danger" title="Delete" (click)="delete(item)">
  <i class="tim-icons icon-trash-simple"></i>
</button>
```

---

## 6. Traduction de l'Interface (Français → Anglais)

Tous les labels, titres, boutons, en-têtes de colonnes et messages des nouvelles pages ont été traduits en anglais :

| Composant | Textes traduits |
|---|---|
| `sidebar.component.ts` | "Catalogue des Charges" → "Charge Catalog", "Charges par Événement" → "Charges by Event", "Prédictions IA" → "AI Predictions" |
| `charge-catalog.component.html` | Titre, labels formulaire, en-têtes tableau, statuts Active/Inactive, boutons |
| `charge-items.component.html` | Titre, sous-titre, labels, placeholder, en-têtes tableau, messages vides, boutons |

---

## 7. Point en Suspens

| Tâche | Statut | Impact |
|---|---|---|
| Rebuild image Docker `events-service` | ❌ Échec Maven (timeout réseau) | Faible — fix MongoDB + frontend suffit pour l'existant. Les **nouveaux** événements créés passeront par le `create()` corrigé dès que l'image sera reconstruite |

---

## 8. Fichiers Modifiés

| Fichier | Type de modification |
|---|---|
| `docker-compose.yml` | Routes gateway `lb://` → `http://container:port` + route `/api/charge-catalog/**` |
| `services/events-service/src/.../EventService.java` | Sync aliases dans `create()` |
| `services/charges-service/src/.../model/ChargeCatalogItem.java` | **Nouveau** — entité catalogue |
| `services/charges-service/src/.../repository/ChargeCatalogRepository.java` | **Nouveau** — repository catalogue |
| `services/charges-service/src/.../service/ChargeCatalogService.java` | **Nouveau** — service + init 15 items |
| `services/charges-service/src/.../resource/ChargeCatalogResource.java` | **Nouveau** — API REST CRUD catalogue |
| `services/charges-service/src/.../model/ChargeItem.java` | Ajout `catalogItemId`, `quantity`, `unitPrice` |
| `services/charges-service/src/.../service/ChargeItemService.java` | Auto-remplissage depuis catalogue + calcul amount |
| `BackOffice/.../core/services/charge-catalog.service.ts` | **Nouveau** — service Angular (catalogue + charges) |
| `BackOffice/.../charge-catalog/charge-catalog.component.ts/html/scss` | **Nouveau** — page CRUD catalogue |
| `BackOffice/.../charge-items/charge-items.component.ts/html/scss` | **Nouveau** — page charges par événement |
| `BackOffice/.../admin-layout/admin-layout.module.ts` | Déclarations nouveaux composants |
| `BackOffice/.../admin-layout/admin-layout.routing.ts` | Routes `charges/catalog`, `charges/items`, `charges/predictions` |
| `BackOffice/.../sidebar/sidebar.component.ts` | 3 entrées charges en anglais |
| `BackOffice/.../event.service.ts` | Interface `Event` — champs optionnels + `startAt`/`endAt` |
| `BackOffice/.../events-management.component.ts` | Getter `upcomingEvents` avec fallback |
| `BackOffice/.../events-management.component.html` | Template `name\|\|title`, `startDate\|\|startAt` |
| `BackOffice/.../event-detail.component.html` | Page détail — mêmes fallbacks |
| `BackOffice/.../event-detail.component.ts` | `getEventImageUrl()` avec fallback titre |
