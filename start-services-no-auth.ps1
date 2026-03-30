# Script de demarrage rapide des services SANS authentification
# Permet de tester immediatement pendant que Docker/Keycloak se configurent

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Rapide - Services Sans Auth" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ces services fonctionnent IMMEDIATEMENT sans Keycloak:" -ForegroundColor Green
Write-Host "  1. Events Service (Port 8081)" -ForegroundColor White
Write-Host "  2. Registrations Service (Port 8082)" -ForegroundColor White
Write-Host "  3. Charges Service (Port 8086)" -ForegroundColor White
Write-Host ""

Write-Host "Fonctionnalites disponibles:" -ForegroundColor Yellow
Write-Host "  - Creer, lister, modifier, supprimer des evenements" -ForegroundColor White
Write-Host "  - Creer, lister, supprimer des inscriptions" -ForegroundColor White
Write-Host "  - Creer, lister, supprimer des charges" -ForegroundColor White
Write-Host ""

$response = Read-Host "Demarrer ces services maintenant? (O/N)"

if ($response -ne "O" -and $response -ne "o") {
    Write-Host "Annule." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Demarrage des services..." -ForegroundColor Green
Write-Host ""

# Events Service
Write-Host "[1/3] Demarrage de Events Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location 'services\events-service'; `$host.ui.RawUI.WindowTitle='Events Service (8081) - PRET A TESTER'; Write-Host 'Attendez le message: Quarkus started' -ForegroundColor Yellow; mvn quarkus:dev}"
Start-Sleep -Seconds 3

# Registrations Service
Write-Host "[2/3] Demarrage de Registrations Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location 'services\registrations-service'; `$host.ui.RawUI.WindowTitle='Registrations Service (8082) - PRET A TESTER'; Write-Host 'Attendez le message: Quarkus started' -ForegroundColor Yellow; mvn quarkus:dev}"
Start-Sleep -Seconds 3

# Charges Service
Write-Host "[3/3] Demarrage de Charges Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location 'services\charges-service'; `$host.ui.RawUI.WindowTitle='Charges Service (8086) - PRET A TESTER'; Write-Host 'Attendez le message: Quarkus started' -ForegroundColor Yellow; mvn quarkus:dev}"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Services en cours de demarrage !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  - Attendez ~60-90 secondes (premiere compilation)" -ForegroundColor White
Write-Host "  - Cherchez 'Quarkus started' dans chaque fenetre" -ForegroundColor White
Write-Host ""

Write-Host "Attente de 90 secondes..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

Write-Host ""
Write-Host "Verification de l'etat..." -ForegroundColor Cyan
Write-Host ""

# Verifier l'etat
$servicesStatus = @(
    @{Name="Events"; Port=8081; Swagger="http://localhost:8081/q/swagger-ui"},
    @{Name="Registrations"; Port=8082; Swagger="http://localhost:8082/q/swagger-ui"},
    @{Name="Charges"; Port=8086; Swagger="http://localhost:8086/q/swagger-ui"}
)

$readyServices = @()

foreach ($svc in $servicesStatus) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)/q/health" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "[OK] $($svc.Name) Service est pret !" -ForegroundColor Green
        $readyServices += $svc
    } catch {
        Write-Host "[WAIT] $($svc.Name) Service n'est pas encore pret..." -ForegroundColor Yellow
    }
}

Write-Host ""

if ($readyServices.Count -gt 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  $($readyServices.Count) SERVICE(S) PRET(S) !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "TESTS RAPIDES SANS AUTHENTIFICATION:" -ForegroundColor Cyan
    Write-Host ""
    
    if ($readyServices.Name -contains "Events") {
        Write-Host "Events Service:" -ForegroundColor Yellow
        Write-Host "  Swagger: http://localhost:8081/q/swagger-ui" -ForegroundColor White
        Write-Host "  Test: POST /api/events avec:" -ForegroundColor White
        Write-Host '  {"name":"Test Event","description":"Mon premier evenement","location":"Paris","startDate":"2026-06-15T09:00:00","endDate":"2026-06-15T18:00:00","maxParticipants":100}' -ForegroundColor Gray
        Write-Host ""
    }
    
    if ($readyServices.Name -contains "Registrations") {
        Write-Host "Registrations Service:" -ForegroundColor Yellow
        Write-Host "  Swagger: http://localhost:8082/q/swagger-ui" -ForegroundColor White
        Write-Host "  Test: POST /api/registrations avec:" -ForegroundColor White
        Write-Host '  {"eventId":"test-123","userId":"user-456","status":"CONFIRMED","registrationDate":"2026-03-09T15:00:00"}' -ForegroundColor Gray
        Write-Host ""
    }
    
    if ($readyServices.Name -contains "Charges") {
        Write-Host "Charges Service:" -ForegroundColor Yellow
        Write-Host "  Swagger: http://localhost:8086/q/swagger-ui" -ForegroundColor White
        Write-Host "  Test: POST /api/charges avec:" -ForegroundColor White
        Write-Host '  {"eventId":"test-123","description":"Location salle","amount":1500.00,"category":"VENUE"}' -ForegroundColor Gray
        Write-Host ""
    }
    
    $openSwagger = Read-Host "`nOuvrir toutes les interfaces Swagger? (O/N)"
    
    if ($openSwagger -eq "O" -or $openSwagger -eq "o") {
        Write-Host ""
        Write-Host "Ouverture des interfaces Swagger..." -ForegroundColor Cyan
        
        foreach ($svc in $readyServices) {
            Start-Process $svc.Swagger
            Start-Sleep -Seconds 1
        }
        
        Write-Host ""
        Write-Host "Interfaces Swagger ouvertes !" -ForegroundColor Green
    }
} else {
    Write-Host "Les services ne sont pas encore prets." -ForegroundColor Yellow
    Write-Host "Attendez encore 30-60 secondes dans les fenetres ouvertes." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Une fois que vous voyez 'Quarkus started', ouvrez manuellement:" -ForegroundColor Yellow
    Write-Host "  http://localhost:8081/q/swagger-ui (Events)" -ForegroundColor White
    Write-Host "  http://localhost:8082/q/swagger-ui (Registrations)" -ForegroundColor White
    Write-Host "  http://localhost:8086/q/swagger-ui (Charges)" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INFO: Users Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Le Users Service necessite Keycloak." -ForegroundColor Yellow
Write-Host "Consultez: TROUBLESHOOTING-AUTH.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "En attendant, testez les 3 autres services ci-dessus !" -ForegroundColor Green
Write-Host ""
