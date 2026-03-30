# Guide rapide pour tester avec Swagger

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Guide: Tester avec Swagger UI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ETAPE 1: Demarrer Docker (si pas deja fait)" -ForegroundColor Yellow
Write-Host "  docker-compose up -d" -ForegroundColor White
Write-Host ""

Write-Host "ETAPE 2: Demarrer UN service pour commencer" -ForegroundColor Yellow
Write-Host "  Option A - Users Service (le plus complet):" -ForegroundColor Cyan
Write-Host "    cd services\users-service" -ForegroundColor White
Write-Host "    mvn quarkus:dev" -ForegroundColor White
Write-Host ""
Write-Host "  Option B - Events Service:" -ForegroundColor Cyan
Write-Host "    cd services\events-service" -ForegroundColor White
Write-Host "    mvn quarkus:dev" -ForegroundColor White
Write-Host ""

Write-Host "ETAPE 3: Attendre le message 'Quarkus started'" -ForegroundColor Yellow
Write-Host "  (Environ 30-60 secondes pour la premiere compilation)" -ForegroundColor Gray
Write-Host ""

Write-Host "ETAPE 4: Ouvrir Swagger UI dans le navigateur" -ForegroundColor Yellow
Write-Host "  Users Service: http://localhost:8083/q/swagger-ui" -ForegroundColor White
Write-Host "  Events Service: http://localhost:8081/q/swagger-ui" -ForegroundColor White
Write-Host "  Registrations: http://localhost:8082/q/swagger-ui" -ForegroundColor White
Write-Host "  Notifications: http://localhost:8084/q/swagger-ui" -ForegroundColor White
Write-Host "  Dashboard: http://localhost:8085/q/swagger-ui" -ForegroundColor White
Write-Host "  Charges: http://localhost:8086/q/swagger-ui" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  TESTS SWAGGER - Users Service" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Authentication (POST /api/auth/login)" -ForegroundColor Cyan
Write-Host "   Body:" -ForegroundColor Gray
Write-Host '   {"username": "admin", "password": "admin123"}' -ForegroundColor White
Write-Host "   -> Copier le 'accessToken' du resultat" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Autorisation (cliquer sur 'Authorize' en haut)" -ForegroundColor Cyan
Write-Host "   Entrer: Bearer <votre-token>" -ForegroundColor White
Write-Host ""

Write-Host "3. Tester les endpoints:" -ForegroundColor Cyan
Write-Host "   - GET /api/users (liste des utilisateurs)" -ForegroundColor White
Write-Host "   - GET /api/roles (liste des roles)" -ForegroundColor White
Write-Host "   - POST /api/users (creer un utilisateur)" -ForegroundColor White
Write-Host "   - PUT /api/users/{id} (modifier)" -ForegroundColor White
Write-Host "   - DELETE /api/users/{id} (supprimer)" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  TESTS SWAGGER - Events Service" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. GET /api/events (liste des evenements)" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. POST /api/events (creer un evenement)" -ForegroundColor Cyan
Write-Host "   Body:" -ForegroundColor Gray
Write-Host '   {' -ForegroundColor White
Write-Host '     "name": "Conference Tech 2026",' -ForegroundColor White
Write-Host '     "description": "Une conference sur les nouvelles technologies",' -ForegroundColor White
Write-Host '     "location": "Paris, France",' -ForegroundColor White
Write-Host '     "startDate": "2026-04-15T09:00:00",' -ForegroundColor White
Write-Host '     "endDate": "2026-04-15T18:00:00",' -ForegroundColor White
Write-Host '     "maxParticipants": 200' -ForegroundColor White
Write-Host '   }' -ForegroundColor White
Write-Host ""

Write-Host "3. GET /api/events/{id} (obtenir un evenement)" -ForegroundColor Cyan
Write-Host ""

Write-Host "4. DELETE /api/events/{id} (supprimer)" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMMANDE RAPIDE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Pour demarrer Users Service maintenant:" -ForegroundColor Yellow
Write-Host "  Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd services\users-service; mvn quarkus:dev'" -ForegroundColor White
Write-Host ""

$response = Read-Host "Voulez-vous demarrer Users Service maintenant? (O/N)"

if ($response -eq "O" -or $response -eq "o") {
    Write-Host ""
    Write-Host "Demarrage de Users Service..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd services\users-service; `$host.ui.RawUI.WindowTitle='Users Service'; mvn quarkus:dev"
    Write-Host ""
    Write-Host "Service en cours de demarrage dans une nouvelle fenetre..." -ForegroundColor Yellow
    Write-Host "Attendez le message 'Quarkus started', puis ouvrez:" -ForegroundColor Yellow
    Write-Host "  http://localhost:8083/q/swagger-ui" -ForegroundColor Cyan
    Write-Host ""
    
    Start-Sleep -Seconds 3
    Write-Host "Ouverture de Swagger UI dans 30 secondes..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    Start-Process "http://localhost:8083/q/swagger-ui"
}

Write-Host ""
Write-Host "Script termine." -ForegroundColor Green
