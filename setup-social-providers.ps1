# ============================================================
#  CONFIGURATION DES IDENTITY PROVIDERS SOCIAUX - KEYCLOAK
#  Realm: event-mgmt | Client: backoffice-client
# ============================================================
#
#  AVANT D'EXECUTER CE SCRIPT :
#  Remplissez les credentials de chaque provider ci-dessous.
#  Mettez "" pour sauter un provider non configure.
#
#  COMMENT OBTENIR LES CREDENTIALS :
#
#  GOOGLE    -> https://console.cloud.google.com/apis/credentials
#               Creer un "OAuth 2.0 Client ID" (Web application)
#               Authorized redirect URI : http://localhost:8180/realms/event-mgmt/broker/google/endpoint
#
#  MICROSOFT -> https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
#               Nouvelle inscription d'application
#               Redirect URI : http://localhost:8180/realms/event-mgmt/broker/microsoft/endpoint
#
#  FACEBOOK  -> https://developers.facebook.com/apps/
#               Creer une app, activer "Facebook Login"
#               Redirect URI : http://localhost:8180/realms/event-mgmt/broker/facebook/endpoint
#
#  GITHUB    -> https://github.com/settings/developers > "New OAuth App"
#               Authorization callback URL : http://localhost:8180/realms/event-mgmt/broker/github/endpoint
#
#  TWITTER/X -> https://developer.twitter.com/en/portal/dashboard
#               Creer un projet/app, activer OAuth 2.0
#               Redirect URI : http://localhost:8180/realms/event-mgmt/broker/twitter/endpoint
#
#  LINKEDIN  -> https://www.linkedin.com/developers/apps/new
#               Activer "Sign In with LinkedIn using OpenID Connect"
#               Redirect URI : http://localhost:8180/realms/event-mgmt/broker/linkedin/endpoint
#
#  APPLE     -> https://developer.apple.com/account/resources/identifiers/list/serviceId
#               Creer un Service ID, activer "Sign In with Apple"
#               Redirect URI : http://localhost:8180/realms/event-mgmt/broker/apple/endpoint
#
# ============================================================

# ---- KEYCLOAK ----
$KEYCLOAK_URL    = "http://localhost:8180"
$ADMIN_USER      = "admin"
$ADMIN_PASSWORD  = "admin"
$REALM_NAME      = "event-mgmt"

# ---- GOOGLE ----
$GOOGLE_CLIENT_ID     = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
$GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET"

# ---- MICROSOFT (Outlook / Teams) ----
$MICROSOFT_CLIENT_ID     = ""   # Ex: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
$MICROSOFT_CLIENT_SECRET = ""   # Ex: xxxxxxxxxxxxxxxxxx

# ---- FACEBOOK ----
$FACEBOOK_APP_ID     = ""   # Ex: 1234567890123456
$FACEBOOK_APP_SECRET = ""   # Ex: abc123def456...

# ---- GITHUB ----
$GITHUB_CLIENT_ID     = "YOUR_GITHUB_CLIENT_ID"
$GITHUB_CLIENT_SECRET = "YOUR_GITHUB_CLIENT_SECRET"

# ---- TWITTER / X ----
$TWITTER_CLIENT_ID     = ""   # Ex: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
$TWITTER_CLIENT_SECRET = ""   # Ex: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ---- LINKEDIN ----
$LINKEDIN_CLIENT_ID     = "YOUR_LINKEDIN_CLIENT_ID"
$LINKEDIN_CLIENT_SECRET = "YOUR_LINKEDIN_CLIENT_SECRET"

# ---- APPLE ----
$APPLE_CLIENT_ID     = ""   # Service ID, ex: com.yourcompany.signin
$APPLE_CLIENT_SECRET = ""   # Private key content (.p8)
$APPLE_KEY_ID        = ""   # Ex: XXXXXXXXXX (10 chars)
$APPLE_TEAM_ID       = ""   # Ex: XXXXXXXXXX (10 chars)

# ============================================================

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Configuration Social Identity Providers" -ForegroundColor Cyan
Write-Host "  Realm: $REALM_NAME" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Fonction: Admin Token ----
function Get-AdminToken {
    try {
        $body = @{
            grant_type = "password"
            client_id  = "admin-cli"
            username   = $ADMIN_USER
            password   = $ADMIN_PASSWORD
        }
        $resp = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
            -Method Post -Body $body -ContentType "application/x-www-form-urlencoded" -ErrorAction Stop
        return $resp.access_token
    } catch {
        Write-Host "ERREUR Auth admin: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ---- Fonction: Creer ou MAJ un Identity Provider ----
function Set-IdentityProvider {
    param(
        [string]$Alias,
        [string]$DisplayName,
        [hashtable]$Body,
        [hashtable]$Headers
    )

    # Verifier si existe
    try {
        $existing = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/$Alias" `
            -Method Get -Headers $Headers -ErrorAction Stop
        # Existe -> PUT
        $json = $Body | ConvertTo-Json -Depth 10
        $null = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/$Alias" `
            -Method Put -Headers $Headers -Body $json -ErrorAction Stop
        Write-Host "  MAJ     $DisplayName" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) {
            # N'existe pas -> POST
            $json = $Body | ConvertTo-Json -Depth 10
            $null = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances" `
                -Method Post -Headers $Headers -Body $json -ErrorAction Stop
            Write-Host "  CREE    $DisplayName" -ForegroundColor Green
        } else {
            Write-Host "  ERREUR  $DisplayName - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# ---- Fonction: Ajouter les mappers attributs ----
function Add-IdpMappers {
    param([string]$Alias, [hashtable]$Headers)

    $mappers = @(
        @{
            identityProviderAlias  = $Alias
            identityProviderMapper = "oidc-user-attribute-idp-mapper"
            name                   = "email"
            config                 = @{ claim = "email"; "user.attribute" = "email"; syncMode = "INHERIT" }
        },
        @{
            identityProviderAlias  = $Alias
            identityProviderMapper = "oidc-user-attribute-idp-mapper"
            name                   = "firstName"
            config                 = @{ claim = "given_name"; "user.attribute" = "firstName"; syncMode = "INHERIT" }
        },
        @{
            identityProviderAlias  = $Alias
            identityProviderMapper = "oidc-user-attribute-idp-mapper"
            name                   = "lastName"
            config                 = @{ claim = "family_name"; "user.attribute" = "lastName"; syncMode = "INHERIT" }
        },
        @{
            identityProviderAlias  = $Alias
            identityProviderMapper = "hardcoded-role-idp-mapper"
            name                   = "role-participant"
            config                 = @{ role = "participant"; syncMode = "INHERIT" }
        }
    )

    foreach ($mapper in $mappers) {
        try {
            $json = $mapper | ConvertTo-Json -Depth 5
            $null = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/$Alias/mappers" `
                -Method Post -Headers $Headers -Body $json -ErrorAction SilentlyContinue
        } catch { }
    }
}

# ---- Attendre Keycloak ----
Write-Host "Verification de Keycloak ($KEYCLOAK_URL)..." -ForegroundColor Yellow
$ready = $false
for ($i = 1; $i -le 15; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "$KEYCLOAK_URL/health/ready" -Method Get -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {
        Write-Host "  Tentative $i/15..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}
if (-not $ready) {
    Write-Host "ERREUR - Keycloak inaccessible. Verifiez que docker-compose est lance." -ForegroundColor Red
    exit 1
}
Write-Host "OK - Keycloak accessible" -ForegroundColor Green
Write-Host ""

# ---- Authentification ----
Write-Host "Authentification admin..." -ForegroundColor Yellow
$token = Get-AdminToken
if (-not $token) { exit 1 }
Write-Host "OK - Token obtenu" -ForegroundColor Green
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# ============================================================
#  CONFIGURATION DES PROVIDERS
# ============================================================
Write-Host "Configuration des Identity Providers..." -ForegroundColor Cyan
Write-Host ""

$configured = 0
$skipped    = 0

# ---- GOOGLE ----
if ($GOOGLE_CLIENT_ID -ne "" -and $GOOGLE_CLIENT_SECRET -ne "") {
    $body = @{
        alias       = "google"
        displayName = "Google"
        providerId  = "google"
        enabled     = $true
        trustEmail  = $true
        firstBrokerLoginFlowAlias = "first broker login"
        config = @{
            clientId              = $GOOGLE_CLIENT_ID
            clientSecret          = $GOOGLE_CLIENT_SECRET
            defaultScope          = "openid email profile"
            syncMode              = "IMPORT"
            useJwksUrl            = "true"
            loginHint             = "false"
        }
    }
    Set-IdentityProvider -Alias "google" -DisplayName "Google" -Body $body -Headers $headers
    Add-IdpMappers -Alias "google" -Headers $headers
    $configured++
} else {
    Write-Host "  SKIP    Google (credentials non renseignes)" -ForegroundColor Gray
    $skipped++
}

# ---- MICROSOFT ----
if ($MICROSOFT_CLIENT_ID -ne "" -and $MICROSOFT_CLIENT_SECRET -ne "") {
    $body = @{
        alias       = "microsoft"
        displayName = "Microsoft"
        providerId  = "microsoft"
        enabled     = $true
        trustEmail  = $true
        firstBrokerLoginFlowAlias = "first broker login"
        config = @{
            clientId     = $MICROSOFT_CLIENT_ID
            clientSecret = $MICROSOFT_CLIENT_SECRET
            defaultScope = "openid email profile"
            syncMode     = "IMPORT"
        }
    }
    Set-IdentityProvider -Alias "microsoft" -DisplayName "Microsoft" -Body $body -Headers $headers
    Add-IdpMappers -Alias "microsoft" -Headers $headers
    $configured++
} else {
    Write-Host "  SKIP    Microsoft (credentials non renseignes)" -ForegroundColor Gray
    $skipped++
}

# ---- FACEBOOK ----
if ($FACEBOOK_APP_ID -ne "" -and $FACEBOOK_APP_SECRET -ne "") {
    $body = @{
        alias       = "facebook"
        displayName = "Facebook"
        providerId  = "facebook"
        enabled     = $true
        trustEmail  = $false
        firstBrokerLoginFlowAlias = "first broker login"
        config = @{
            clientId     = $FACEBOOK_APP_ID
            clientSecret = $FACEBOOK_APP_SECRET
            defaultScope = "email,public_profile"
            syncMode     = "IMPORT"
        }
    }
    Set-IdentityProvider -Alias "facebook" -DisplayName "Facebook" -Body $body -Headers $headers
    Add-IdpMappers -Alias "facebook" -Headers $headers
    $configured++
} else {
    Write-Host "  SKIP    Facebook (credentials non renseignes)" -ForegroundColor Gray
    $skipped++
}

# ---- GITHUB ----
if ($GITHUB_CLIENT_ID -ne "" -and $GITHUB_CLIENT_SECRET -ne "") {
    $body = @{
        alias       = "github"
        displayName = "GitHub"
        providerId  = "github"
        enabled     = $true
        trustEmail  = $true
        firstBrokerLoginFlowAlias = "first broker login"
        config = @{
            clientId     = $GITHUB_CLIENT_ID
            clientSecret = $GITHUB_CLIENT_SECRET
            defaultScope = "user:email"
            syncMode     = "IMPORT"
        }
    }
    Set-IdentityProvider -Alias "github" -DisplayName "GitHub" -Body $body -Headers $headers
    Add-IdpMappers -Alias "github" -Headers $headers
    $configured++
} else {
    Write-Host "  SKIP    GitHub (credentials non renseignes)" -ForegroundColor Gray
    $skipped++
}

# ---- TWITTER / X ----
if ($TWITTER_CLIENT_ID -ne "" -and $TWITTER_CLIENT_SECRET -ne "") {
    $body = @{
        alias       = "twitter"
        displayName = "X (Twitter)"
        providerId  = "twitter"
        enabled     = $true
        trustEmail  = $false
        firstBrokerLoginFlowAlias = "first broker login"
        config = @{
            clientId     = $TWITTER_CLIENT_ID
            clientSecret = $TWITTER_CLIENT_SECRET
            syncMode     = "IMPORT"
        }
    }
    Set-IdentityProvider -Alias "twitter" -DisplayName "X (Twitter)" -Body $body -Headers $headers
    $configured++
} else {
    Write-Host "  SKIP    X (Twitter) (credentials non renseignes)" -ForegroundColor Gray
    $skipped++
}

# ---- LINKEDIN (via OIDC) ----
if ($LINKEDIN_CLIENT_ID -ne "" -and $LINKEDIN_CLIENT_SECRET -ne "") {
    $body = @{
        alias       = "linkedin"
        displayName = "LinkedIn"
        providerId  = "oidc"
        enabled     = $true
        trustEmail  = $true
        firstBrokerLoginFlowAlias = "first broker login"
        config = @{
            clientId             = $LINKEDIN_CLIENT_ID
            clientSecret         = $LINKEDIN_CLIENT_SECRET
            authorizationUrl     = "https://www.linkedin.com/oauth/v2/authorization"
            tokenUrl             = "https://www.linkedin.com/oauth/v2/accessToken"
            userInfoUrl          = "https://api.linkedin.com/v2/userinfo"
            defaultScope         = "openid email profile"
            syncMode             = "IMPORT"
            useJwksUrl           = "false"
            validateSignature    = "false"
            pkceEnabled          = "false"
        }
    }
    Set-IdentityProvider -Alias "linkedin" -DisplayName "LinkedIn" -Body $body -Headers $headers
    Add-IdpMappers -Alias "linkedin" -Headers $headers
    $configured++
} else {
    Write-Host "  SKIP    LinkedIn (credentials non renseignes)" -ForegroundColor Gray
    $skipped++
}

# ---- APPLE ----
if ($APPLE_CLIENT_ID -ne "" -and $APPLE_CLIENT_SECRET -ne "" -and $APPLE_KEY_ID -ne "" -and $APPLE_TEAM_ID -ne "") {
    $body = @{
        alias       = "apple"
        displayName = "Apple"
        providerId  = "apple"
        enabled     = $true
        trustEmail  = $true
        firstBrokerLoginFlowAlias = "first broker login"
        config = @{
            clientId     = $APPLE_CLIENT_ID
            clientSecret = $APPLE_CLIENT_SECRET
            keyId        = $APPLE_KEY_ID
            teamId       = $APPLE_TEAM_ID
            defaultScope = "email name"
            syncMode     = "IMPORT"
        }
    }
    Set-IdentityProvider -Alias "apple" -DisplayName "Apple" -Body $body -Headers $headers
    Add-IdpMappers -Alias "apple" -Headers $headers
    $configured++
} else {
    Write-Host "  SKIP    Apple (credentials non renseignes)" -ForegroundColor Gray
    $skipped++
}

Write-Host ""

# ============================================================
#  MISE A JOUR DU CLIENT backoffice-client
#  -> Ajouter les URIs de redirect pour le Social Login
# ============================================================
Write-Host "Mise a jour du client 'backoffice-client'..." -ForegroundColor Cyan

# Renouveler le token (il peut avoir expire pendant la configuration des IdPs)
$token = Get-AdminToken
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

try {
    $clients = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=backoffice-client" `
        -Method Get -Headers $headers -ErrorAction Stop

    if ($clients.Count -gt 0) {
        $client    = $clients[0]
        $clientUid = $client.id

        # Recuperer le JSON brut du client (pour eviter les problemes de serialisation PSCustomObject)
        $rawClient = (Invoke-WebRequest -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$clientUid" `
            -Method Get -Headers $headers -UseBasicParsing).Content

        # Modifier les URIs directement dans le JSON brut
        $rawClient = $rawClient -replace '"redirectUris":\[.*?\]', `
            '"redirectUris":["http://localhost:4200/*","http://localhost:4200/","*"]'
        $rawClient = $rawClient -replace '"webOrigins":\[.*?\]', `
            '"webOrigins":["http://localhost:4200","+"]'

        # Utiliser HttpWebRequest avec encodage UTF-8 explicite
        $updateBytes = [System.Text.Encoding]::UTF8.GetBytes($rawClient)
        $wr = [System.Net.HttpWebRequest]::Create("$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$clientUid")
        $wr.Method = "PUT"
        $wr.ContentType = "application/json"
        $wr.Headers.Add("Authorization", "Bearer $token")
        $wr.ContentLength = $updateBytes.Length
        $reqStream = $wr.GetRequestStream()
        $reqStream.Write($updateBytes, 0, $updateBytes.Length)
        $reqStream.Close()
        try {
            $null = $wr.GetResponse()
            Write-Host "  OK - backoffice-client mis a jour (redirectUris, webOrigins)" -ForegroundColor Green
        } catch [System.Net.WebException] {
            $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "  ERREUR detail: $($sr.ReadToEnd())" -ForegroundColor Red
        }
    } else {
        Write-Host "  AVERTISSEMENT - backoffice-client introuvable. Lancez .\setup-backoffice-client.ps1" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ERREUR - $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================
#  CONFIGURATION DU REALM : activer Registration
# ============================================================
Write-Host ""
Write-Host "Activation de l'inscription dans le realm..." -ForegroundColor Cyan

try {
    $realmBody = @{
        realm                      = $REALM_NAME
        enabled                    = $true
        registrationAllowed        = $true
        registrationEmailAsUsername = $true
        rememberMe                 = $true
        verifyEmail                = $false
        resetPasswordAllowed       = $true
        loginWithEmailAllowed      = $true
        duplicateEmailsAllowed     = $false
        sslRequired                = "none"
    } | ConvertTo-Json

    $null = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME" `
        -Method Put -Headers $headers -Body $realmBody -ErrorAction Stop
    Write-Host "  OK - Inscription activee dans le realm" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR - $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================
#  RESUME
# ============================================================
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  RESUME" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Providers configures : $configured" -ForegroundColor Green
Write-Host "  Providers sautes     : $skipped (credentials manquants)" -ForegroundColor Yellow
Write-Host ""

if ($skipped -gt 0) {
    Write-Host "  Pour configurer les providers sautes :" -ForegroundColor Yellow
    Write-Host "  1. Editez ce fichier : setup-social-providers.ps1" -ForegroundColor White
    Write-Host "  2. Remplissez les variables en haut du fichier" -ForegroundColor White
    Write-Host "  3. Relancez : .\setup-social-providers.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host "  Console Keycloak : $KEYCLOAK_URL/admin" -ForegroundColor Cyan
Write-Host "  Realm            : $KEYCLOAK_URL/admin/master/console/#/$REALM_NAME/identity-provider" -ForegroundColor Cyan
Write-Host ""

if ($configured -gt 0) {
    Write-Host "  L'application Angular est prete sur : http://localhost:4200/#/register" -ForegroundColor Green
}
Write-Host ""
