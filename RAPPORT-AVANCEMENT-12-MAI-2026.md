# Rapport d'Avancement — 12 Mai 2026

## Résumé de la session

Séance de corrections fonctionnelles portant sur deux bugs critiques d'intégrité des données dans l'interface d'administration (**BackOffice**) et dans le flux d'inscription (**FrontOffice**/**Backend**). Les deux problèmes ont été identifiés, diagnostiqués et corrigés en bout en bout.

---

## Corrections effectuées

### 1. BackOffice — Nom du participant affiché comme UUID dans le tableau des inscriptions

**Problème :** Dans la page "Registrations Management" du BackOffice (admin), la colonne "Participant" affichait l'UUID Keycloak brut au lieu du nom complet de l'utilisateur (ex : `5b3e1a2c-4f7d-...` au lieu de `Jean Dupont`).

**Cause racine :** Le champ `participantId` stocké en MongoDB par le `registrations-service` correspond à la valeur du claim `sub` du JWT Keycloak, c'est-à-dire l'**UUID Keycloak**. La méthode `getParticipantName()` du composant Angular cherchait uniquement `u.id === participantId` où `u.id` est l'ObjectId MongoDB du profil utilisateur — les deux identifiants ne correspondent jamais.

**Corrections :**

- `BackOffice/back-offiice/src/app/core/services/user.service.ts` :
  Ajout du champ `keycloakId?: string` dans l'interface `UserResponse` afin d'exposer l'UUID Keycloak retourné par le `users-service`.

- `BackOffice/back-offiice/src/app/pages/registrations-management/registrations-management.component.ts` :
  Méthodes `getParticipantName()` et `getParticipantEmail()` mises à jour pour effectuer une double correspondance :
  ```typescript
  const user = this.users.find(u => u.id === participantId || u.keycloakId === participantId);
  ```
  Ainsi le matching fonctionne quel que soit le type d'identifiant stocké (ObjectId MongoDB ou UUID Keycloak).

**Résultat :** La colonne "Participant" affiche désormais le prénom + nom (ou username) de l'utilisateur inscrit.

---

### 2. FrontOffice/BackOffice — Compteur de participants non mis à jour après inscription

**Problème :** Après une inscription à un événement depuis le FrontOffice, le compteur `currentParticipants` (affiché `0 / 3` dans le détail d'événement) restait bloqué à `0`, et le nombre de places disponibles (`3 spots left`) ne diminuait pas.

**Cause racine :** Le `registrations-service` persistait bien la registration et publiait un message Kafka sur le topic `registration.created`, mais **aucun service ne consommait ce message** pour mettre à jour le champ `currentParticipants` de l'événement correspondant dans le `events-service`. Le modèle `Event.java` possédait pourtant le champ `currentParticipants`, mais celui-ci n'était jamais incrémenté ni décrémenté.

**Solution adoptée :** Ajout d'un **consumer Kafka** dans l'`events-service` qui écoute les topics `registration.created` et `registration.cancelled` et met à jour `currentParticipants` en conséquence. Cette approche respecte le pattern microservices (pas de couplage HTTP direct entre services).

**Nouveaux fichiers créés dans `events-service` :**

- `services/events-service/src/main/java/com/eventmgmt/events/kafka/RegistrationMessage.java` :
  DTO (avec `@JsonIgnoreProperties`) représentant les messages de registration reçus via Kafka.

- `services/events-service/src/main/java/com/eventmgmt/events/kafka/RegistrationMessageDeserializer.java` :
  Deserializer Jackson étendant `ObjectMapperDeserializer<RegistrationMessage>`.

- `services/events-service/src/main/java/com/eventmgmt/events/kafka/RegistrationConsumer.java` :
  Bean `@ApplicationScoped` avec deux méthodes `@Incoming` :
  - `registration-created-in` → appelle `eventService.incrementParticipants(eventId)`
  - `registration-cancelled-in` → appelle `eventService.decrementParticipants(eventId)`

**Fichiers modifiés :**

- `services/events-service/src/main/java/com/eventmgmt/events/service/EventService.java` :
  Ajout des méthodes `incrementParticipants(String eventId)` et `decrementParticipants(String eventId)` (le décrément est protégé par `Math.max(0, ...)` pour ne jamais passer en négatif).

- `services/events-service/src/main/resources/application.properties` :
  Ajout des canaux Kafka entrants :
  ```properties
  mp.messaging.incoming.registration-created-in.connector=smallrye-kafka
  mp.messaging.incoming.registration-created-in.topic=registration.created
  mp.messaging.incoming.registration-created-in.value.deserializer=com.eventmgmt.events.kafka.RegistrationMessageDeserializer
  mp.messaging.incoming.registration-created-in.group.id=events-service-registrations
  mp.messaging.incoming.registration-created-in.auto.offset.reset=latest

  mp.messaging.incoming.registration-cancelled-in.connector=smallrye-kafka
  mp.messaging.incoming.registration-cancelled-in.topic=registration.cancelled
  mp.messaging.incoming.registration-cancelled-in.value.deserializer=com.eventmgmt.events.kafka.RegistrationMessageDeserializer
  mp.messaging.incoming.registration-cancelled-in.group.id=events-service-registrations-cancel
  mp.messaging.incoming.registration-cancelled-in.auto.offset.reset=latest
  ```

**Correction des données historiques :**
Un script MongoDB a été exécuté pour recalculer et corriger rétrospectivement le champ `currentParticipants` de tous les événements existants (en comptant les inscriptions non annulées en base). Résultat :
- Event `69fb5ba779b6594cd4c03fa8` → `currentParticipants = 6`
- Event `69fb930d96e1d22180b71328` → `currentParticipants = 4`
- Event `69f7c2367f4df019fc285644` → `currentParticipants = 1`

**Déploiement :** L'image Docker de l'`events-service` a été reconstruite et le container redémarré. Les logs confirment que les deux consumers Kafka sont connectés :
```
SRMSG18257: Kafka consumer kafka-consumer-registration-created-in ... polls from [registration.created]
SRMSG18257: Kafka consumer kafka-consumer-registration-cancelled-in ... polls from [registration.cancelled]
```

**Résultat :** Le compteur `currentParticipants` se met à jour en temps réel après chaque inscription ou annulation. Le FrontOffice affiche désormais `1 / 3` et `2 spots left` correctement.

---

## Fichiers modifiés / créés

### BackOffice (Angular)
- `BackOffice/back-offiice/src/app/core/services/user.service.ts`
- `BackOffice/back-offiice/src/app/pages/registrations-management/registrations-management.component.ts`

### events-service (Quarkus)
| Fichier | Statut |
|---------|--------|
| `services/events-service/src/main/java/com/eventmgmt/events/kafka/RegistrationMessage.java` | Nouveau |
| `services/events-service/src/main/java/com/eventmgmt/events/kafka/RegistrationMessageDeserializer.java` | Nouveau |
| `services/events-service/src/main/java/com/eventmgmt/events/kafka/RegistrationConsumer.java` | Nouveau |
| `services/events-service/src/main/java/com/eventmgmt/events/service/EventService.java` | Modifié |
| `services/events-service/src/main/resources/application.properties` | Modifié |

---

## Architecture — Flux mis en place

```
FrontOffice (React)
    │
    │  POST /api/registrations
    ▼
registrations-service (Quarkus :8082)
    │  persist Registration (MongoDB)
    │  publish → Kafka topic: registration.created
    ▼
Kafka (Confluent :9092)
    │
    │  consume: registration-created-in
    ▼
events-service (Quarkus :8081)
    │  incrementParticipants(eventId)
    ▼
MongoDB events_db.events
    currentParticipants += 1
```

Le même flux s'applique pour l'annulation (`registration.cancelled` → `decrementParticipants`).

---

## État des services

| Service | Port | Statut |
|---------|------|--------|
| eureka-server | 8761 | ✅ Running |
| config-server | 8888 | ✅ Running |
| gateway-service | 8080 | ✅ Running |
| events-service | 8081 | ✅ Running (nouveau build) |
| registrations-service | 8082 | ✅ Running |
| users-service | 8083 | ✅ Running |
| notifications-service | 8084 | ✅ Running |
| charges-service | 8086 | ✅ Running |
| dashboard-service | 8085 | ⚠️ Crashé (Kafka deserializer — à corriger) |
| Keycloak | 8180 | ✅ Running |
| MongoDB | 27018 | ✅ Running |
| Kafka | 9092 | ✅ Running |
| BackOffice (Angular) | 4200 | ✅ Running |
| FrontOffice (React/Vite) | 4300 | ✅ Running |

---

## Problème en suspens

### dashboard-service — Crash au démarrage

**Erreur :** `NoSuchMethodException: io.quarkus.kafka.client.serialization.ObjectMapperDeserializer.<init>()`

**Cause :** Les deserializers Kafka configurés dans `application.properties` du `dashboard-service` référencent `ObjectMapperDeserializer` mais les classes concrètes étendent `JsonbDeserializer`, qui ne fournit pas de constructeur sans argument à l'`ObjectMapperDeserializer`.

**Action requise :** Reconstruire l'image avec `docker-compose build --no-cache dashboard-service` après vérification du `pom.xml` et des classes deserializer du service.
