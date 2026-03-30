# Script de test pour tous les microservices
# Test complet de l'Event Management System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Event Management System - Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$services = @(
    @{Name="Eureka Server"; Port=8761; HealthPath="/actuator/health"; Type="Infrastructure"},
    @{Name="Config Server"; Port=8888; HealthPath="/actuator/health"; Type="Infrastructure"},
    @{Name="Gateway Service"; Port=8080; HealthPath="/actuator/health"; Type="Infrastructure"},
    @{Name="Users Service"; Port=8083; HealthPath="/q/health"; Type="Business"},
    @{Name="Events Service"; Port=8081; HealthPath="/q/health"; Type="Business"},
    @{Name="Registrations Service"; Port=8082; HealthPath="/q/health"; Type="Business"},
    @{Name="Notifications Service"; Port=8084; HealthPath="/q/health"; Type="Business"},
    @{Name="Dashboard Service"; Port=8085; HealthPath="/q/health"; Type="Business"},
    @{Name="Charges Service"; Port=8086; HealthPath="/q/health"; Type="Business"}
)

$results = @{
    Passed = 0
    Failed = 0
    Details = @()
}

function Test-ServiceHealth {
    param($Service)
    
    $url = "http://localhost:$($Service.Port)$($Service.HealthPath)"
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Test-Endpoint {
    param($Url, $Method = "GET", $Body = $null)
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 5
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        return @{Success=$true; Data=$response}
    } catch {
        return @{Success=$false; Error=$_.Exception.Message}
    }
}

# ============================================================================
# PHASE 1: Verification de la disponibilite des services
# ============================================================================
Write-Host "PHASE 1: Verification de la disponibilite des services" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
Write-Host ""

$unavailableServices = @()

foreach ($service in $services) {
    Write-Host "Testing $($service.Name) (Port $($service.Port))... " -NoNewline
    
    $isHealthy = Test-ServiceHealth -Service $service
    
    if ($isHealthy) {
        Write-Host "OK RUNNING" -ForegroundColor Green
        $results.Passed++
    } else {
        Write-Host "X OFFLINE" -ForegroundColor Red
        $results.Failed++
        $unavailableServices += $service.Name
    }
}

Write-Host ""

if ($unavailableServices.Count -gt 0) {
    Write-Host "AVERTISSEMENT: Services non disponibles:" -ForegroundColor Yellow
    foreach ($svc in $unavailableServices) {
        Write-Host "  - $svc" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Les tests des services non disponibles seront ignores." -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# PHASE 2: Test des endpoints des services metiers
# ============================================================================
Write-Host "PHASE 2: Test des endpoints des services metiers" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
Write-Host ""

# --- USERS SERVICE ---
if (-not ($unavailableServices -contains "Users Service")) {
    Write-Host "[USERS SERVICE]" -ForegroundColor Cyan
    
    # Test Login
    Write-Host "  1. Test Login... " -NoNewline
    $loginBody = @{
        username = "admin"
        password = "admin123"
    }
    $loginResult = Test-Endpoint -Url "http://localhost:8083/api/auth/login" -Method "POST" -Body $loginBody
    
    if ($loginResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        $token = $loginResult.Data.accessToken
        Write-Host "     Token received: $($token.Substring(0, 30))..." -ForegroundColor Gray
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
        Write-Host "     Error: $($loginResult.Error)" -ForegroundColor Red
    }
    
    # Test List Users
    Write-Host "  2. Test List Users... " -NoNewline
    $usersResult = Test-Endpoint -Url "http://localhost:8083/api/users"
    
    if ($usersResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        Write-Host "     Found $($usersResult.Data.Count) user(s)" -ForegroundColor Gray
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
    }
    
    # Test List Roles
    Write-Host "  3. Test List Roles... " -NoNewline
    $rolesResult = Test-Endpoint -Url "http://localhost:8083/api/roles"
    
    if ($rolesResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        Write-Host "     Found $($rolesResult.Data.Count) role(s)" -ForegroundColor Gray
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
    }
    
    Write-Host ""
}

# --- EVENTS SERVICE ---
if (-not ($unavailableServices -contains "Events Service")) {
    Write-Host "[EVENTS SERVICE]" -ForegroundColor Cyan
    
    # Test List Events
    Write-Host "  1. Test List Events... " -NoNewline
    $eventsResult = Test-Endpoint -Url "http://localhost:8081/api/events"
    
    if ($eventsResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        Write-Host "     Found $($eventsResult.Data.Count) event(s)" -ForegroundColor Gray
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
    }
    
    # Test Create Event
    Write-Host "  2. Test Create Event... " -NoNewline
    $eventBody = @{
        name = "Test Event"
        description = "Event created for testing"
        location = "Paris, France"
        startDate = "2026-04-01T10:00:00"
        endDate = "2026-04-01T18:00:00"
        maxParticipants = 100
    }
    $createEventResult = Test-Endpoint -Url "http://localhost:8081/api/events" -Method "POST" -Body $eventBody
    
    if ($createEventResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        $eventId = $createEventResult.Data.id
        Write-Host "     Event ID: $eventId" -ForegroundColor Gray
        
        # Test Get Event
        Write-Host "  3. Test Get Event by ID... " -NoNewline
        $getEventResult = Test-Endpoint -Url "http://localhost:8081/api/events/$eventId"
        
        if ($getEventResult.Success) {
            Write-Host "OK PASS" -ForegroundColor Green
            $results.Passed++
        } else {
            Write-Host "X FAIL" -ForegroundColor Red
            $results.Failed++
        }
        
        # Clean up - Delete Event
        Write-Host "  4. Test Delete Event... " -NoNewline
        $deleteEventResult = Test-Endpoint -Url "http://localhost:8081/api/events/$eventId" -Method "DELETE"
        
        if ($deleteEventResult.Success -or $deleteEventResult.Error -match "204") {
            Write-Host "OK PASS" -ForegroundColor Green
            $results.Passed++
        } else {
            Write-Host "X FAIL" -ForegroundColor Red
            $results.Failed++
        }
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
    }
    
    Write-Host ""
}

# --- REGISTRATIONS SERVICE ---
if (-not ($unavailableServices -contains "Registrations Service")) {
    Write-Host "[REGISTRATIONS SERVICE]" -ForegroundColor Cyan
    
    # Test List Registrations
    Write-Host "  1. Test List Registrations... " -NoNewline
    $regsResult = Test-Endpoint -Url "http://localhost:8082/api/registrations"
    
    if ($regsResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        Write-Host "     Found $($regsResult.Data.Count) registration(s)" -ForegroundColor Gray
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
    }
    
    # Test Create Registration
    Write-Host "  2. Test Create Registration... " -NoNewline
    $regBody = @{
        eventId = "test-event-123"
        userId = "test-user-456"
        status = "CONFIRMED"
        registrationDate = "2026-03-09T10:00:00"
    }
    $createRegResult = Test-Endpoint -Url "http://localhost:8082/api/registrations" -Method "POST" -Body $regBody
    
    if ($createRegResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        $regId = $createRegResult.Data.id
        
        # Clean up
        Write-Host "  3. Test Delete Registration... " -NoNewline
        $deleteRegResult = Test-Endpoint -Url "http://localhost:8082/api/registrations/$regId" -Method "DELETE"
        
        if ($deleteRegResult.Success -or $deleteRegResult.Error -match "204") {
            Write-Host "OK PASS" -ForegroundColor Green
            $results.Passed++
        } else {
            Write-Host "X FAIL" -ForegroundColor Red
            $results.Failed++
        }
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
    }
    
    Write-Host ""
}

# --- NOTIFICATIONS SERVICE ---
if (-not ($unavailableServices -contains "Notifications Service")) {
    Write-Host "[NOTIFICATIONS SERVICE]" -ForegroundColor Cyan
    
    # Test List Notifications
    Write-Host "  1. Test List Notifications... " -NoNewline
    $notifsResult = Test-Endpoint -Url "http://localhost:8084/api/notifications"
    
    if ($notifsResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        Write-Host "     Found $($notifsResult.Data.Count) notification(s)" -ForegroundColor Gray
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
    }
    
    Write-Host ""
}

# --- DASHBOARD SERVICE ---
if (-not ($unavailableServices -contains "Dashboard Service")) {
    Write-Host "[DASHBOARD SERVICE]" -ForegroundColor Cyan
    
    # Test List Dashboards
    Write-Host "  1. Test List Dashboard Snapshots... " -NoNewline
    $dashResult = Test-Endpoint -Url "http://localhost:8085/api/dashboard"
    
    if ($dashResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        Write-Host "     Found $($dashResult.Data.Count) snapshot(s)" -ForegroundColor Gray
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
    }
    
    Write-Host ""
}

# --- CHARGES SERVICE ---
if (-not ($unavailableServices -contains "Charges Service")) {
    Write-Host "[CHARGES SERVICE]" -ForegroundColor Cyan
    
    # Test List Charges
    Write-Host "  1. Test List Charges... " -NoNewline
    $chargesResult = Test-Endpoint -Url "http://localhost:8086/api/charges"
    
    if ($chargesResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        Write-Host "     Found $($chargesResult.Data.Count) charge(s)" -ForegroundColor Gray
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
    }
    
    # Test Create Charge
    Write-Host "  2. Test Create Charge... " -NoNewline
    $chargeBody = @{
        eventId = "test-event-789"
        description = "Test Charge"
        amount = 150.50
        category = "VENUE"
    }
    $createChargeResult = Test-Endpoint -Url "http://localhost:8086/api/charges" -Method "POST" -Body $chargeBody
    
    if ($createChargeResult.Success) {
        Write-Host "OK PASS" -ForegroundColor Green
        $results.Passed++
        $chargeId = $createChargeResult.Data.id
        
        # Clean up
        Write-Host "  3. Test Delete Charge... " -NoNewline
        $deleteChargeResult = Test-Endpoint -Url "http://localhost:8086/api/charges/$chargeId" -Method "DELETE"
        
        if ($deleteChargeResult.Success -or $deleteChargeResult.Error -match "204") {
            Write-Host "OK PASS" -ForegroundColor Green
            $results.Passed++
        } else {
            Write-Host "X FAIL" -ForegroundColor Red
            $results.Failed++
        }
    } else {
        Write-Host "X FAIL" -ForegroundColor Red
        $results.Failed++
    }
    
    Write-Host ""
}

# ============================================================================
# PHASE 3: Test via Gateway (si disponible)
# ============================================================================
if (-not ($unavailableServices -contains "Gateway Service")) {
    Write-Host "PHASE 3: Test des routes via Gateway" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
    
    $gatewayTests = @(
        @{Service="Events"; Path="/api/events/events"},
        @{Service="Registrations"; Path="/api/registrations/registrations"},
        @{Service="Users"; Path="/api/users/users"},
        @{Service="Notifications"; Path="/api/notifications/notifications"},
        @{Service="Dashboard"; Path="/api/dashboard/dashboard"},
        @{Service="Charges"; Path="/api/charges/charges"}
    )
    
    foreach ($test in $gatewayTests) {
        Write-Host "  Testing $($test.Service) via Gateway... " -NoNewline
        $gatewayResult = Test-Endpoint -Url "http://localhost:8080$($test.Path)"
        
        if ($gatewayResult.Success) {
            Write-Host "OK PASS" -ForegroundColor Green
            $results.Passed++
        } else {
            Write-Host "X FAIL" -ForegroundColor Red
            $results.Failed++
        }
    }
    
    Write-Host ""
}

# ============================================================================
# RESUME FINAL
# ============================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUME DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$total = $results.Passed + $results.Failed
$successRate = if ($total -gt 0) { [math]::Round(($results.Passed / $total) * 100, 2) } else { 0 }

Write-Host "Total des tests: $total" -ForegroundColor White
Write-Host "Reussis: " -NoNewline; Write-Host $results.Passed -ForegroundColor Green
Write-Host "Echoues: " -NoNewline; Write-Host $results.Failed -ForegroundColor Red
Write-Host "Taux de reussite: " -NoNewline
if ($successRate -ge 80) {
    Write-Host "$successRate%" -ForegroundColor Green
} elseif ($successRate -ge 50) {
    Write-Host "$successRate%" -ForegroundColor Yellow
} else {
    Write-Host "$successRate%" -ForegroundColor Red
}

Write-Host ""

if ($unavailableServices.Count -gt 0) {
    Write-Host "NOTE: $($unavailableServices.Count) service(s) non disponible(s)" -ForegroundColor Yellow
    Write-Host "Pour demarrer tous les services, utilisez: .\start-all-services.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# URLs utiles
Write-Host "URLs UTILES:" -ForegroundColor Yellow
Write-Host "  Eureka Dashboard: http://localhost:8761" -ForegroundColor Gray
Write-Host "  API Gateway: http://localhost:8080" -ForegroundColor Gray
Write-Host "  Users Swagger: http://localhost:8083/q/swagger-ui" -ForegroundColor Gray
Write-Host "  Events Swagger: http://localhost:8081/q/swagger-ui" -ForegroundColor Gray
Write-Host "  Registrations Swagger: http://localhost:8082/q/swagger-ui" -ForegroundColor Gray
Write-Host "  Notifications Swagger: http://localhost:8084/q/swagger-ui" -ForegroundColor Gray
Write-Host "  Dashboard Swagger: http://localhost:8085/q/swagger-ui" -ForegroundColor Gray
Write-Host "  Charges Swagger: http://localhost:8086/q/swagger-ui" -ForegroundColor Gray
Write-Host "  Keycloak: http://localhost:8180" -ForegroundColor Gray
Write-Host ""
