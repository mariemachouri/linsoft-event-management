# Configuration BackOffice Client Keycloak
# Cree le client 'backoffice-client' pour Angular avec support Gateway

Write-Host ""
Write-Host "Configuration BackOffice Client - Keycloak" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$KEYCLOAK_URL = "http://localhost:8180"
$ADMIN_USER = "admin"
$ADMIN_PASSWORD = "admin"
$REALM_NAME = "event-mgmt"
$CLIENT_ID = "backoffice-client"

# Fonction pour obtenir le token admin
function Get-AdminToken {
    Write-Host "Authentification admin..." -ForegroundColor Yellow
    try {
        $body = @{
            grant_type = "password"
            client_id = "admin-cli"
            username = $ADMIN_USER
            password = $ADMIN_PASSWORD
        }
        
        $response = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
            -Method Post -Body $body -ContentType "application/x-www-form-urlencoded" -ErrorAction Stop
        
        Write-Host "OK - Authentification reussie" -ForegroundColor Green
        return $response.access_token
    } catch {
        Write-Host "ERREUR - Echec: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Attendre que Keycloak soit pret
Write-Host "Verification de Keycloak..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0
$isReady = $false

while (-not $isReady -and $attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "$KEYCLOAK_URL/health/ready" -Method Get -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $isReady = $true
            Write-Host "OK - Keycloak est pret" -ForegroundColor Green
        }
    } catch {
        $attempt++
        if ($attempt % 5 -eq 0) {
            Write-Host "  Tentative $attempt/$maxAttempts..." -ForegroundColor Gray
        }
        Start-Sleep -Seconds 2
    }
}

if (-not $isReady) {
    Write-Host "ERREUR - Keycloak indisponible" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Obtenir le token admin
$token = Get-AdminToken
if (-not $token) {
    Write-Host "ERREUR - Impossible de continuer" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host ""

# Verifier si le realm existe
Write-Host "Verification du realm '$REALM_NAME'..." -ForegroundColor Yellow
try {
    $realm = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME" `
        -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "OK - Realm trouve" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - Realm introuvable. Lancez: .\setup-keycloak-auto.ps1" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verifier si le client existe deja
Write-Host "Verification du client '$CLIENT_ID'..." -ForegroundColor Yellow
try {
    $existingClients = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=$CLIENT_ID" `
        -Method Get -Headers $headers -ErrorAction Stop
    
    if ($existingClients.Count -gt 0) {
        Write-Host "AVERTISSEMENT - Client existe deja" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Cyan
        Write-Host "  1. Supprimer et recreer" -ForegroundColor White
        Write-Host "  2. Garder l'existant" -ForegroundColor White
        Write-Host ""
        $choice = Read-Host "Votre choix (1 ou 2)"
        
        if ($choice -eq "1") {
            $clientId = $existingClients[0].id
            Write-Host "Suppression du client..." -ForegroundColor Yellow
            try {
                Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$clientId" `
                    -Method Delete -Headers $headers -ErrorAction Stop
                Write-Host "OK - Client supprime" -ForegroundColor Green
            } catch {
                Write-Host "ERREUR - Echec suppression" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "OK - Configuration conservee" -ForegroundColor Green
            exit 0
        }
    } else {
        Write-Host "OK - Client n'existe pas, creation..." -ForegroundColor Green
    }
} catch {
    Write-Host "ERREUR - Verification impossible" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Creer le client backoffice-client
Write-Host "Creation du client '$CLIENT_ID'..." -ForegroundColor Yellow
try {
    $clientConfig = @{
        clientId = $CLIENT_ID
        name = "BackOffice Angular Application"
        description = "Client public pour BackOffice Angular via Gateway"
        enabled = $true
        publicClient = $true
        directAccessGrantsEnabled = $true
        standardFlowEnabled = $true
        implicitFlowEnabled = $false
        serviceAccountsEnabled = $false
        authorizationServicesEnabled = $false
        fullScopeAllowed = $true
        protocol = "openid-connect"
        rootUrl = "http://localhost:4200"
        baseUrl = "http://localhost:4200"
        adminUrl = ""
        redirectUris = @(
            "http://localhost:4200/*"
            "http://localhost:8080/*"
        )
        attributes = @{
            "post.logout.redirect.uris" = "http://localhost:4200/*`nhttp://localhost:8080/*"
            "pkce.code.challenge.method" = "S256"
        }
        webOrigins = @(
            "http://localhost:4200"
            "http://localhost:8080"
            "+"
        )
    } | ConvertTo-Json -Depth 10
    
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" `
        -Method Post -Headers $headers -Body $clientConfig -ErrorAction Stop
    
    Write-Host "OK - Client cree avec succes!" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - Echec creation: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Configuration terminee ===" -ForegroundColor Green
Write-Host ""
Write-Host "Recapitulatif:" -ForegroundColor Cyan
Write-Host "  Client ID   : $CLIENT_ID" -ForegroundColor White
Write-Host "  Type        : Public Client" -ForegroundColor White
Write-Host "  Frontend    : http://localhost:4200" -ForegroundColor White
Write-Host "  Gateway     : http://localhost:8080" -ForegroundColor White
Write-Host "  Realm       : $REALM_NAME" -ForegroundColor White
Write-Host ""
Write-Host "Redirect URIs:" -ForegroundColor Cyan
Write-Host "  - http://localhost:4200/*" -ForegroundColor White
Write-Host "  - http://localhost:8080/*" -ForegroundColor White
Write-Host ""
Write-Host "Web Origins (CORS):" -ForegroundColor Cyan
Write-Host "  - http://localhost:4200" -ForegroundColor White
Write-Host "  - http://localhost:8080" -ForegroundColor White
Write-Host "  - + (tous redirect URIs)" -ForegroundColor White
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  1. Verifier dans Keycloak Admin Console" -ForegroundColor White
Write-Host "     URL: $KEYCLOAK_URL/admin/master/console" -ForegroundColor Gray
Write-Host "  2. Configurer environment.ts dans Angular" -ForegroundColor White
Write-Host "  3. Tester l'authentification" -ForegroundColor White
Write-Host ""
Write-Host "Script termine!" -ForegroundColor Green
Write-Host ""
