# Configuration des Notifications

## Vue d'ensemble

Le service de notifications supporte trois types d'envoi :
- **EMAIL** : Envoi d'emails via SMTP
- **SMS** : Envoi de SMS via Twilio
- **PUSH** : Notifications push via Firebase Cloud Messaging

## 🔧 Configuration

### 1. Email (SMTP)

#### Avec Gmail

1. **Créer un mot de passe d'application** :
   - Accédez à votre compte Google : https://myaccount.google.com/security
   - Activez la validation en 2 étapes
   - Créez un "Mot de passe d'application"

2. **Variables d'environnement** :
```bash
EMAIL_FROM=noreply@votredomaine.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app
```

#### Avec autre fournisseur SMTP

```bash
EMAIL_FROM=noreply@votredomaine.com
EMAIL_HOST=smtp.votrefournisseur.com
EMAIL_PORT=587
EMAIL_USERNAME=votre-username
EMAIL_PASSWORD=votre-password
```

#### Mode test (emails simulés)

Pour tester sans envoyer de vrais emails, ajoutez dans `application.properties` :
```properties
quarkus.mailer.mock=true
```

---

### 2. SMS (Twilio)

1. **Créer un compte Twilio** :
   - Inscrivez-vous sur https://www.twilio.com
   - Obtenez un numéro de téléphone Twilio
   - Trouvez vos credentials dans la console

2. **Variables d'environnement** :
```bash
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=votre-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

3. **Désactiver SMS (mode logs uniquement)** :
```bash
TWILIO_ENABLED=false
```

---

### 3. Push Notifications (Firebase)

1. **Créer un projet Firebase** :
   - Accédez à https://console.firebase.google.com
   - Créez un nouveau projet
   - Ajoutez une application (iOS/Android/Web)

2. **Télécharger les credentials** :
   - Allez dans Project Settings > Service Accounts
   - Cliquez sur "Generate new private key"
   - Téléchargez le fichier JSON

3. **Placer le fichier** :
   - Créez un dossier `config` à la racine du service
   - Placez le fichier JSON dedans (ex: `config/firebase-credentials.json`)

4. **Variables d'environnement** :
```bash
FIREBASE_ENABLED=true
FIREBASE_CREDENTIALS_PATH=config/firebase-credentials.json
```

5. **Désactiver Push (mode logs uniquement)** :
```bash
FIREBASE_ENABLED=false
```

---

## 📝 Utilisation

### Créer une notification EMAIL

```bash
POST http://localhost:8084/api/notifications
Content-Type: application/json

{
  "recipientId": "user@example.com",
  "type": "EMAIL",
  "message": "Votre événement commence dans 1 heure !",
  "status": "PENDING",
  "sendAt": "2026-04-01T10:00:00"
}
```

### Créer une notification SMS

```bash
POST http://localhost:8084/api/notifications
Content-Type: application/json

{
  "recipientId": "+33612345678",
  "type": "SMS",
  "message": "Rappel : Votre événement commence bientôt !",
  "status": "PENDING",
  "sendAt": "2026-04-01T10:00:00"
}
```

### Créer une notification PUSH

```bash
POST http://localhost:8084/api/notifications
Content-Type: application/json

{
  "recipientId": "device-token-from-firebase",
  "type": "PUSH",
  "message": "Nouvelle mise à jour disponible",
  "status": "PENDING",
  "sendAt": "2026-04-01T10:00:00"
}
```

### Réessayer une notification échouée

```bash
PUT http://localhost:8084/api/notifications/{id}/retry
```

---

## 🔄 Fonctionnalités

### Envoi immédiat
Les notifications sont envoyées immédiatement lors de la création (de manière asynchrone).

### Envoi programmé
Le service vérifie toutes les 60 secondes les notifications avec :
- `status = PENDING`
- `sendAt <= maintenant`

### Retry automatique
Utilisez l'endpoint `/api/notifications/{id}/retry` pour réessayer les notifications `FAILED`.

### Statuts
- **PENDING** : En attente d'envoi
- **SENT** : Envoyée avec succès
- **FAILED** : Échec d'envoi

---

## 🚀 Démarrage rapide

### Mode développement (tous les envois simulés)

```bash
# Aucune configuration nécessaire
# Les emails, SMS et push seront loggés mais pas envoyés
mvn quarkus:dev
```

### Mode production avec EMAIL uniquement

```bash
export EMAIL_FROM=noreply@votredomaine.com
export EMAIL_USERNAME=votre-email@gmail.com
export EMAIL_PASSWORD=votre-mot-de-passe-app

mvn quarkus:dev
```

---

## 📊 Monitoring

Les logs indiquent clairement :
- Quand une notification est créée
- Quand elle est envoyée (ou simulée)
- Les erreurs d'envoi
- Les retry

Exemple de logs :
```
Notification created with ID: 123, Type: EMAIL
Sending email to user@example.com with subject: Event Management Notification
Email sent successfully to user@example.com
```

---

## ⚠️ Sécurité

**Ne commitez JAMAIS vos credentials !**

Utilisez toujours des variables d'environnement ou un gestionnaire de secrets pour :
- Mots de passe email
- Tokens Twilio
- Fichiers de credentials Firebase

---

## 🧪 Tests

Swagger UI disponible : http://localhost:8084/q/swagger-ui

Testez les endpoints sans configurer de vrais services :
- Les emails/SMS/push seront loggés
- Le service fonctionnera normalement
- Aucune erreur ne sera levée
