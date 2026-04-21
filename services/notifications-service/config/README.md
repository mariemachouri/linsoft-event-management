# 📁 Dossier Config - Notifications Service

## Fichier requis

Placez ici le fichier de credentials Firebase :

📄 **firebase-credentials.json**

## Comment l'obtenir ?

### Étape 1 : Aller sur Firebase Console
https://console.firebase.google.com/project/event-mgmt-97441/settings/serviceaccounts/adminsdk

### Étape 2 : Générer la clé
1. Cliquez sur **"Générer une nouvelle clé privée"**
2. Confirmez
3. Le fichier JSON sera téléchargé

### Étape 3 : Renommer et placer
1. Renommez le fichier en : `firebase-credentials.json`
2. Placez-le dans ce dossier (`services/notifications-service/config/`)

## Structure attendue

```
services/
└── notifications-service/
    └── config/
        ├── .gitignore
        ├── README.md (ce fichier)
        └── firebase-credentials.json  ← À ajouter
```

## ⚠️ Sécurité

- ❌ **NE JAMAIS** commiter ce fichier dans Git
- ✅ Le fichier est dans `.gitignore`
- ✅ Contient des secrets sensibles

## Configuration Docker

Le fichier sera monté dans le conteneur via docker-compose.yml :

```yaml
notifications-service:
  volumes:
    - ./services/notifications-service/config:/app/config
  environment:
    - FIREBASE_ENABLED=true
    - FIREBASE_CREDENTIALS_PATH=config/firebase-credentials.json
```

## Vérification

Une fois le fichier placé :
```powershell
# Vérifier que le fichier existe
Test-Path services\notifications-service\config\firebase-credentials.json
# Devrait retourner: True
```

## Redémarrage requis

Après avoir placé le fichier :
```powershell
# Redémarrer le service
docker-compose restart notifications-service

# Vérifier les logs
docker logs notifications-service
# Vous devriez voir: "Firebase initialized successfully"
```

---

**👉 Téléchargez le fichier maintenant :**
https://console.firebase.google.com/project/event-mgmt-97441/settings/serviceaccounts/adminsdk
