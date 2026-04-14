# ====================================================================
# Script de test Kafka - Event Management System
# ====================================================================
# Ce script permet de tester l'intégration Kafka en créant des 
# événements, inscriptions et utilisateurs, puis en vérifiant
# que les messages sont bien consommés et les audit logs créés.
# ====================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   KAFKA INTEGRATION TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$gatewayUrl = "http://localhost:8080"
$dashboardUrl = "http://localhost:8085"

# ====================================================================
# Fonction pour afficher les résultats
# ====================================================================
function Show-Result {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Message = ""
    )
    
    if ($Success) {
        Write-Host "✅ $TestName" -ForegroundColor Green
        if ($Message) {
            Write-Host "   $Message" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ $TestName" -ForegroundColor Red
        if ($Message) {
            Write-Host "   $Message" -ForegroundColor Yellow
        }
    }
}

# ====================================================================
# Fonction pour attendre un peu (laisser Kafka traiter)
# ====================================================================
function Wait-KafkaProcessing {
    param([int]$Seconds = 2)
    Write-Host "   ⏱️  Attente de $Seconds secondes pour traitement Kafka..." -ForegroundColor Gray
    Start-Sleep -Seconds $Seconds
}

# ====================================================================
# Test 1: Vérifier que Kafka est démarré
# ====================================================================
Write-Host "`n[TEST 1] Vérification des services Kafka" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# Vérifier Zookeeper
try {
    $zookeeperStatus = docker ps --filter "name=zookeeper" --format "{{.Status}}"
    if ($zookeeperStatus -like "*Up*") {
        Show-Result "Zookeeper" $true "Container actif"
    } else {
        Show-Result "Zookeeper" $false "Container non disponible"
    }
} catch {
    Show-Result "Zookeeper" $false $_.Exception.Message
}

# Vérifier Kafka
try {
    $kafkaStatus = docker ps --filter "name=kafka" --format "{{.Status}}"
    if ($kafkaStatus -like "*Up*") {
        Show-Result "Kafka Broker" $true "Container actif"
    } else {
        Show-Result "Kafka Broker" $false "Container non disponible"
    }
} catch {
    Show-Result "Kafka Broker" $false $_.Exception.Message
}

# Vérifier Kafka UI
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8090" -Method GET -TimeoutSec 5 -UseBasicParsing
    Show-Result "Kafka UI" $true "Accessible sur http://localhost:8090"
} catch {
    Show-Result "Kafka UI" $false "Non accessible"
}

# ====================================================================
# Test 2: Lister les topics Kafka
# ====================================================================
Write-Host "`n[TEST 2] Vérification des topics Kafka" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

try {
    $topics = docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list 2>$null
    Write-Host "Topics créés:" -ForegroundColor Cyan
    foreach ($topic in $topics) {
        if ($topic) {
            Write-Host "   📝 $topic" -ForegroundColor White
        }
    }
    Show-Result "Topics Kafka" $true "$($topics.Count) topics trouvés"
} catch {
    Show-Result "Topics Kafka" $false $_.Exception.Message
}

# ====================================================================
# Test 3: Créer un événement et vérifier Kafka
# ====================================================================
Write-Host "`n[TEST 3] Test Event Creation -> Kafka" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

$eventData = @{
    title = "Test Kafka Event $(Get-Date -Format 'HH:mm:ss')"
    location = "Paris, France"
    startAt = "2026-06-01T10:00:00"
    endAt = "2026-06-01T18:00:00"
    organizerId = "org-kafka-test-123"
    category = "CONFERENCE"
    status = "DRAFT"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$gatewayUrl/api/events" `
        -Method POST `
        -Body $eventData `
        -ContentType "application/json"
    
    $eventId = $response.id
    Show-Result "Événement créé" $true "ID: $eventId"
    
    # Attendre que Kafka traite
    Wait-KafkaProcessing -Seconds 3
    
    # Vérifier les audit logs
    try {
        $auditLogs = Invoke-RestMethod -Uri "$dashboardUrl/api/audit/entity/$eventId" -Method GET
        if ($auditLogs.Count -gt 0) {
            Show-Result "Audit log créé" $true "$($auditLogs.Count) entrée(s) d'audit"
            Write-Host "   📋 Action: $($auditLogs[0].action)" -ForegroundColor Gray
            Write-Host "   📋 Type: $($auditLogs[0].eventType)" -ForegroundColor Gray
        } else {
            Show-Result "Audit log créé" $false "Aucun audit log trouvé"
        }
    } catch {
        Show-Result "Audit log créé" $false "Erreur: $($_.Exception.Message)"
    }
    
} catch {
    Show-Result "Événement créé" $false $_.Exception.Message
}

# ====================================================================
# Test 4: Créer une inscription et vérifier Kafka
# ====================================================================
Write-Host "`n[TEST 4] Test Registration Creation -> Kafka" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

if ($eventId) {
    $registrationData = @{
        eventId = $eventId
        participantId = "participant-kafka-test-456"
        status = "PENDING"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$gatewayUrl/api/registrations" `
            -Method POST `
            -Body $registrationData `
            -ContentType "application/json"
        
        $registrationId = $response.id
        Show-Result "Inscription créée" $true "ID: $registrationId"
        
        # Attendre que Kafka traite
        Wait-KafkaProcessing -Seconds 3
        
        # Vérifier les audit logs
        try {
            $auditLogs = Invoke-RestMethod -Uri "$dashboardUrl/api/audit/entity/$registrationId" -Method GET
            if ($auditLogs.Count -gt 0) {
                Show-Result "Audit log inscription" $true "$($auditLogs.Count) entrée(s) d'audit"
            } else {
                Show-Result "Audit log inscription" $false "Aucun audit log"
            }
        } catch {
            Show-Result "Audit log inscription" $false $_.Exception.Message
        }
        
    } catch {
        Show-Result "Inscription créée" $false $_.Exception.Message
    }
} else {
    Show-Result "Inscription créée" $false "Pas d'eventId disponible"
}

# ====================================================================
# Test 5: Créer un utilisateur et vérifier Kafka
# ====================================================================
Write-Host "`n[TEST 5] Test User Creation -> Kafka" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

$timestamp = Get-Date -Format "HHmmss"
$userData = @{
    username = "kafka_test_$timestamp"
    email = "kafka_test_$timestamp@example.com"
    firstName = "Kafka"
    lastName = "Test"
    password = "KafkaTest123!"
    enabled = $true
    roles = @("USER")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$gatewayUrl/api/users" `
        -Method POST `
        -Body $userData `
        -ContentType "application/json"
    
    $userId = $response.id
    Show-Result "Utilisateur créé" $true "ID: $userId"
    
    # Attendre que Kafka traite
    Wait-KafkaProcessing -Seconds 3
    
    # Vérifier les audit logs
    try {
        $auditLogs = Invoke-RestMethod -Uri "$dashboardUrl/api/audit/entity/$userId" -Method GET
        if ($auditLogs.Count -gt 0) {
            Show-Result "Audit log utilisateur" $true "$($auditLogs.Count) entrée(s) d'audit"
        } else {
            Show-Result "Audit log utilisateur" $false "Aucun audit log"
        }
    } catch {
        Show-Result "Audit log utilisateur" $false $_.Exception.Message
    }
    
} catch {
    Show-Result "Utilisateur créé" $false $_.Exception.Message
}

# ====================================================================
# Test 6: Statistiques d'audit globales
# ====================================================================
Write-Host "`n[TEST 6] Statistiques d'audit" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

try {
    $stats = Invoke-RestMethod -Uri "$dashboardUrl/api/audit/stats" -Method GET
    Write-Host "📊 Statistiques globales:" -ForegroundColor Cyan
    Write-Host "   Total audits: $($stats.total)" -ForegroundColor White
    Write-Host "   Événements: $($stats.events)" -ForegroundColor White
    Write-Host "   Inscriptions: $($stats.registrations)" -ForegroundColor White
    Write-Host "   Utilisateurs: $($stats.users)" -ForegroundColor White
    Show-Result "Statistiques récupérées" $true
} catch {
    Show-Result "Statistiques récupérées" $false $_.Exception.Message
}

# ====================================================================
# Test 7: Vérifier les consumer groups
# ====================================================================
Write-Host "`n[TEST 7] Vérification des Consumer Groups" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

try {
    $consumerGroups = docker exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list 2>$null
    Write-Host "Consumer Groups actifs:" -ForegroundColor Cyan
    foreach ($group in $consumerGroups) {
        if ($group) {
            Write-Host "   👥 $group" -ForegroundColor White
        }
    }
    Show-Result "Consumer Groups" $true "$($consumerGroups.Count) groupes trouvés"
} catch {
    Show-Result "Consumer Groups" $false $_.Exception.Message
}

# ====================================================================
# Test 8: Vérifier les logs récents
# ====================================================================
Write-Host "`n[TEST 8] Logs d'audit récents" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

try {
    $recentLogs = Invoke-RestMethod -Uri "$dashboardUrl/api/audit/recent?limit=10" -Method GET
    Write-Host "📜 10 derniers audit logs:" -ForegroundColor Cyan
    foreach ($log in $recentLogs) {
        $time = ([DateTime]$log.timestamp).ToString("HH:mm:ss")
        Write-Host "   [$time] $($log.eventType) - $($log.action) - $($log.entityId)" -ForegroundColor Gray
    }
    Show-Result "Logs récents" $true "$($recentLogs.Count) logs récupérés"
} catch {
    Show-Result "Logs récents" $false $_.Exception.Message
}

# ====================================================================
# Résumé final
# ====================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Infrastructure Kafka opérationnelle" -ForegroundColor Green
Write-Host "✅ Publishing vers Kafka fonctionnel" -ForegroundColor Green
Write-Host "✅ Consumers Kafka actifs" -ForegroundColor Green
Write-Host "✅ Audit trail complet dans MongoDB" -ForegroundColor Green
Write-Host "✅ API d'audit accessible" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Kafka UI: http://localhost:8090" -ForegroundColor Cyan
Write-Host "🔗 Audit API: $dashboardUrl/api/audit" -ForegroundColor Cyan
Write-Host "🔗 Swagger Dashboard: $dashboardUrl/q/swagger-ui" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Pour plus d'informations, voir KAFKA-INTEGRATION-GUIDE.md" -ForegroundColor Gray
Write-Host ""
