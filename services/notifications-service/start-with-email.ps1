#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Démarre le notifications-service avec les variables SMTP configurées.

.DESCRIPTION
    Ce script lit les variables depuis le fichier .env (s'il existe) ou depuis les
    paramètres passés en ligne de commande, puis lance le service Quarkus en mode dev.

.PARAMETER EmailHost
    Serveur SMTP (ex: smtp.gmail.com). Défaut : smtp.gmail.com

.PARAMETER EmailPort
    Port SMTP (ex: 587). Défaut : 587

.PARAMETER EmailUsername
    Nom d'utilisateur SMTP (votre adresse email Gmail ou identifiant Mailtrap).

.PARAMETER EmailPassword
    Mot de passe SMTP (mot de passe d'application Gmail ou mot de passe Mailtrap).

.PARAMETER EmailFrom
    Adresse expéditeur. Défaut : noreply@eventmanagement.com

.EXAMPLE
    # Avec Gmail
    .\start-with-email.ps1 -EmailUsername "mon@gmail.com" -EmailPassword "xxxx-xxxx-xxxx-xxxx"

.EXAMPLE
    # Avec Mailtrap (test)
    .\start-with-email.ps1 -EmailHost "smtp.mailtrap.io" -EmailPort 2525 `
        -EmailUsername "abc123" -EmailPassword "def456"
#>

param(
    [string]$EmailHost     = $env:EMAIL_HOST     ?? "smtp.gmail.com",
    [int]   $EmailPort     = $env:EMAIL_PORT      ?? 587,
    [string]$EmailUsername = $env:EMAIL_USERNAME  ?? "",
    [string]$EmailPassword = $env:EMAIL_PASSWORD  ?? "",
    [string]$EmailFrom     = $env:EMAIL_FROM      ?? "noreply@eventmanagement.com"
)

# ---------------------------------------------------------------
# Charger .env si présent
# ---------------------------------------------------------------
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "📄 Chargement des variables depuis .env..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key   = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            if (-not [System.Environment]::GetEnvironmentVariable($key)) {
                [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    # Re-lire les variables EMAIL depuis l'environnement
    if (-not $EmailUsername -and $env:EMAIL_USERNAME) { $EmailUsername = $env:EMAIL_USERNAME }
    if (-not $EmailPassword -and $env:EMAIL_PASSWORD) { $EmailPassword = $env:EMAIL_PASSWORD }
    if ($env:EMAIL_HOST)  { $EmailHost  = $env:EMAIL_HOST  }
    if ($env:EMAIL_PORT)  { $EmailPort  = [int]$env:EMAIL_PORT  }
    if ($env:EMAIL_FROM)  { $EmailFrom  = $env:EMAIL_FROM  }
}

# ---------------------------------------------------------------
# Validation minimale
# ---------------------------------------------------------------
if (-not $EmailUsername -or -not $EmailPassword) {
    Write-Warning "EMAIL_USERNAME et EMAIL_PASSWORD sont obligatoires."
    Write-Host ""
    Write-Host "  Option 1 : Copiez .env.example → .env et renseignez vos credentials."
    Write-Host "  Option 2 : Passez les paramètres directement :"
    Write-Host "    .\start-with-email.ps1 -EmailUsername 'mon@gmail.com' -EmailPassword 'mot-de-passe'"
    Write-Host ""
    Write-Host "  Pour tester SANS envoyer d'vrais emails (mode mock), lancez :"
    Write-Host "    mvn quarkus:dev  (sans EMAIL_USERNAME / EMAIL_PASSWORD)"
    exit 1
}

# ---------------------------------------------------------------
# Affichage de la config (sans le mot de passe)
# ---------------------------------------------------------------
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Notifications Service - Démarrage" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "  SMTP Host     : $EmailHost"
Write-Host "  SMTP Port     : $EmailPort"
Write-Host "  SMTP Username : $EmailUsername"
Write-Host "  SMTP Password : $('*' * [Math]::Min($EmailPassword.Length, 8))"
Write-Host "  From          : $EmailFrom"
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# ---------------------------------------------------------------
# Définir les variables d'environnement pour le processus Maven
# ---------------------------------------------------------------
$env:EMAIL_HOST     = $EmailHost
$env:EMAIL_PORT     = $EmailPort
$env:EMAIL_USERNAME = $EmailUsername
$env:EMAIL_PASSWORD = $EmailPassword
$env:EMAIL_FROM     = $EmailFrom

# ---------------------------------------------------------------
# Lancer Quarkus en mode dev
# ---------------------------------------------------------------
Set-Location $PSScriptRoot
Write-Host "▶  Démarrage de Quarkus (port 8084)..." -ForegroundColor Yellow
mvn quarkus:dev
