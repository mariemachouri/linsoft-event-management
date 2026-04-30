# Rapport d'Avancement — 27-28 Avril 2026

**Projet :** Event Management — Backoffice Angular + Keycloak  
**Période :** 27 Avril 2026 → 28 Avril 2026  
**Auteur :** Mariem

---

## 1. Implémentation de la Page d'Inscription avec Fournisseurs Sociaux

### 1.1 Création du RegisterComponent

**Objectif :** Permettre aux nouveaux utilisateurs de s'inscrire via des fournisseurs d'identité OAuth (Google, GitHub, LinkedIn, etc.) sans passer par le formulaire natif Keycloak.

**Fichiers créés :**
- `src/app/pages/register/register.component.ts`
- `src/app/pages/register/register.component.html`
- `src/app/pages/register/register.component.scss`

**Fonctionnement :** Chaque bouton social appelle `registerWith(idpHint)` qui redirige vers le provider OAuth via Keycloak :

```typescript
// src/app/pages/register/register.component.ts
socialProviders: SocialProvider[] = [
  { id: 'google',   name: 'Google',   idpHint: 'google'   },
  { id: 'github',   name: 'GitHub',   idpHint: 'github'   },
  { id: 'linkedin', name: 'LinkedIn', idpHint: 'linkedin' }
];

registerWith(idpHint?: string): void {
  this.isLoading = true;
  this.loadingProvider = idpHint || 'email';
  if (idpHint) {
    const redirectUri = window.location.origin + '/#/register-success';
    this.keycloakService.login({ redirectUri, idpHint });
  } else {
    const redirectUri = window.location.origin + '/#/';
    this.keycloakService.register({ redirectUri });
  }
}
```

**Résultat :** Page accessible à `http://localhost:4200/#/register` avec grille 3 colonnes, dark-theme, animations CSS ✅

### 1.2 Nettoyage de l'UI — Suppression des Providers Non Configurés

**Problème :** La page affichait initialement 8 boutons (Microsoft, Facebook, Twitter/X, Apple, Instagram inclus) mais ces providers n'étaient pas configurés dans Keycloak → erreur au clic.

**Solution :** Réduction à 3 providers réellement actifs dans le realm `event-mgmt` :

```typescript
// ✅ Après — uniquement les providers configurés dans Keycloak
socialProviders: SocialProvider[] = [
  { id: 'google',   name: 'Google',   idpHint: 'google'   },
  { id: 'github',   name: 'GitHub',   idpHint: 'github'   },
  { id: 'linkedin', name: 'LinkedIn', idpHint: 'linkedin' }
];
```

```scss
// src/app/pages/register/register.component.scss
.providers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;  // ← 3 colonnes au lieu de 2
  gap: 10px;
}
```

---

## 2. Correction du Flux OAuth Social — Login vs Register

### 2.1 Problème — GitHub/LinkedIn Affichaient le Formulaire Keycloak

**Symptôme :** En cliquant sur "GitHub" ou "LinkedIn", Keycloak affichait son propre formulaire d'inscription (email + mot de passe) au lieu de rediriger directement vers l'OAuth du provider.

**Cause racine :** La méthode `keycloakService.register({ idpHint })` **ignore le paramètre `idpHint`** dans la version utilisée de `keycloak-angular` — elle ouvre toujours le formulaire natif Keycloak quel que soit le hint passé.

**Solution :** Utiliser `keycloakService.login()` avec `idpHint` pour les providers sociaux, et garder `register()` uniquement pour l'inscription par email :

```typescript
// ❌ Avant — idpHint ignoré, formulaire Keycloak affiché
this.keycloakService.register({ redirectUri, idpHint });

// ✅ Après — login() respecte idpHint → redirection directe vers OAuth
if (idpHint) {
  this.keycloakService.login({ redirectUri: '.../#/register-success', idpHint });
} else {
  this.keycloakService.register({ redirectUri: '.../#/' });
}
```

**Résultat :** Clic sur "Google" → page de connexion Google directement. Clic sur "GitHub" → page GitHub OAuth directement ✅

---

## 3. Correction NullPointerException Keycloak au Callback OAuth

### 3.1 Erreur au Retour du Callback GitHub/LinkedIn

**Symptôme :** Après authentification réussie chez GitHub ou LinkedIn, Keycloak crashait lors du traitement du callback avec :

```
java.lang.NullPointerException: Cannot invoke 
"org.keycloak.models.IdentityProviderMapperModel.preprocessFederatedIdentity(...)"
because "target" is null
  at IdentityBrokerService.java:526
```

**Cause racine :** Les mappers IdP sur GitHub et LinkedIn utilisaient le type `hardcoded-role-idp-mapper` qui **n'existe plus dans Keycloak 24** (remplacé par `oidc-hardcoded-role-idp-mapper`). La résolution du mapper retournait `null` → NullPointerException.

### 3.2 Solution — Suppression des Mappers IdP

**Analyse :** Le rôle `participant` était déjà inclus dans `default-roles-event-mgmt`. Les mappers IdP étaient donc redondants et inutiles.

**Action effectuée via l'API Keycloak Admin :**

```powershell
# Suppression de tous les mappers sur les 3 providers
$token = (Invoke-RestMethod -Uri "http://localhost:8180/realms/master/protocol/openid-connect/token" `
  -Method Post -Body @{grant_type="password";client_id="admin-cli";username="admin";password="admin"} `
  -ContentType "application/x-www-form-urlencoded").access_token

$headers = @{"Authorization"="Bearer $token"}

foreach ($provider in @("github", "linkedin", "google")) {
  $mappers = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/event-mgmt/identity-provider/instances/$provider/mappers" -Headers $headers
  foreach ($mapper in $mappers) {
    Invoke-RestMethod -Method Delete `
      -Uri "http://localhost:8180/admin/realms/event-mgmt/identity-provider/instances/$provider/mappers/$($mapper.id)" `
      -Headers $headers
  }
}
```

**Résultat :** 0 mapper sur chaque provider. Le rôle `participant` est assigné automatiquement via `default-roles-event-mgmt` à tout nouvel utilisateur ✅

---

## 4. Configuration des Rôles Keycloak

### 4.1 Rôle `participant` — Attribution Automatique

**Objectif :** Tout utilisateur qui s'inscrit (via social ou email) reçoit automatiquement le rôle `participant` sans intervention manuelle.

**Configuration :** Rôle `participant` ajouté aux `default-roles-event-mgmt` dans Keycloak Admin Console.

**Rôles par défaut du realm `event-mgmt` :**

| Rôle | Source | Usage |
|------|--------|-------|
| `offline_access` | Keycloak natif | Sessions hors-ligne |
| `uma_authorization` | Keycloak natif | UMA |
| `manage-account` | Client `account` | Gestion profil |
| `view-profile` | Client `account` | Vue profil |
| `participant` | Custom ✅ | Rôle métier — participants |

### 4.2 Rôle `organisateur` — Accès BackOffice

**Objectif :** Les organisateurs d'événements ont accès au BackOffice.

**Configuration :** Rôle `organisateur` créé dans Keycloak, ajouté à `ALLOWED_ROLES` dans `auth.guard.ts`.

---

## 5. Création de la Page RegisterSuccessComponent

### 5.1 Objectif

Après connexion OAuth sociale, les nouveaux participants sont redirigés vers `/#/register-success` au lieu du dashboard BackOffice (auquel ils n'ont pas accès).

### 5.2 Fichiers Créés

- `src/app/pages/register-success/register-success.component.ts`
- `src/app/pages/register-success/register-success.component.html`
- `src/app/pages/register-success/register-success.component.scss`

**Composant TS :**

```typescript
// src/app/pages/register-success/register-success.component.ts
export class RegisterSuccessComponent implements OnInit {
  userName: string = '';
  userEmail: string = '';

  constructor(private keycloakService: KeycloakService) {}

  ngOnInit(): void {
    const profile = this.keycloakService.getKeycloakInstance().idTokenParsed;
    if (profile) {
      this.userName = profile['given_name'] || profile['preferred_username'] || '';
      this.userEmail = profile['email'] || '';
    }
  }

  logout(): void {
    this.keycloakService.logout(window.location.origin + '/#/login');
  }
}
```

**Affichage :** Icône de succès, nom de l'utilisateur récupéré depuis Keycloak, email, badge rôle `participant`, bouton de déconnexion ✅

---

## 6. Correction AuthGuard — Redirection des Participants

### 6.1 Problème

Après connexion OAuth sociale, un utilisateur avec le rôle `participant` était redirigé vers `/unauthorized` car il n'avait pas les rôles `admin` / `organisateur`.

### 6.2 Solution

```typescript
// src/app/core/guards/auth.guard.ts
const ALLOWED_ROLES = ['admin', 'organisateur', 'organizer', 'event-organizer'];

async isAccessAllowed(...): Promise<boolean> {
  const userRoles = this.keycloak.getUserRoles(true);
  const hasAccess = ALLOWED_ROLES.some(role => userRoles.includes(role));

  if (!hasAccess) {
    // ✅ Participants → page de succès (au lieu de /unauthorized)
    const isParticipant = userRoles.includes('participant');
    if (isParticipant) {
      this.router.navigate(['/register-success']);
    } else {
      this.router.navigate(['/unauthorized']);
    }
    return false;
  }

  return true;
}
```

**Résultat :** Participant connecté via Google/GitHub → automatiquement redirigé vers `/#/register-success` ✅

---

## 7. Intégration dans le Routing et le Module Angular

**`app-routing.module.ts`** — Ajout des routes :
```typescript
{ path: "register",         component: RegisterComponent        },
{ path: "register-success", component: RegisterSuccessComponent },
```

**`app.module.ts`** — Déclarations ajoutées :
```typescript
declarations: [
  // ...
  RegisterComponent,
  RegisterSuccessComponent,
]
```

---

## 8. Problème Non Résolu — LinkedIn OAuth

### 8.1 Erreur Persistante

Malgré la configuration du provider LinkedIn dans Keycloak, le flux OAuth échoue lors de la redirection :

```
Erreur LinkedIn Developer Portal :
"redirect_uri n'est pas autorisée pour cette application"
URL : https://www.linkedin.com/oauth/v2/authorization?...
```

### 8.2 Vérifications Effectuées

| Élément | Statut |
|---------|--------|
| Provider LinkedIn configuré dans Keycloak (type OIDC) | ✅ |
| Client ID LinkedIn : `77y6nqt6yp4tk1` | ✅ |
| AuthorizationUrl : `https://www.linkedin.com/oauth/v2/authorization` | ✅ |
| TokenUrl : `https://www.linkedin.com/oauth/v2/accessToken` | ✅ |
| Scopes : `openid email profile` | ✅ |
| URL callback Keycloak ajoutée dans LinkedIn Developer Portal | ❌ Non faite |

### 8.3 Fix à Appliquer

**Action requise dans LinkedIn Developer Portal :**
1. Aller sur [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps)
2. Ouvrir l'app `77y6nqt6yp4tk1`
3. Onglet **Auth** → "Authorized redirect URLs for your app"
4. Ajouter : `http://localhost:8180/realms/event-mgmt/broker/linkedin/endpoint`
5. Vérifier que le produit **"Sign In with LinkedIn using OpenID Connect"** est activé

---

## 9. Architecture Résultante — Gestion des Accès

| Type d'utilisateur | Inscription | Rôle | Accès BackOffice |
|-------------------|-------------|------|-----------------|
| **Participant** | `/#/register` → OAuth social ou email | `participant` (auto) | ❌ → redirigé vers `/#/register-success` |
| **Organisateur** | Créé par l'admin dans Keycloak | `organisateur` (manuel) | ✅ |
| **Admin** | Pré-configuré Keycloak | `admin` | ✅ |

---

## 10. État des Services

| Service | Port | Statut |
|---------|------|--------|
| Keycloak DB (PostgreSQL) | 5433 | ✅ Running |
| Keycloak | 8180 | ✅ Running |
| BackOffice Angular | 4200 | ✅ Running — `ng serve` compilé ✅ |

---

## 11. Récapitulatif des Fichiers Modifiés

| Fichier | Modification |
|---------|-------------|
| `BackOffice/.../pages/register/register.component.ts` | Créé — 3 providers, `registerWith()` avec `login({idpHint})` |
| `BackOffice/.../pages/register/register.component.html` | Créé — UI dark-theme, grille 3 colonnes, SVG inline |
| `BackOffice/.../pages/register/register.component.scss` | Créé — glassmorphism, animations, responsive |
| `BackOffice/.../pages/register-success/register-success.component.ts` | Créé — récupère profil Keycloak, logout |
| `BackOffice/.../pages/register-success/register-success.component.html` | Créé — page de confirmation post-inscription |
| `BackOffice/.../pages/register-success/register-success.component.scss` | Créé — styles page succès |
| `BackOffice/.../core/guards/auth.guard.ts` | `ALLOWED_ROLES` + `organisateur` ; participants → `/register-success` |
| `BackOffice/.../app-routing.module.ts` | Routes `register` et `register-success` ajoutées |
| `BackOffice/.../app.module.ts` | `RegisterComponent` et `RegisterSuccessComponent` déclarés |

---

## 12. Finalisation — Session du 28 Avril 2026 (après-midi)

### 12.1 Fix LinkedIn — Complété ✅

**Actions effectuées :**

| Action | Statut |
|--------|--------|
| URL callback ajoutée dans LinkedIn Developer Portal : `http://localhost:8180/realms/event-mgmt/broker/linkedin/endpoint` | ✅ |
| Produit **"Sign In with LinkedIn using OpenID Connect"** activé dans LinkedIn Developer Portal | ✅ |
| Fix Keycloak — `disableNonce=true` sur le provider LinkedIn (LinkedIn ne retourne pas de nonce dans l'ID token) | ✅ |

**Erreur rencontrée et résolue :**
```
OpenID Provider [oidc] did not return a nonce
at OIDCIdentityProvider.java:956
```
**Cause :** LinkedIn OIDC ne retourne pas de champ `nonce` dans son ID token. Keycloak 24 le valide strictement.
**Fix :** `disableNonce=true` appliqué via l'API Keycloak Admin.

### 12.2 Test Flux LinkedIn — Complété ✅

**Résultat du test :**
- Clic sur "LinkedIn" dans `/#/register` → redirection OAuth LinkedIn ✅
- Authentification LinkedIn réussie → callback Keycloak traité sans erreur ✅
- Keycloak détecte email existant (`achoury.mayem@gmail.com`) → **federation automatique** avec le compte `organizer.test` ✅
- Accès BackOffice accordé (rôle `event-organizer` hérité) ✅
- Session persistante : reconnexion sans saisie de credentials (comportement OAuth normal) ✅

**Note :** La federation automatique est le comportement attendu de Keycloak — si l'email LinkedIn correspond à un utilisateur existant, Keycloak lie les deux identités automatiquement.

### 12.3 Test Organisateur — Complété ✅

L'utilisateur `organizer.test` (rôles : `event-organizer`, `participant`) a accès complet au BackOffice avec :
- Dashboard, Events, Registrations, Charges, Notifications, Push Notifications, User Profile

### 12.4 Test Flux GitHub — Participant Nouvel Email ✅

**Test 1 — Navigateur normal :**
- Clic sur "GitHub" → redirection OAuth GitHub ✅
- Utilisateur `mariem.achouri@esprit.tn` → nouvel email inconnu de Keycloak ✅
- Nouveau compte Keycloak créé automatiquement ✅
- Rôle `participant` assigné via `default-roles-event-mgmt` ✅
- Redirection vers `/#/register-success` avec nom "Mariem" et badge `Participant` ✅

**Test 2 — Navigation privée (Incognito) :**
- Même flux testé en fenêtre incognito pour simuler un utilisateur sans session active ✅
- Email `achoury.maycem@gmail.com` → Keycloak reconnaît l'email (federation) → rôle `participant` ✅
- Page `/#/register-success` affichée correctement : "Bienvenue Mariem !", badge `Participant` ✅
- Comportement identique en mode normal et incognito ✅

**Comportement de la session GitHub :**
GitHub mémorise l'autorisation accordée à l'application → reconnexion automatique sans re-saisie des credentials (comportement OAuth standard). Pour forcer une nouvelle saisie : révoquer l'autorisation sur `https://github.com/settings/applications`.

---

## 13. État Final du Projet — 28 Avril 2026

### Services

| Service | Port | Statut |
|---------|------|--------|
| Keycloak DB (PostgreSQL) | 5433 | ✅ Running |
| Keycloak | 8180 | ✅ Running |
| BackOffice Angular | 4200 | ✅ Running |
| Kafka / Zookeeper | - | ✅ Running |
| MongoDB | - | ✅ Running |
| Eureka Server | - | ✅ Running |

### Flux d'authentification — Tests Validés

| Provider | Scénario testé | Résultat | Destination |
|----------|----------------|----------|-------------|
| GitHub | Nouvel email (`mariem.achouri@esprit.tn`) | ✅ Nouveau compte créé, rôle `participant` | `/#/register-success` |
| GitHub | Email existant / incognito (`achoury.maycem@gmail.com`) | ✅ Federation, rôle `participant` | `/#/register-success` |
| LinkedIn | Email existant organisateur (`achoury.mayem@gmail.com`) | ✅ Federation, rôle `event-organizer` | BackOffice |
| Email/Password | Connexion directe | ✅ Fonctionnel | selon rôle |

### Toutes les tâches sont terminées ✅
