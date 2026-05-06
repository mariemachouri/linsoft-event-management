# Rapport d'Avancement — 30 Avril 2026

**Projet :** Event Management — Backoffice Angular + Microservices Quarkus  
**Période :** 30 Avril 2026  
**Auteur :** Mariem

---

## 1. Refonte de la Page Gestion des Événements — Affichage en Cartes

### 1.1 Objectif

Remplacer l'affichage en tableau par une grille de cartes visuelles (card grid) plus moderne et lisible pour la liste des événements.

### 1.2 Modifications Apportées

**`events-management.component.html`** — Refonte complète du layout :
- Suppression du tableau HTML (`<table>`)
- Implémentation d'une grille CSS `display: grid` avec cartes événements
- Chaque carte contient :
  - Image de bannière (photo réelle ou Picsum Photos comme fallback)
  - Badge de date flottant (jour + mois)
  - Badge de statut coloré (DRAFT, PUBLISHED, CANCELLED, COMPLETED)
  - Titre, lieu, description
  - Boutons d'action : "Lire la suite", Éditer, Supprimer

**`events-management.component.ts`** — Enrichissement du contrôleur :

```typescript
// Filtre événements futurs uniquement
get upcomingEvents(): Event[] {
  const now = new Date().getTime();
  return this.events
    .filter(e => new Date(e.endDate || e.startDate).getTime() >= now && ...)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

// Image réelle ou fallback Picsum
getEventImageUrl(event: Event): string {
  if (event.imageUrl) return event.imageUrl;
  const seed = encodeURIComponent(event.id || event.name || 'event');
  return `https://picsum.photos/seed/${seed}/600/240`;
}
```

**`events-management.component.scss`** — Styles LinSoft :
- Palette LinSoft : Navy `#2A3652`, Coral `#FF5276`, fond `#f5f7fa`
- Cartes avec `border-radius: 16px`, `box-shadow`, hover effects
- Badge date flottant (position absolute, coin supérieur droit)
- Responsive grid (auto-fill, min 300px)

---

## 2. Ajout du Champ Photo dans la Création d'Événement

### 2.1 Objectif

Permettre à l'organisateur de charger une photo lors de la création d'un événement. La photo est stockée en base64 dans MongoDB.

### 2.2 Zone d'Upload — `event-create.component.html`

```html
<div class="img-upload-zone" (click)="fileInput.click()" [class.has-preview]="imagePreview">
  <ng-container *ngIf="!imagePreview">
    <i class="tim-icons icon-image-02 upload-icon"></i>
    <span class="upload-label">Cliquez pour choisir une photo</span>
    <span class="upload-hint">JPG, PNG, WEBP — max 5 MB</span>
  </ng-container>
  <ng-container *ngIf="imagePreview">
    <img [src]="imagePreview" alt="Aperçu" class="upload-preview" />
    <button type="button" class="btn-clear-img" (click)="$event.stopPropagation(); clearImage()">
      <i class="tim-icons icon-simple-remove"></i>
    </button>
  </ng-container>
</div>
<input #fileInput type="file" accept="image/*" class="d-none" (change)="onFileSelected($any($event))" />
```

### 2.3 Logique TypeScript — `event-create.component.ts`

```typescript
imagePreview: string | null = null;

onFileSelected(evt: globalThis.Event): void {
  const input = evt.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  const file = input.files[0];
  if (!file.type.startsWith('image/')) {
    this.error = 'Veuillez sélectionner un fichier image valide.';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result as string;
    this.imagePreview = result;
    this.eventForm.patchValue({ imageUrl: result });  // base64 → formulaire
  };
  reader.readAsDataURL(file);
}

clearImage(): void {
  this.imagePreview = null;
  this.eventForm.patchValue({ imageUrl: '' });
}
```

**Résultat :** Zone de dépôt cliquable avec prévisualisation de l'image avant enregistrement ✅

---

## 3. Persistance de la Photo dans le Backend Java

### 3.1 Problème Identifié

Après test, les photos uploadées s'affichaient correctement dans le formulaire mais **n'étaient pas sauvegardées en base de données** : le modèle Java `Event.java` ne possédait pas le champ `imageUrl`.

### 3.2 Fix — `Event.java`

```java
// services/events-service/src/main/java/com/eventmgmt/events/model/Event.java
@MongoEntity(collection = "events")
public class Event extends PanacheMongoEntity {
    public String title;
    public String name;
    public String description;
    // ... autres champs ...
    public String organizerId;
    public String imageUrl;  // ← Ajouté
    public EventCategory category;
    public EventStatus status = EventStatus.DRAFT;
    // ...
}
```

### 3.3 Fix — Limite Taille Requête

Les images base64 peuvent dépasser la limite par défaut de Quarkus (4KB). Ajout dans `application.properties` :

```properties
# application.properties — events-service
quarkus.http.limits.max-body-size=10M
```

**Résultat :** Photos persistées dans MongoDB, visibles dans la liste des événements et la page de détail ✅

---

## 4. Page de Détail Événement — Bannière Photo

### 4.1 Ajout d'une Bannière Image

**`event-detail.component.html`** — Bannière au-dessus du header :

```html
<div class="detail-img-banner">
  <img [src]="getEventImageUrl()" [alt]="event.name" class="detail-banner-img" />
</div>
```

**`event-detail.component.ts`** — Méthode `getEventImageUrl()` :

```typescript
getEventImageUrl(): string {
  if (!this.event) return '';
  if (this.event.imageUrl) return this.event.imageUrl;
  const seed = encodeURIComponent(this.event.id || this.event.name || 'event');
  return `https://picsum.photos/seed/${seed}/600/240`;
}
```

**`event-detail.component.scss`** :
```scss
.detail-img-banner { border-radius: 14px; max-height: 340px; overflow: hidden; }
.detail-banner-img  { width: 100%; height: 340px; object-fit: cover; }
```

**Résultat :** Page de détail enrichie avec une grande bannière visuelle de l'événement ✅

---

## 5. Correction de l'Erreur de Compilation Angular (NG5002)

### 5.1 Erreur Rencontrée

Après modifications, la compilation Angular échouait avec :

```
NG5002: Unexpected closing tag "tr". It may happen when the tag has already been closed by another tag.
NG5002: Unexpected closing tag "thead". It may happen when the tag has already been closed.
```

**Fichier en cause :** `registrations-management.component.html`

### 5.2 Cause et Fix

**Cause :** Les balises ouvrantes `<thead class="text-primary"><tr>` étaient manquantes dans la table.

**Fix :** Ajout des balises `<thead class="text-primary"><tr>` avant les `<th>` orphelins.

**Résultat :** Compilation Angular sans erreur ✅

---

## 7. Upload Photo dans l’Édition d’Événement (`event-edit`)

### 7.1 Problème Identifié

Le formulaire d'édition (`event-edit`) ne comportait pas de champ `imageUrl`. Lors d'une mise à jour d'un événement existant avec photo, l'image était écrasée par `undefined`.

### 7.2 Modifications Apportées

**`event-edit.component.ts`** :
- Ajout de `imagePreview: string | null = null`
- Ajout de `imageUrl: ['']` dans le `FormGroup`
- Dans `loadEvent()` : préchargement de l'image existante dans `imagePreview` et dans le formulaire via `patchValue`
- Ajout des méthodes `onFileSelected()` et `clearImage()` (identiques à `event-create`)
- Dans `onSubmit()` : inclusion de `imageUrl` dans l'objet `eventData` envoyé au backend

**`event-edit.component.html`** :
- Ajout de la zone d'upload avec prévisualisation avant le bloc "Informations complémentaires"
- Message "La photo actuelle sera conservée si vous n'en sélectionnez pas une nouvelle."

**`event-edit.component.scss`** :
- Ajout des styles identiques à `event-create` (`.img-upload-zone`, `.upload-preview`, `.btn-clear-img`, etc.)

**Résultat :** La photo est chargée depuis MongoDB et affichée dès l'ouverture du formulaire ; elle peut être remplacée ou conservée ✅

---

## 8. Amélioration de la Suppression d’Événement

### 8.1 Problème Signalé

L'utilisateur signale que la suppression d'événement ne fonctionnait pas : le dialogue de confirmation s'affichait, mais l'événement restait en liste.

### 8.2 Diagnostic

Tests directs sur l'API backend :
```powershell
# Test DELETE direct → HTTP 204 ✅
$response = Invoke-WebRequest -Uri "http://localhost:8081/api/events/{id}" -Method DELETE
# Status: 204 — Backend fonctionne correctement
```

**Conclusion :** Le backend supprime bien les événements. Le problème visuel était dû au filtre `upcomingEvents` qui n'affiche que les événements dont `endDate >= maintenant`. Si l'événement avait une date passée, il n'apparaissait de toute façon pas.

### 8.3 Améliorations Côté Angular

**`events-management.component.ts`** — Gestion d'erreur améliorée :

```typescript
deleteEvent(id: string): void {
  console.log('deleteEvent called with id:', id, typeof id);
  if (!id || id === 'undefined') {
    this.error = 'Impossible de supprimer : ID invalide.';
    return;
  }
  if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
    this.eventService.deleteEvent(id).subscribe({
      next: () => { this.loadEvents(); },
      error: (err) => {
        console.error('Error deleting event:', err);
        const msg = err?.error?.message || err?.message || `Erreur ${err?.status || ''}`;
        this.error = `Erreur lors de la suppression : ${msg}`;
      }
    });
  }
}
```

### 8.4 Améliorations Côté Backend Java

**`EventResource.java`** — Endpoint DELETE renforcé :

```java
@DELETE
@Path("{id}")
public Response delete(@PathParam("id") String id) {
    try {
        if (!service.delete(id)) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity("{\"message\":\"Event not found: " + id + "\"}")
                .build();
        }
        return Response.noContent().build();
    } catch (IllegalArgumentException e) {
        return Response.status(Response.Status.BAD_REQUEST)
            .entity("{\"message\":\"Invalid event ID format: " + id + "\"}")
            .build();
    }
}
```

**Résultat :** Messages d'erreur précis retournés au frontend (400 = ID invalide, 404 = event non trouvé) ✅

---

## 9. Récapitulatif des Fichiers Modifiés

### Backend — events-service

| Fichier | Modification |
|---------|-------------|
| `model/Event.java` | Ajout champ `public String imageUrl` |
| `resource/EventResource.java` | DELETE renvoyant `Response` avec try-catch + messages d'erreur |
| `resources/application.properties` | `quarkus.http.limits.max-body-size=10M` |

### Frontend — BackOffice Angular

| Fichier | Modification |
|---------|-------------|
| `core/services/event.service.ts` | Champ `imageUrl?: string` dans l'interface `Event` |
| `events-management/events-management.component.ts` | Getter `upcomingEvents`, `getEventImageUrl()`, `deleteEvent()` amélioré |
| `events-management/events-management.component.html` | Refonte complète : grille de cartes (suppression tableau) |
| `events-management/events-management.component.scss` | Styles cartes LinSoft (badge date, badge statut, hover) |
| `event-create/event-create.component.ts` | `imagePreview`, `onFileSelected()`, `clearImage()`, `imageUrl` form control |
| `event-create/event-create.component.html` | Zone upload photo avec prévisualisation |
| `event-create/event-create.component.scss` | Styles zone upload (coral hover, preview, bouton clear) |
| `event-detail/event-detail.component.ts` | `getEventImageUrl()` |
| `event-detail/event-detail.component.html` | Bannière image `<div class="detail-img-banner">` |
| `event-detail/event-detail.component.scss` | Styles bannière (border-radius, object-fit cover) |
| `event-edit/event-edit.component.ts` | `imagePreview`, `imageUrl` form control, `onFileSelected()`, `clearImage()`, `imageUrl` dans `onSubmit()` |
| `event-edit/event-edit.component.html` | Zone upload photo avec prévisualisation et préchargement de l'image existante |
| `event-edit/event-edit.component.scss` | Styles zone upload (identiques à `event-create`) |
| `registrations-management/registrations-management.component.html` | Fix `<thead><tr>` manquants (erreur NG5002) |

---

## 10. État des Services — 30 Avril 2026

| Service | Port | Statut |
|---------|------|--------|
| Events Service (Quarkus) | 8081 | ✅ Running |
| MongoDB | 27017 | ✅ Running |
| BackOffice Angular | 4200 | ✅ Running — compilé sans erreur |
| Keycloak | 8180 | ✅ Running |
| Keycloak DB (PostgreSQL) | 5433 | ✅ Running |

---

## 11. Bilan de la Journée

| Tâche | Statut |
|-------|--------|
| Refonte liste événements → grille de cartes | ✅ Terminé |
| Upload photo dans édition événement (préchargement + remplacement) | ✅ Terminé |
| Upload photo dans création événement (base64 + prévisualisation) | ✅ Terminé |
| Persistance photo dans MongoDB (fix champ `imageUrl` Java) | ✅ Terminé |
| Limite requête 10MB pour images base64 | ✅ Terminé |
| Bannière photo dans page de détail | ✅ Terminé |
| Fix erreur de compilation Angular NG5002 (registrations) | ✅ Terminé |
| Amélioration suppression événement (messages d'erreur précis) | ✅ Terminé |
| Vérification et test API DELETE backend | ✅ Validé (HTTP 204) |

---

## 12. Session du 3 Mai 2026 — Corrections et Débogage

### 12.1 Résolution du Conflit MongoDB Local vs Docker

**Problème :** Le service `events-service` (Quarkus) retournait systématiquement `AuthenticationFailed` (code 18) malgré des credentials corrects (`admin/admin123`).

**Cause racine :** Un MongoDB installé localement sur Windows (service `MongoDB`, PID 5468) occupait `127.0.0.1:27017` en priorité sur le container Docker. Quarkus se connectait au MongoDB local qui ne possédait aucun utilisateur configuré.

**Diagnostic clé :**
```powershell
netstat -ano | Select-String ":27017 .* LISTEN"
# → Deux PIDs différents = conflit de port
```

**Solution appliquée :**
- `docker-compose.yml` : port MongoDB Docker changé de `27017:27017` → `27018:27017`
- `application.properties` : configuration Quarkus mise à jour sur port 27018

```properties
quarkus.mongodb.hosts=127.0.0.1:27018
quarkus.mongodb.credentials.username=admin
quarkus.mongodb.credentials.password=admin123
quarkus.mongodb.credentials.auth-source=admin
```

**Résultat :** `GET /api/events` → `200 []` ✅

**Solution permanente recommandée (nécessite droits Admin) :**
```powershell
Stop-Service -Name "MongoDB" -Force
Set-Service -Name "MongoDB" -StartupType Disabled
```

---

### 12.2 Fix Visibilité Titre et Description — Cartes Événements

**Problème :** Dans la liste des événements, le titre et la description étaient illisibles — texte sombre sur fond sombre navy.

**Cause :** Le thème global **Black Dashboard** définit `.card { background: #27293d }` qui overridait la valeur `background: $white` définie dans le composant Angular, à cause de l'ordre de chargement CSS.

**Fichiers modifiés :** `events-management/events-management.component.scss`

| Propriété | Avant | Après |
|-----------|-------|-------|
| `.event-card` background | `$white` (overridé) | `#ffffff !important` |
| `.event-title` color | `$navy` (invisible sur fond sombre) | `#2A3652 !important` |
| `.event-desc` color | `$muted` (trop clair) | `#4a5568 !important` |

**Résultat :** Cartes blanches avec titre navy et description gris foncé — contraste correct ✅

---

### 12.3 État des Services — 3 Mai 2026

| Service | Port | Statut |
|---------|------|--------|
| Events Service (Quarkus) | 8081 | ✅ Running |
| MongoDB Docker | **27018** | ✅ Running |
| MongoDB Local Windows | 27017 | ⚠️ Actif (non désactivable sans Admin) |
| BackOffice Angular | 4200 | ✅ Running |
| Keycloak | 8180 | ✅ Running |
| Keycloak DB (PostgreSQL) | 5433 | ✅ Running |

### 12.4 Fichiers Modifiés

| Fichier | Modification |
|---------|-------------|
| `docker-compose.yml` | Port MongoDB : `27017:27017` → `27018:27017` |
| `events-service/src/main/resources/application.properties` | MongoDB hosts sur port 27018, credentials explicites |
| `events-management/events-management.component.scss` | `!important` sur background, couleur titre et description |
| `TROUBLESHOOTING-MONGODB-PORT-CONFLICT.md` | Nouveau fichier — documentation du conflit et solutions |
