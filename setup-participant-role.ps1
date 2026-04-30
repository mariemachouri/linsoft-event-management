# ============================================================
#  setup-participant-role.ps1
#  Cree le role "participant" dans Keycloak et le definit
#  comme role par defaut du realm event-mgmt.
#  Tout nouvel utilisateur (inscription email OU social) recoit
#  automatiquement ce role.
# ============================================================

$KEYCLOAK_URL = "http://localhost:8180"
$REALM_NAME   = "event-mgmt"
$ROLE_NAME    = "participant"

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

# ---- Authentification ----
Write-Host "Authentification admin..." -ForegroundColor Yellow
$tokenResp = Invoke-RestMethod `
    -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
    -Method Post `
    -Body @{ grant_type="password"; client_id="admin-cli"; username="admin"; password="admin" } `
    -ContentType "application/x-www-form-urlencoded"
$token = $tokenResp.access_token
if (-not $token) {
    Write-Host "ERREUR - Authentification echouee" -ForegroundColor Red
    exit 1
}
Write-Host "OK - Token obtenu" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# ============================================================
# ETAPE 1 : Creer le role "participant" s'il n'existe pas
# ============================================================
Write-Host ""
Write-Host "Etape 1 - Role '$ROLE_NAME'..." -ForegroundColor Cyan

$existingRoles = Invoke-RestMethod `
    -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" `
    -Method Get -Headers $headers

$roleExists = $existingRoles | Where-Object { $_.name -eq $ROLE_NAME }

if ($roleExists) {
    Write-Host "  OK - Role '$ROLE_NAME' existe deja (id: $($roleExists.id))" -ForegroundColor Green
    $roleId = $roleExists.id
} else {
    $roleBody = @{ name = $ROLE_NAME; description = "Utilisateur participant aux evenements" } | ConvertTo-Json
    try {
        Invoke-RestMethod `
            -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" `
            -Method Post -Headers $headers -Body $roleBody | Out-Null
        Write-Host "  CREE - Role '$ROLE_NAME' cree avec succes" -ForegroundColor Green
    } catch {
        Write-Host "  ERREUR - Creation du role: $_" -ForegroundColor Red
        exit 1
    }
    # Recuperer l'ID du role nouvellement cree
    $allRoles = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" -Method Get -Headers $headers
    $roleId = ($allRoles | Where-Object { $_.name -eq $ROLE_NAME }).id
}

# ============================================================
# ETAPE 2 : Ajouter "participant" aux roles par defaut du realm
#  Le role composite "default-roles-{realm}" est le mecanisme
#  Keycloak pour les roles attribues automatiquement a chaque
#  nouvel utilisateur.
# ============================================================
Write-Host ""
Write-Host "Etape 2 - Role par defaut du realm..." -ForegroundColor Cyan

$defaultCompositeRoleName = "default-roles-$REALM_NAME"

# Recuperer le role composite "default-roles-event-mgmt"
$defaultCompositeRole = Invoke-RestMethod `
    -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/$defaultCompositeRoleName" `
    -Method Get -Headers $headers

# Verifier si "participant" est deja un composant
$composites = Invoke-RestMethod `
    -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/$defaultCompositeRoleName/composites" `
    -Method Get -Headers $headers

$alreadyDefault = $composites | Where-Object { $_.name -eq $ROLE_NAME }

if ($alreadyDefault) {
    Write-Host "  OK - '$ROLE_NAME' est deja un role par defaut du realm" -ForegroundColor Green
} else {
    # Ajouter "participant" comme composant de "default-roles-event-mgmt"
    # Forcer le tableau JSON même avec un seul élément
    $rolePayload = "[{`"id`":`"$roleId`",`"name`":`"$ROLE_NAME`",`"composite`":false,`"clientRole`":false,`"containerId`":`"$REALM_NAME`"}]"
    try {
        Invoke-RestMethod `
            -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/$defaultCompositeRoleName/composites" `
            -Method Post -Headers $headers -Body $rolePayload | Out-Null
        Write-Host "  CONFIGURE - '$ROLE_NAME' ajoute aux roles par defaut du realm" -ForegroundColor Green
    } catch {
        Write-Host "  ERREUR - Ajout aux roles par defaut: $_" -ForegroundColor Red
        exit 1
    }
}

# ============================================================
# ETAPE 3 : Mettre a jour les mappers IdP (google, github, linkedin)
#  pour assigner "participant" au lieu de "user"
# ============================================================
Write-Host ""
Write-Host "Etape 3 - Mise a jour des mappers IdP..." -ForegroundColor Cyan

$providers = @("google", "github", "linkedin")

foreach ($provider in $providers) {
    # Verifier si le provider existe
    try {
        $null = Invoke-RestMethod `
            -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/$provider" `
            -Method Get -Headers $headers -ErrorAction Stop
    } catch {
        Write-Host "  SKIP - Provider '$provider' non configure" -ForegroundColor Gray
        continue
    }

    # Recuperer les mappers existants
    $existingMappers = Invoke-RestMethod `
        -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/$provider/mappers" `
        -Method Get -Headers $headers

    # Chercher le mapper de role
    $roleMapper = $existingMappers | Where-Object { $_.identityProviderMapper -eq "hardcoded-role-idp-mapper" }

    if ($roleMapper) {
        # Mettre a jour le mapper existant
        $roleMapper.config.role = $ROLE_NAME
        $mapperJson = $roleMapper | ConvertTo-Json -Depth 5
        try {
            Invoke-RestMethod `
                -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/$provider/mappers/$($roleMapper.id)" `
                -Method Put -Headers $headers -Body $mapperJson | Out-Null
            Write-Host "  MISE A JOUR - Mapper '$provider' -> role '$ROLE_NAME'" -ForegroundColor Green
        } catch {
            Write-Host "  ERREUR - Mise a jour mapper '$provider': $_" -ForegroundColor Red
        }
    } else {
        # Creer le mapper de role
        $newMapper = @{
            identityProviderAlias  = $provider
            identityProviderMapper = "hardcoded-role-idp-mapper"
            name                   = "role-participant"
            config                 = @{ role = $ROLE_NAME; syncMode = "INHERIT" }
        } | ConvertTo-Json -Depth 5
        try {
            Invoke-RestMethod `
                -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/$provider/mappers" `
                -Method Post -Headers $headers -Body $newMapper | Out-Null
            Write-Host "  CREE - Mapper '$provider' -> role '$ROLE_NAME'" -ForegroundColor Green
        } catch {
            Write-Host "  ERREUR - Creation mapper '$provider': $_" -ForegroundColor Red
        }
    }
}

# ============================================================
# RESUME
# ============================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " CONFIGURATION TERMINEE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Role '$ROLE_NAME' cree dans le realm '$REALM_NAME'" -ForegroundColor White
Write-Host " Role '$ROLE_NAME' defini comme role par defaut du realm" -ForegroundColor White
Write-Host " => Tout nouvel utilisateur (email OU social) recevra" -ForegroundColor White
Write-Host "    automatiquement le role '$ROLE_NAME' a l'inscription" -ForegroundColor White
Write-Host ""
