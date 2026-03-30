# Demarrage rapide des services principaux pour les tests Swagger

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Demarrage des Services Principaux" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Services a demarrer:" -ForegroundColor Yellow
Write-Host "  1. Users Service (Port 8083)" -ForegroundColor White
Write-Host "  2. Events Service (Port 8081)" -ForegroundColor White
Write-Host "  3. Registrations Service (Port 8082)" -ForegroundColor White
Write-Host "  4. Charges Service (Port 8086)" -ForegroundColor White
Write-Host ""

$response = Read-Host "Demarrer tous ces services? (O/N)"

if ($response -ne "O" -and $response -ne "o") {
    Write-Host "Annule." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Demarrage des services..." -ForegroundColor Green
Write-Host ""

# Users Service
Write-Host "[1/4] Demarrage de Users Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location 'services\users-service'; `$host.ui.RawUI.WindowTitle='Users Service (8083)'; mvn quarkus:dev}"
Start-Sleep -Seconds 3

# Events Service
Write-Host "[2/4] Demarrage de Events Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location 'services\events-service'; `$host.ui.RawUI.WindowTitle='Events Service (8081)'; mvn quarkus:dev}"
Start-Sleep -Seconds 3

# Registrations Service
Write-Host "[3/4] Demarrage de Registrations Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location 'services\registrations-service'; `$host.ui.RawUI.WindowTitle='Registrations Service (8082)'; mvn quarkus:dev}"
Start-Sleep -Seconds 3

# Charges Service
Write-Host "[4/4] Demarrage de Charges Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location 'services\charges-service'; `$host.ui.RawUI.WindowTitle='Charges Service (8086)'; mvn quarkus:dev}"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Services en cours de demarrage !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  - Chaque service s'ouvre dans une fenetre separee" -ForegroundColor White
Write-Host "  - Attendez le message 'Quarkus started' dans chaque fenetre" -ForegroundColor White
Write-Host "  - Premiere compilation: ~60-90 secondes par service" -ForegroundColor White
Write-Host ""

Write-Host "Attente de 90 secondes pour la compilation initiale..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

Write-Host ""
Write-Host "Verification de l'etat des services..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Verifier l'etat
$servicesStatus = @(
    @{Name="Users"; Port=8083},
    @{Name="Events"; Port=8081},
    @{Name="Registrations"; Port=8082},
    @{Name="Charges"; Port=8086}
)

Write-Host ""
$allReady = $true

foreach ($svc in $servicesStatus) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)/q/health" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "[OK] $($svc.Name) Service est pret !" -ForegroundColor Green
    } catch {
        Write-Host "[WAIT] $($svc.Name) Service n'est pas encore pret..." -ForegroundColor Yellow
        $allReady = $false
    }
}

Write-Host ""

if ($allReady) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  TOUS LES SERVICES SONT PRETS !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    $openSwagger = Read-Host "Ouvrir toutes les interfaces Swagger? (O/N)"
    
    if ($openSwagger -eq "O" -or $openSwagger -eq "o") {
        Write-Host ""
        Write-Host "Ouverture des interfaces Swagger..." -ForegroundColor Cyan
        
        Start-Process "http://localhost:8083/q/swagger-ui"
        Start-Sleep -Seconds 1
        Start-Process "http://localhost:8081/q/swagger-ui"
        Start-Sleep -Seconds 1
        Start-Process "http://localhost:8082/q/swagger-ui"
        Start-Sleep -Seconds 1
        Start-Process "http://localhost:8086/q/swagger-ui"
        
        Write-Host ""
        Write-Host "Interfaces Swagger ouvertes dans votre navigateur !" -ForegroundColor Green
    }
} else {
    Write-Host "Certains services ne sont pas encore prets." -ForegroundColor Yellow
    Write-Host "Attendez encore 30-60 secondes et verifiez avec:" -ForegroundColor Yellow
    Write-Host "  .\check-services-status.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Puis ouvrez Swagger avec:" -ForegroundColor Yellow
    Write-Host "  .\open-swagger-ui.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "Consultez le guide de test: SWAGGER-TESTING-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
