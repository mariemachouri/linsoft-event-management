# Script pour ouvrir toutes les interfaces Swagger UI des microservices

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ouverture des interfaces Swagger UI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Liste de tous les services
$services = @(
    @{Name="Users Service"; Port=8083; SwaggerPath="/q/swagger-ui"},
    @{Name="Events Service"; Port=8081; SwaggerPath="/q/swagger-ui"},
    @{Name="Registrations Service"; Port=8082; SwaggerPath="/q/swagger-ui"},
    @{Name="Notifications Service"; Port=8084; SwaggerPath="/q/swagger-ui"},
    @{Name="Dashboard Service"; Port=8085; SwaggerPath="/q/swagger-ui"},
    @{Name="Charges Service"; Port=8086; SwaggerPath="/q/swagger-ui"}
)

Write-Host "Ouverture de toutes les interfaces Swagger..." -ForegroundColor Yellow
Write-Host "(Les services non demarres afficheront une erreur)" -ForegroundColor Gray
Write-Host ""

foreach ($svc in $services) {
    $swaggerUrl = "http://localhost:$($svc.Port)$($svc.SwaggerPath)"
    Write-Host "Ouverture: $($svc.Name)" -ForegroundColor Cyan
    Start-Process $swaggerUrl
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Interfaces Swagger ouvertes !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "URLS des interfaces Swagger:" -ForegroundColor Cyan
foreach ($svc in $services) {
    Write-Host "  $($svc.Name): http://localhost:$($svc.Port)$($svc.SwaggerPath)" -ForegroundColor White
}

Write-Host ""
Write-Host "GUIDE DE TEST: Consultez SWAGGER-TESTING-GUIDE.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "AUTRES URLS UTILES:" -ForegroundColor Cyan
Write-Host "  Eureka Dashboard: http://localhost:8761" -ForegroundColor White
Write-Host "  API Gateway: http://localhost:8080" -ForegroundColor White
Write-Host "  Keycloak Admin: http://localhost:8180" -ForegroundColor White
Write-Host ""
