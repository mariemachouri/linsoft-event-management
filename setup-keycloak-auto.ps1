# Automated Keycloak Configuration Script
# Configures Keycloak via REST API

Write-Host "🔧 Keycloak Automated Configuration" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$KEYCLOAK_URL = "http://localhost:8180"
$ADMIN_USER = "admin"
$ADMIN_PASSWORD = "admin"
$REALM_NAME = "event-mgmt"
$CLIENT_ID = "users-service"
$CLIENT_SECRET = "your-secure-client-secret-change-in-production"

# Function to get admin access token
function Get-AdminToken {
    try {
        $body = @{
            grant_type = "password"
            client_id = "admin-cli"
            username = $ADMIN_USER
            password = $ADMIN_PASSWORD
        }
        
        $response = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
            -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
        
        return $response.access_token
    } catch {
        Write-Host "❌ Failed to get admin token: $_" -ForegroundColor Red
        return $null
    }
}

# Wait for Keycloak
Write-Host "⏳ Waiting for Keycloak..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$isReady = $false

while (-not $isReady -and $attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "$KEYCLOAK_URL/health/ready" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $isReady = $true
        }
    } catch {
        $attempt++
        Write-Host "  Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $isReady) {
    Write-Host "❌ Keycloak not ready" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Keycloak is ready" -ForegroundColor Green
Write-Host ""

# Get admin token
Write-Host "🔑 Getting admin access token..." -ForegroundColor Yellow
$token = Get-AdminToken
if (-not $token) {
    Write-Host "❌ Failed to authenticate" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Authenticated" -ForegroundColor Green
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 1. Create Realm
Write-Host "📦 Creating realm '$REALM_NAME'..." -ForegroundColor Yellow
try {
    $realmBody = @{
        realm = $REALM_NAME
        enabled = $true
    } | ConvertTo-Json
    
    $null = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms" `
        -Method Post -Headers $headers -Body $realmBody
    Write-Host "✅ Realm created" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  Realm already exists" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create realm: $_" -ForegroundColor Red
    }
}
Write-Host ""

# 2. Create Client
Write-Host "🔌 Creating client '$CLIENT_ID'..." -ForegroundColor Yellow
try {
    $clientBody = @{
        clientId = $CLIENT_ID
        enabled = $true
        publicClient = $false
        clientAuthenticatorType = "client-secret"
        secret = $CLIENT_SECRET
        redirectUris = @("*")
        webOrigins = @("*")
        standardFlowEnabled = $true
        directAccessGrantsEnabled = $true
        serviceAccountsEnabled = $true
        protocol = "openid-connect"
    } | ConvertTo-Json
    
    $null = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" `
        -Method Post -Headers $headers -Body $clientBody
    Write-Host "✅ Client created" -ForegroundColor Green
    Write-Host "   Client ID: $CLIENT_ID" -ForegroundColor White
    Write-Host "   Client Secret: $CLIENT_SECRET" -ForegroundColor White
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  Client already exists" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create client: $_" -ForegroundColor Red
    }
}
Write-Host ""

# 3. Create Roles
Write-Host "👥 Creating roles..." -ForegroundColor Yellow
$roles = @(
    @{ name = "admin"; description = "System administrator" },
    @{ name = "user"; description = "Standard user" },
    @{ name = "event-organizer"; description = "Event organizer" },
    @{ name = "participant"; description = "Event participant" }
)

foreach ($role in $roles) {
    try {
        $roleBody = @{
            name = $role.name
            description = $role.description
        } | ConvertTo-Json
        
        $null = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" `
            -Method Post -Headers $headers -Body $roleBody
        Write-Host "  ✅ Role '$($role.name)' created" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "  ⚠️  Role '$($role.name)' already exists" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ Failed to create role '$($role.name)': $_" -ForegroundColor Red
        }
    }
}
Write-Host ""

# 4. Create Admin User
Write-Host "👤 Creating admin user..." -ForegroundColor Yellow
try {
    $userBody = @{
        username = "admin"
        email = "admin@example.com"
        firstName = "Admin"
        lastName = "User"
        enabled = $true
        emailVerified = $true
        credentials = @(
            @{
                type = "password"
                value = "admin123"
                temporary = $false
            }
        )
    } | ConvertTo-Json -Depth 5
    
    $null = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" `
        -Method Post -Headers $headers -Body $userBody
    Write-Host "✅ User 'admin' created" -ForegroundColor Green
    Write-Host "   Username: admin" -ForegroundColor White
    Write-Host "   Password: admin123" -ForegroundColor White
    
    # Get user ID
    Start-Sleep -Seconds 1
    $users = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=admin" `
        -Method Get -Headers $headers
    $userId = $users[0].id
    
    # Get admin role
    $adminRole = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/admin" `
        -Method Get -Headers $headers
    
    # Assign admin role
    $roleMapping = @(
        @{
            id = $adminRole.id
            name = $adminRole.name
        }
    ) | ConvertTo-Json
    
    $null = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$userId/role-mappings/realm" `
        -Method Post -Headers $headers -Body $roleMapping
    Write-Host "✅ Admin role assigned" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  User 'admin' already exists" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create user: $_" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "🎉 Keycloak configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "  Realm: $REALM_NAME" -ForegroundColor White
Write-Host "  Client ID: $CLIENT_ID" -ForegroundColor White
Write-Host "  Client Secret: $CLIENT_SECRET" -ForegroundColor White
Write-Host "  Admin User: admin / admin123" -ForegroundColor White
Write-Host "  Roles: admin, user, event-organizer, participant" -ForegroundColor White
Write-Host ""
Write-Host "📝 Update application.properties with this client secret:" -ForegroundColor Yellow
Write-Host "  quarkus.oidc.credentials.secret=$CLIENT_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update users-service/src/main/resources/application.properties" -ForegroundColor White
Write-Host "  2. Restart Users Service: cd services/users-service; mvn quarkus:dev" -ForegroundColor White
Write-Host "  3. Test login: POST http://localhost:8083/api/auth/login" -ForegroundColor White
Write-Host ""
