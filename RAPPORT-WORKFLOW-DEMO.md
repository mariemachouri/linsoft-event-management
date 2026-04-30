# Workflow de Démonstration – Event Management avec Notifications Push

## 1. Démarrage des dépendances (Docker)
Ouvre un terminal dans le dossier du projet et lance :
```sh
docker compose up -d mongodb zookeeper kafka keycloak-db keycloak
```
- Vérifie que tous les conteneurs sont "Up" et "Healthy" (`docker ps`).

## 2. Démarrage des microservices
Dans des terminaux séparés :

- **Config Server**  
  ```sh
  cd services/config-server
  mvn quarkus:dev -Dquarkus.http.port=8888
  ```
- **Eureka Server**  
  ```sh
  cd services/eureka-server
  mvn quarkus:dev -Dquarkus.http.port=8761
  ```
- **Gateway Service**  
  ```sh
  cd services/gateway-service
  mvn quarkus:dev -Dquarkus.http.port=8080
  ```
- **Notifications Service**  
  ```sh
  cd services/notifications-service
  mvn quarkus:dev -Dquarkus.http.port=8084
  ```
- **Events Service**  
  ```sh
  cd services/events-service
  mvn quarkus:dev -Dquarkus.http.port=8082
  ```
- (Lance aussi les autres services si besoin pour la démo : users-service, registrations-service, etc.)

## 3. Démarrage du BackOffice Angular
```sh
cd BackOffice/back-offiice
npm install
npm start
```
- Accède à l’interface sur http://localhost:4200

## 4. Connexion et Permissions
- Connecte-toi avec un compte utilisateur (ou admin).
- Vérifie que le navigateur autorise les notifications pour localhost:4200.

## 5. Démo du workflow notification
1. Va dans le menu **Push Notifications** et clique sur "Activer les notifications" si besoin.
2. Va dans le menu **Events**.
3. Clique sur **Create Event** et remplis le formulaire.
4. Publie l’événement.
5. **Observe** :
   - Une notification push doit apparaître dans le navigateur.
   - L’événement apparaît dans la liste.

## 6. Vérifications
- Si la notification n’apparaît pas :
  - Vérifie que notifications-service affiche bien des logs d’envoi push.
  - Vérifie que Kafka ne montre pas d’erreur de connexion.
  - Vérifie les permissions navigateur.

## 7. Arrêt des services
Après la démo, tu peux tout arrêter avec :
```sh
docker compose down
```
Et en fermant les terminaux des microservices.

---
**Astuce** : Prépare tous les terminaux à l’avance, et ouvre l’interface BackOffice dans un navigateur où les notifications sont autorisées.

Bonne démo !