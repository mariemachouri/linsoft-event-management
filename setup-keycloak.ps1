# Keycloak Setup Script
# Run this script after Keycloak is up and running

Write-Host "🔧 Keycloak Configuration Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$KEYCLOAK_URL = "http://localhost:8180"
$ADMIN_USER = "admin"
$ADMIN_PASSWORD = "admin"
$REALM_NAME = "event-mgmt"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Keycloak URL: $KEYCLOAK_URL"
Write-Host "  Admin User: $ADMIN_USER"
Write-Host "  Realm: $REALM_NAME"
Write-Host ""

# Wait for Keycloak to be ready
Write-Host "⏳ Waiting for Keycloak to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$isReady = $false

while (-not $isReady -and $attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "$KEYCLOAK_URL/health/ready" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $isReady = $true
            Write-Host "✅ Keycloak is ready!" -ForegroundColor Green
        }
    } catch {
        $attempt++
        Write-Host "  Attempt $attempt/$maxAttempts - Keycloak not ready yet..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $isReady) {
    Write-Host "❌ Keycloak did not become ready in time. Please check if it's running." -ForegroundColor Red
    Write-Host "   Run: docker-compose logs keycloak" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📖 Manual Configuration Steps:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Access Keycloak Admin Console:" -ForegroundColor Yellow
Write-Host "   URL: $KEYCLOAK_URL" -ForegroundColor White
Write-Host "   Username: $ADMIN_USER" -ForegroundColor White
Write-Host "   Password: $ADMIN_PASSWORD" -ForegroundColor White
Write-Host ""

Write-Host "2. Create Realm '$REALM_NAME':" -ForegroundColor Yellow
Write-Host "   - Click dropdown (top left) → 'Create Realm'" -ForegroundColor White
Write-Host "   - Realm name: $REALM_NAME" -ForegroundColor White
Write-Host "   - Enabled: ✓" -ForegroundColor White
Write-Host "   - Click 'Create'" -ForegroundColor White
Write-Host ""

Write-Host "3. Create Client 'users-service':" -ForegroundColor Yellow
Write-Host "   - Go to 'Clients' → 'Create client'" -ForegroundColor White
Write-Host "   - Client ID: users-service" -ForegroundColor White
Write-Host "   - Client authentication: ON" -ForegroundColor White
Write-Host "   - Valid redirect URIs: *" -ForegroundColor White
Write-Host "   - Web origins: *" -ForegroundColor White
Write-Host "   - Save and copy the Client Secret" -ForegroundColor White
Write-Host ""

Write-Host "4. Create Realm Roles:" -ForegroundColor Yellow
Write-Host "   - Go to 'Realm roles' → 'Create role'" -ForegroundColor White
Write-Host "   - Create these roles:" -ForegroundColor White
Write-Host "     • admin - System administrator" -ForegroundColor White
Write-Host "     • user - Standard user" -ForegroundColor White
Write-Host "     • event-organizer - Event organizer" -ForegroundColor White
Write-Host "     • participant - Event participant" -ForegroundColor White
Write-Host ""

Write-Host "5. Create Admin User:" -ForegroundColor Yellow
Write-Host "   - Go to 'Users' → 'Add user'" -ForegroundColor White
Write-Host "   - Username: admin" -ForegroundColor White
Write-Host "   - Email: admin@example.com" -ForegroundColor White
Write-Host "   - First name: Admin" -ForegroundColor White
Write-Host "   - Last name: User" -ForegroundColor White
Write-Host "   - Email verified: ✓" -ForegroundColor White
Write-Host "   - Enabled: ✓" -ForegroundColor White
Write-Host "   - Set password in 'Credentials' tab: admin123" -ForegroundColor White
Write-Host "   - Assign 'admin' role in 'Role mapping' tab" -ForegroundColor White
Write-Host ""

Write-Host "✅ Configuration guide complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 For more details, see: KEYCLOAK-AUTHENTICATION-GUIDE.md" -ForegroundColor Cyan
Write-Host ""

# Open browser to Keycloak
Write-Host "🌐 Opening Keycloak Admin Console..." -ForegroundColor Yellow
Start-Process $KEYCLOAK_URL
