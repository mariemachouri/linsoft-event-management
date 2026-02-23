# Start all microservices for Event Management System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Event Management System - Starting Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Maven is installed
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Maven is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if Java 21 is installed
$javaVersion = java -version 2>&1 | Select-String "version" | ForEach-Object { $_ -replace '.*"(.+)".*', '$1' }
Write-Host "Java version detected: $javaVersion" -ForegroundColor Green
Write-Host ""

# Function to start a service in a new window
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Path,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Yellow
    
    $scriptBlock = {
        param($path, $command, $serviceName)
        Set-Location $path
        $host.ui.RawUI.WindowTitle = $serviceName
        Invoke-Expression $command
    }
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location '$Path'; `$host.ui.RawUI.WindowTitle='$ServiceName'; $Command}"
    
    Start-Sleep -Seconds 2
}

# Start Infrastructure Services
Write-Host "Starting Infrastructure Services..." -ForegroundColor Cyan
Write-Host ""

Start-Service -ServiceName "Eureka Server" -Path ".\services\eureka-server" -Command "mvn spring-boot:run" -Port 8761
Write-Host "Waiting for Eureka Server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Start-Service -ServiceName "Config Server" -Path ".\services\config-server" -Command "mvn spring-boot:run" -Port 8888
Write-Host "Waiting for Config Server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Start-Service -ServiceName "Gateway Service" -Path ".\services\gateway-service" -Command "mvn spring-boot:run" -Port 8080
Write-Host "Waiting for Gateway to start..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Starting Business Services..." -ForegroundColor Cyan
Write-Host ""

# Start Business Services
Start-Service -ServiceName "Events Service" -Path ".\services\events-service" -Command "mvn quarkus:dev" -Port 8081
Start-Sleep -Seconds 3

Start-Service -ServiceName "Registrations Service" -Path ".\services\registrations-service" -Command "mvn quarkus:dev" -Port 8082
Start-Sleep -Seconds 3

Start-Service -ServiceName "Users Service" -Path ".\services\users-service" -Command "mvn quarkus:dev" -Port 8083
Start-Sleep -Seconds 3

Start-Service -ServiceName "Notifications Service" -Path ".\services\notifications-service" -Command "mvn quarkus:dev" -Port 8084
Start-Sleep -Seconds 3

Start-Service -ServiceName "Dashboard Service" -Path ".\services\dashboard-service" -Command "mvn quarkus:dev" -Port 8085
Start-Sleep -Seconds 3

Start-Service -ServiceName "Charges Service" -Path ".\services\charges-service" -Command "mvn quarkus:dev" -Port 8086

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All services are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access points:" -ForegroundColor Cyan
Write-Host "  - Eureka Dashboard: http://localhost:8761" -ForegroundColor White
Write-Host "  - Config Server: http://localhost:8888" -ForegroundColor White
Write-Host "  - API Gateway: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop this script (services will continue running in separate windows)" -ForegroundColor Yellow
Write-Host ""

# Keep the script running
while ($true) {
    Start-Sleep -Seconds 1
}
