# 📚 Documentation - Système de Notifications

Bienvenue dans la documentation du système de notifications de l'Event Management System.

---

## 🚀 Démarrage Rapide

**Vous voulez juste tester ?** → Lisez [DEMARRAGE-RAPIDE-PUSH.md](DEMARRAGE-RAPIDE-PUSH.md)

**Vous voulez comprendre ce qui a été fait ?** → Lisez [RESUME-NOTIFICATIONS.md](RESUME-NOTIFICATIONS.md)

**Vous voulez tous les détails ?** → Lisez [RAPPORT-NOTIFICATIONS-15-AVRIL-2026.md](RAPPORT-NOTIFICATIONS-15-AVRIL-2026.md)

---

## 📖 Guides Disponibles

### 🎯 Pour Démarrer
| Document | Usage | Temps de lecture |
|----------|-------|------------------|
| [RESUME-NOTIFICATIONS.md](RESUME-NOTIFICATIONS.md) | Vue d'ensemble rapide | 3 min ⚡ |
| [DEMARRAGE-RAPIDE-PUSH.md](DEMARRAGE-RAPIDE-PUSH.md) | Tester les notifications push | 5 min ⚡ |

### 🔧 Pour Configurer
| Document | Usage | Temps de lecture |
|----------|-------|------------------|
| [services/notifications-service/NOTIFICATIONS-GUIDE.md](services/notifications-service/NOTIFICATIONS-GUIDE.md) | Config EMAIL/SMS/PUSH | 10 min |
| [BackOffice/FIREBASE-PUSH-INTEGRATION.md](BackOffice/FIREBASE-PUSH-INTEGRATION.md) | Intégration Firebase complète | 15 min |
| [services/notifications-service/config/README.md](services/notifications-service/config/README.md) | Placement credentials Firebase | 2 min ⚡ |

### 📊 Pour Comprendre
| Document | Usage | Temps de lecture |
|----------|-------|------------------|
| [RAPPORT-NOTIFICATIONS-15-AVRIL-2026.md](RAPPORT-NOTIFICATIONS-15-AVRIL-2026.md) | Rapport technique complet | 20 min |
| [FIREBASE-PUSH-RECAP.md](FIREBASE-PUSH-RECAP.md) | Récapitulatif Firebase | 10 min |

---

## 🎯 Par Objectif

### Je veux tester les notifications push
1. Lire [DEMARRAGE-RAPIDE-PUSH.md](DEMARRAGE-RAPIDE-PUSH.md)
2. Exécuter `.\setup-firebase-push.ps1`
3. Démarrer l'app : `cd BackOffice\back-offiice && npm start`
4. Ouvrir http://localhost:4200

### Je veux configurer Firebase
1. Lire [BackOffice/FIREBASE-PUSH-INTEGRATION.md](BackOffice/FIREBASE-PUSH-INTEGRATION.md)
2. Suivre les étapes de configuration
3. Télécharger les credentials
4. Placer le fichier JSON (voir [config/README.md](services/notifications-service/config/README.md))

### Je veux comprendre l'architecture
1. Lire [RESUME-NOTIFICATIONS.md](RESUME-NOTIFICATIONS.md) (vue d'ensemble)
2. Lire [RAPPORT-NOTIFICATIONS-15-AVRIL-2026.md](RAPPORT-NOTIFICATIONS-15-AVRIL-2026.md) (détails)
3. Consulter les diagrammes dans le rapport

### Je veux configurer EMAIL ou SMS
1. Lire [services/notifications-service/NOTIFICATIONS-GUIDE.md](services/notifications-service/NOTIFICATIONS-GUIDE.md)
2. Configurer les variables d'environnement
3. Redémarrer le service

---

## 🛠️ Outils & Scripts

| Script | Description |
|--------|-------------|
| `setup-firebase-push.ps1` | Installation automatique Firebase |
| `start-all-services.ps1` | Démarrage complet (backend) |

---

## 🔗 Liens Utiles

- **Firebase Console :** https://console.firebase.google.com/project/event-mgmt-97441
- **Swagger API :** http://localhost:8084/swagger-ui
- **Application :** http://localhost:4200

---

## 📊 Statut du Projet

| Module | Status |
|--------|--------|
| EMAIL Notifications | ✅ Opérationnel |
| SMS Notifications | ✅ Configuré |
| PUSH Notifications | ✅ Intégré |
| Documentation | ✅ Complète |
| Tests | ⏳ En cours |

---

## 💡 Besoin d'Aide ?

1. **Problème de configuration ?** → Voir section Troubleshooting dans [FIREBASE-PUSH-INTEGRATION.md](BackOffice/FIREBASE-PUSH-INTEGRATION.md)
2. **Erreur de compilation ?** → Voir [DEMARRAGE-RAPIDE-PUSH.md](DEMARRAGE-RAPIDE-PUSH.md)
3. **Question générale ?** → Lire [RAPPORT-NOTIFICATIONS-15-AVRIL-2026.md](RAPPORT-NOTIFICATIONS-15-AVRIL-2026.md)

---

**Dernière mise à jour :** 15 avril 2026  
**Statut :** ✅ Production Ready (après tests)
