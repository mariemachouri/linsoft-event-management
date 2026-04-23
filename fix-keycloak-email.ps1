$token = (Invoke-RestMethod "http://localhost:8180/realms/master/protocol/openid-connect/token" -Method POST -Body "grant_type=password&client_id=admin-cli&username=admin&password=admin" -ContentType "application/x-www-form-urlencoded").access_token
$headers = @{ Authorization = "Bearer $token" }

# Lister tous les utilisateurs
$users = Invoke-RestMethod "http://localhost:8180/admin/realms/event-mgmt/users?max=50" -Headers $headers
Write-Host "=== Tous les utilisateurs ==="
$users | ForEach-Object { Write-Host "  $($_.username) | $($_.email) | $($_.id)" }

# Trouver le doublon achoury.mayem@gmail.com
$dup = $users | Where-Object { $_.email -eq "achoury.mayem@gmail.com" }
if ($dup) {
    Write-Host "`n=== Doublon trouvé: $($dup.username) | $($dup.id) ==="
    if ($dup.username -ne "organizer.test") {
        Write-Host "Suppression de $($dup.username)..."
        Invoke-RestMethod "http://localhost:8180/admin/realms/event-mgmt/users/$($dup.id)" -Method DELETE -Headers $headers
        Write-Host "Supprimé!"
        
        $orgUser = $users | Where-Object { $_.username -eq "organizer.test" }
        $orgUser.email = "achoury.mayem@gmail.com"
        $orgUser.emailVerified = $true
        $json = $orgUser | ConvertTo-Json -Depth 20
        Invoke-RestMethod "http://localhost:8180/admin/realms/event-mgmt/users/$($orgUser.id)" -Method PUT -Body $json -ContentType "application/json" -Headers $headers
        Write-Host "Email de organizer.test mis à jour!"
    }
} else {
    Write-Host "Pas de doublon - mise à jour directe..."
    $orgUser = $users | Where-Object { $_.username -eq "organizer.test" }
    $orgUser.email = "achoury.mayem@gmail.com"
    $orgUser.emailVerified = $true
    $json = $orgUser | ConvertTo-Json -Depth 20
    Invoke-RestMethod "http://localhost:8180/admin/realms/event-mgmt/users/$($orgUser.id)" -Method PUT -Body $json -ContentType "application/json" -Headers $headers
    Write-Host "Email mis à jour!"
}
