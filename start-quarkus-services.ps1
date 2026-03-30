# Script pour demarrer rapidement les services Quarkus uniquement

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Demarrage des services Quarkus" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="Users Service"; Path=".\services\users-service"; Port=8083},
    @{Name="Events Service"; Path=".\services\events-service"; Port=8081},
    @{Name="Registrations Service"; Path=".\services\registrations-service"; Port=8082},
    @{Name="Notifications Service"; Path=".\services\notifications-service"; Port=8084},
    @{Name="Dashboard Service"; Path=".\services\dashboard-service"; Port=8085},
    @{Name="Charges Service"; Path=".\services\charges-service"; Port=8086}
)

foreach ($svc in $services) {
    Write-Host "Demarrage de $($svc.Name) sur le port $($svc.Port)..." -ForegroundColor Yellow
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location '$($svc.Path)'; `$host.ui.RawUI.WindowTitle='$($svc.Name)'; mvn quarkus:dev}"
    
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Tous les services sont en cours de demarrage" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Attendez environ 60-90 secondes pour que tous les services soient prets." -ForegroundColor Yellow
Write-Host ""
Write-Host "Pour verifier l'etat des services, executez:" -ForegroundColor Cyan
Write-Host "  .\check-services-status.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Pour ouvrir les interfaces Swagger, executez:" -ForegroundColor Cyan
Write-Host "  .\open-swagger-ui.ps1" -ForegroundColor White
Write-Host ""
