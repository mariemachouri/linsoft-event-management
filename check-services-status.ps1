# Script de verification rapide de l'etat des services

Write-Host "Verification de l'etat des services..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="Eureka Server"; Port=8761},
    @{Name="Config Server"; Port=8888},
    @{Name="Gateway"; Port=8080},
    @{Name="Users"; Port=8083},
    @{Name="Events"; Port=8081},
    @{Name="Registrations"; Port=8082},
    @{Name="Notifications"; Port=8084},
    @{Name="Dashboard"; Port=8085},
    @{Name="Charges"; Port=8086}
)

$running = 0
$offline = 0

foreach ($svc in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)/q/health" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "[OK] $($svc.Name) - Port $($svc.Port)" -ForegroundColor Green
        $running++
    } catch {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)/actuator/health" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            Write-Host "[OK] $($svc.Name) - Port $($svc.Port)" -ForegroundColor Green
            $running++
        } catch {
            Write-Host "[OFFLINE] $($svc.Name) - Port $($svc.Port)" -ForegroundColor Red
            $offline++
        }
    }
}

Write-Host ""
Write-Host "Resultat: $running/$($services.Count) services actifs" -ForegroundColor $(if ($running -eq $services.Count) {"Green"} elseif ($running -gt 0) {"Yellow"} else {"Red"})
Write-Host ""

if ($offline -gt 0) {
    Write-Host "Pour demarrer les services manquants, ouvrez des terminaux separé et executez:" -ForegroundColor Yellow
    Write-Host "  cd services\[service-name]" -ForegroundColor Gray
    Write-Host "  mvn quarkus:dev (pour services Quarkus)" -ForegroundColor Gray
    Write-Host "  mvn spring-boot:run (pour Eureka, Config, Gateway)" -ForegroundColor Gray
}
