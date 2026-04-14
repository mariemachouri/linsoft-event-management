# Script pour arrêter tous les services de l'Event Management

Write-Host "=== ARRET DES SERVICES EVENT MANAGEMENT ===" -ForegroundColor Cyan

# 1. Arrêter les services Spring Boot (Gateway + Eureka)
Write-Host "`n1. Arrêt des services Spring Boot..." -ForegroundColor Yellow
Get-Process -Name "*java*" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*gateway-service*" -or 
    $_.CommandLine -like "*eureka-server*"
} | ForEach-Object {
    Write-Host "   - Arrêt: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# 2. Arrêter les services Quarkus
Write-Host "`n2. Arrêt des services Quarkus..." -ForegroundColor Yellow
$quarkusPorts = @(8081, 8082, 8083, 8084, 8085, 8086)
foreach ($port in $quarkusPorts) {
    $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        $processId = $connection.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "   - Arrêt service sur port $port (PID: $processId)" -ForegroundColor Gray
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
}

# 3. Arrêter Angular
Write-Host "`n3. Arrêt BackOffice Angular..." -ForegroundColor Yellow
$angularPort = 4200
$connection = Get-NetTCPConnection -LocalPort $angularPort -State Listen -ErrorAction SilentlyContinue
if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   - Arrêt Angular (PID: $processId)" -ForegroundColor Gray
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

# 4. Arrêter Docker Compose
Write-Host "`n4. Arrêt des conteneurs Docker..." -ForegroundColor Yellow
docker-compose down

Write-Host "`n=== TOUS LES SERVICES SONT ARRETES ===" -ForegroundColor Green
Write-Host "`nPour redémarrer plus tard:" -ForegroundColor Cyan
Write-Host "  1. Docker:      docker-compose up -d" -ForegroundColor White
Write-Host "  2. Backend:     .\start-all-services.ps1" -ForegroundColor White
Write-Host "  3. BackOffice:  cd BackOffice\back-offiice; npm start" -ForegroundColor White
