# Script d'installation Firebase Push Notifications
# Event Management System

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Firebase Push Notifications - Installation   " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour afficher les messages
function Write-Step {
    param($message)
    Write-Host "[STEP] $message" -ForegroundColor Yellow
}

function Write-Success {
    param($message)
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Write-Error {
    param($message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Vérifier si on est dans le bon répertoire
$backofficeDir = "BackOffice\back-offiice"
if (-not (Test-Path $backofficeDir)) {
    Write-Error "Le dossier BackOffice\back-offiice n'existe pas!"
    Write-Host "Assurez-vous d'exécuter ce script depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Aller dans le dossier BackOffice
Write-Step "Navigation vers le dossier BackOffice..."
Set-Location $backofficeDir
Write-Success "Dossier: $(Get-Location)"

# Vérifier si Node.js est installé
Write-Step "Vérification de Node.js..."
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Node.js version: $nodeVersion"
} else {
    Write-Error "Node.js n'est pas installé!"
    exit 1
}

# Installer les dépendances
Write-Step "Installation des dépendances Firebase..."
Write-Host "Cela peut prendre quelques minutes..." -ForegroundColor Cyan

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Success "Dépendances installées avec succès!"
} else {
    Write-Error "Erreur lors de l'installation des dépendances"
    exit 1
}

# Afficher les instructions pour la clé VAPID
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION REQUISE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Pour terminer la configuration, vous devez:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Obtenir la clé VAPID de Firebase:" -ForegroundColor White
Write-Host "   - Allez sur https://console.firebase.google.com" -ForegroundColor Gray
Write-Host "   - Sélectionnez le projet: event-mgmt-97441" -ForegroundColor Gray
Write-Host "   - Project Settings > Cloud Messaging" -ForegroundColor Gray
Write-Host "   - Copiez la clé VAPID (Web Push certificates)" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Mettre à jour le service:" -ForegroundColor White
Write-Host "   - Fichier: src\app\core\services\firebase-messaging.service.ts" -ForegroundColor Gray
Write-Host "   - Ligne 51: Remplacez 'VOTRE_VAPID_KEY' par votre clé" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Télécharger la clé privée pour le backend:" -ForegroundColor White
Write-Host "   - Dans Firebase Console: Project Settings > Service Accounts" -ForegroundColor Gray
Write-Host "   - Cliquez 'Generate new private key'" -ForegroundColor Gray
Write-Host "   - Placez le fichier dans: services\notifications-service\config\" -ForegroundColor Gray
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Demander si l'utilisateur veut ouvrir Firebase Console
$openConsole = Read-Host "Voulez-vous ouvrir Firebase Console maintenant? (O/N)"
if ($openConsole -eq "O" -or $openConsole -eq "o") {
    Start-Process "https://console.firebase.google.com/project/event-mgmt-97441/settings/cloudmessaging"
    Write-Success "Firebase Console ouverte dans votre navigateur"
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   PROCHAINES ÉTAPES" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configurez la clé VAPID (voir instructions ci-dessus)" -ForegroundColor White
Write-Host "2. Démarrez l'application: npm start" -ForegroundColor White
Write-Host "3. Testez les notifications: http://localhost:4200/notifications-push" -ForegroundColor White
Write-Host ""
Write-Host "📚 Pour plus de détails, consultez: FIREBASE-PUSH-INTEGRATION.md" -ForegroundColor Cyan
Write-Host ""

# Demander si l'utilisateur veut démarrer l'app
$startApp = Read-Host "Voulez-vous démarrer l'application maintenant? (O/N)"
if ($startApp -eq "O" -or $startApp -eq "o") {
    Write-Host ""
    Write-Host "Démarrage de l'application..." -ForegroundColor Green
    npm start
} else {
    Write-Host ""
    Write-Success "Installation terminée!"
    Write-Host "Pour démarrer l'app plus tard: cd BackOffice\back-offiice && npm start" -ForegroundColor Cyan
}
