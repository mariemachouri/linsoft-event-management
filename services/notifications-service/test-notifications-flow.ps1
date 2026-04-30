#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Teste le flux complet : création d'entités → messages Kafka → emails envoyés.

.DESCRIPTION
    Ce script appelle les APIs REST des microservices pour déclencher des
    événements Kafka, puis vérifie dans le notifications-service que les
    notifications ont bien été créées et envoyées.

.NOTES
    Prérequis :
      - Kafka démarré (docker-compose.yml)
      - notifications-service démarré sur :8084
      - events-service démarré sur :8081 (optionnel pour test event→email)
      - users-service démarré sur :8085 (optionnel pour test user→email)
#>

$NOTIFICATIONS_URL = "http://localhost:8084/api/notifications"
$EVENTS_URL        = "http://localhost:8081/api/events"
$REGISTRATIONS_URL = "http://localhost:8082/api/registrations"
$USERS_URL         = "http://localhost:8085/api/users"

$headers = @{ "Content-Type" = "application/json" }

function Write-Step($msg) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Write-Ok($msg)   { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "  ℹ  $msg" -ForegroundColor Yellow }

# ---------------------------------------------------------------
# 1. Vérifier que le notifications-service répond
# ---------------------------------------------------------------
Write-Step "1. Vérification de la disponibilité du notifications-service"
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8084/q/health" -TimeoutSec 5
    Write-Ok "notifications-service UP - status: $($health.status)"
} catch {
    Write-Fail "notifications-service non disponible sur :8084"
    Write-Info "Démarrez-le avec : cd services\notifications-service && mvn quarkus:dev"
    exit 1
}

# ---------------------------------------------------------------
# 2. Test direct via l'API REST du notifications-service
#    (simule ce que Kafka ferait en créant une notification EMAIL)
# ---------------------------------------------------------------
Write-Step "2. Création d'une notification EMAIL via l'API REST"

$testEmail = Read-Host "  Entrez l'adresse email destinataire pour le test (ou appuyez sur Entrée pour ignorer)"

if ($testEmail) {
    $payload = @{
        recipientId = $testEmail
        type        = "EMAIL"
        message     = "TEST FLUX COMPLET - Ceci est un email de test envoyé depuis le script de validation. Si vous recevez cet email, la configuration SMTP fonctionne correctement."
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri $NOTIFICATIONS_URL `
            -Method POST -Headers $headers -Body $payload -TimeoutSec 15
        Write-Ok "Notification créée : ID=$($result.id), Status=$($result.status)"
        Write-Info "Vérifiez votre boîte mail $testEmail"
    } catch {
        Write-Fail "Échec création notification : $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Fail "Détail : $($reader.ReadToEnd())"
        }
    }
}

# ---------------------------------------------------------------
# 3. Test via Kafka : création d'un utilisateur (welcome email)
#    → users-service publie sur user.created → notifications reçoit
# ---------------------------------------------------------------
Write-Step "3. Test Kafka : création utilisateur → welcome email"

$usersAvailable = $false
try {
    Invoke-RestMethod -Uri "$USERS_URL" -TimeoutSec 3 | Out-Null
    $usersAvailable = $true
} catch { }

if ($usersAvailable) {
    $testUser = @{
        username    = "test.kafka.$(Get-Random -Maximum 9999)"
        email       = if ($testEmail) { $testEmail } else { "test@example.com" }
        firstName   = "Test"
        lastName    = "Kafka"
        phoneNumber = "+33600000000"
    } | ConvertTo-Json

    try {
        $user = Invoke-RestMethod -Uri $USERS_URL -Method POST -Headers $headers -Body $testUser -TimeoutSec 10
        Write-Ok "Utilisateur créé : ID=$($user.id), Username=$($user.username)"
        Write-Info "Kafka devrait publier sur user.created → notifications-service envoie un welcome email"

        Start-Sleep -Seconds 3

        # Vérifier les notifications créées
        $notifications = Invoke-RestMethod -Uri $NOTIFICATIONS_URL -TimeoutSec 5
        $recent = $notifications | Where-Object { $_.recipientId -eq $user.email } | Select-Object -Last 1
        if ($recent) {
            Write-Ok "Notification trouvée dans MongoDB : Status=$($recent.status)"
        } else {
            Write-Info "Aucune notification trouvée pour $($user.email) (Kafka peut prendre quelques secondes)"
        }
    } catch {
        Write-Fail "Échec création utilisateur : $($_.Exception.Message)"
    }
} else {
    Write-Info "users-service non disponible sur :8085 - Test Kafka user.created ignoré"
}

# ---------------------------------------------------------------
# 4. Test via Kafka : création d'un événement
# ---------------------------------------------------------------
Write-Step "4. Test Kafka : création événement → email organisateur"

$eventsAvailable = $false
try {
    Invoke-RestMethod -Uri "$EVENTS_URL" -TimeoutSec 3 | Out-Null
    $eventsAvailable = $true
} catch { }

if ($eventsAvailable -and $testEmail) {
    $testEvent = @{
        title       = "Événement Test Kafka $(Get-Random -Maximum 9999)"
        description = "Test du flux Kafka notifications"
        location    = "Paris, France"
        startAt     = "2026-06-01T10:00:00"
        endAt       = "2026-06-01T18:00:00"
        capacity    = 100
        # organizerId doit être l'email de l'organisateur pour que l'email soit envoyé
        organizerId = $testEmail
        category    = "CONFERENCE"
    } | ConvertTo-Json

    try {
        $event = Invoke-RestMethod -Uri $EVENTS_URL -Method POST -Headers $headers -Body $testEvent -TimeoutSec 10
        Write-Ok "Événement créé : ID=$($event.id), Title=$($event.title)"
        Write-Info "Kafka devrait publier sur event.created → notifications-service envoie un email à $testEmail"
    } catch {
        Write-Fail "Échec création événement : $($_.Exception.Message)"
    }
} else {
    if (-not $eventsAvailable) { Write-Info "events-service non disponible sur :8081 - Test Kafka event.created ignoré" }
    if (-not $testEmail)       { Write-Info "Pas d'email de test fourni - Test Kafka event.created ignoré" }
}

# ---------------------------------------------------------------
# 5. Vérifier la liste des notifications dans MongoDB
# ---------------------------------------------------------------
Write-Step "5. Liste des notifications dans MongoDB"
try {
    $all = Invoke-RestMethod -Uri $NOTIFICATIONS_URL -TimeoutSec 5
    if ($all -and $all.Count -gt 0) {
        Write-Ok "$($all.Count) notification(s) dans la base :"
        $all | Select-Object -Last 5 | ForEach-Object {
            Write-Host "    • ID=$($_.id)  Type=$($_.type)  Status=$($_.status)  To=$($_.recipientId)"
        }
    } else {
        Write-Info "Aucune notification en base (normal si Kafka n'est pas encore connecté)"
    }
} catch {
    Write-Fail "Impossible de lister les notifications : $($_.Exception.Message)"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  Swagger UI : http://localhost:8084/q/swagger-ui" -ForegroundColor Green
Write-Host "  Health     : http://localhost:8084/q/health" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
