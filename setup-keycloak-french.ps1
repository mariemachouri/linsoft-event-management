# Configure Keycloak realm to use French as default language
$KEYCLOAK_URL = "http://localhost:8180"
$REALM = "event-mgmt"
$ADMIN_USER = "admin"
$ADMIN_PASSWORD = "admin"

Write-Host "Connexion a Keycloak..." -ForegroundColor Cyan

# Get admin token
$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body "client_id=admin-cli&username=$ADMIN_USER&password=$ADMIN_PASSWORD&grant_type=password"

$token = $tokenResponse.access_token
Write-Host "Token obtenu." -ForegroundColor Green

# Update realm: enable internationalization, set French as default
$realmConfig = @{
    internationalizationEnabled = $true
    supportedLocales = @("fr", "en")
    defaultLocale = "fr"
    loginTheme = "linsoft"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM" `
    -Method PUT `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType "application/json" `
    -Body $realmConfig

Write-Host "Realm '$REALM' configure : theme=linsoft, langue=francais." -ForegroundColor Green
Write-Host "Rechargez la page de login Keycloak pour voir les changements." -ForegroundColor Yellow
