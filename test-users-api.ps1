# 🧪 Tests API - Authentification & Utilisateurs

Write-Host "🚀 Tests API - Event Management - Users Service" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:8083"
$TOKEN = ""

# Function to make HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Body = "",
        [bool]$UseAuth = $false
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($UseAuth -and $TOKEN) {
        $headers["Authorization"] = "Bearer $TOKEN"
    }
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method $Method -Headers $headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method $Method -Headers $headers
        }
        return $response
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response: $responseBody" -ForegroundColor Yellow
        }
        return $null
    }
}

# Test 1: Login
Write-Host "📝 Test 1: Login" -ForegroundColor Yellow
Write-Host "   POST /api/auth/login" -ForegroundColor Gray

$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/auth/login" -Body $loginBody

if ($loginResponse) {
    $TOKEN = $loginResponse.access_token
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
    Write-Host "   Token Type: $($loginResponse.token_type)" -ForegroundColor Gray
    Write-Host "   Expires In: $($loginResponse.expires_in) seconds" -ForegroundColor Gray
    Write-Host "   Token (first 50 chars): $($TOKEN.Substring(0, [Math]::Min(50, $TOKEN.Length)))..." -ForegroundColor Gray
} else {
    Write-Host "   ❌ Login failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Make sure:" -ForegroundColor Yellow
    Write-Host "   1. Keycloak is running (docker-compose up -d keycloak)" -ForegroundColor White
    Write-Host "   2. Realm 'event-mgmt' is created" -ForegroundColor White
    Write-Host "   3. Admin user exists with password 'admin123'" -ForegroundColor White
    Write-Host "   4. Users service is running" -ForegroundColor White
    exit 1
}
Write-Host ""

# Test 2: Get All Users
Write-Host "📝 Test 2: Get All Users" -ForegroundColor Yellow
Write-Host "   GET /api/users" -ForegroundColor Gray

$users = Invoke-ApiRequest -Method "GET" -Endpoint "/api/users" -UseAuth $true

if ($users) {
    Write-Host "   ✅ Retrieved $($users.Count) user(s)" -ForegroundColor Green
    if ($users.Count -gt 0) {
        Write-Host "   First user: $($users[0].username) ($($users[0].email))" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ Failed to retrieve users" -ForegroundColor Red
}
Write-Host ""

# Test 3: Create User
Write-Host "📝 Test 3: Create User" -ForegroundColor Yellow
Write-Host "   POST /api/users" -ForegroundColor Gray

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$newUserBody = @{
    username = "testuser_$timestamp"
    email = "testuser_$timestamp@example.com"
    firstName = "Test"
    lastName = "User"
    password = "TestPassword123!"
    phoneNumber = "+1234567890"
    roles = @("user")
    enabled = $true
} | ConvertTo-Json

$createdUser = Invoke-ApiRequest -Method "POST" -Endpoint "/api/users" -Body $newUserBody -UseAuth $true

if ($createdUser) {
    Write-Host "   ✅ User created successfully!" -ForegroundColor Green
    Write-Host "   User ID: $($createdUser.id)" -ForegroundColor Gray
    Write-Host "   Username: $($createdUser.username)" -ForegroundColor Gray
    Write-Host "   Email: $($createdUser.email)" -ForegroundColor Gray
    $userId = $createdUser.id
} else {
    Write-Host "   ❌ Failed to create user" -ForegroundColor Red
    $userId = $null
}
Write-Host ""

# Test 4: Get User by ID
if ($userId) {
    Write-Host "📝 Test 4: Get User by ID" -ForegroundColor Yellow
    Write-Host "   GET /api/users/$userId" -ForegroundColor Gray
    
    $user = Invoke-ApiRequest -Method "GET" -Endpoint "/api/users/$userId" -UseAuth $true
    
    if ($user) {
        Write-Host "   ✅ User retrieved successfully!" -ForegroundColor Green
        Write-Host "   Username: $($user.username)" -ForegroundColor Gray
        Write-Host "   Email: $($user.email)" -ForegroundColor Gray
        Write-Host "   Roles: $($user.roles -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Failed to retrieve user" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 5: Update User
if ($userId) {
    Write-Host "📝 Test 5: Update User" -ForegroundColor Yellow
    Write-Host "   PUT /api/users/$userId" -ForegroundColor Gray
    
    $updateBody = @{
        email = "updated_$timestamp@example.com"
        phoneNumber = "+9876543210"
    } | ConvertTo-Json
    
    $updatedUser = Invoke-ApiRequest -Method "PUT" -Endpoint "/api/users/$userId" -Body $updateBody -UseAuth $true
    
    if ($updatedUser) {
        Write-Host "   ✅ User updated successfully!" -ForegroundColor Green
        Write-Host "   New Email: $($updatedUser.email)" -ForegroundColor Gray
        Write-Host "   New Phone: $($updatedUser.phoneNumber)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Failed to update user" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 6: Create Role
Write-Host "📝 Test 6: Create Role" -ForegroundColor Yellow
Write-Host "   POST /api/roles" -ForegroundColor Gray

$roleBody = @{
    name = "event-organizer"
    description = "Can create and manage events"
} | ConvertTo-Json

$createRoleResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/roles" -Body $roleBody -UseAuth $true

if ($createRoleResponse -ne $null) {
    Write-Host "   ✅ Role created successfully!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Role might already exist" -ForegroundColor Yellow
}
Write-Host ""

# Test 7: Get All Roles
Write-Host "📝 Test 7: Get All Roles" -ForegroundColor Yellow
Write-Host "   GET /api/roles" -ForegroundColor Gray

$roles = Invoke-ApiRequest -Method "GET" -Endpoint "/api/roles" -UseAuth $true

if ($roles) {
    Write-Host "   ✅ Retrieved $($roles.Count) role(s)" -ForegroundColor Green
    foreach ($role in $roles) {
        Write-Host "   - $($role.name)" -ForegroundColor Gray
        if ($role.description) {
            Write-Host "     $($role.description)" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "   ❌ Failed to retrieve roles" -ForegroundColor Red
}
Write-Host ""

# Test 8: Assign Role to User
if ($userId) {
    Write-Host "📝 Test 8: Assign Role to User" -ForegroundColor Yellow
    Write-Host "   POST /api/users/$userId/roles" -ForegroundColor Gray
    
    $assignRolesBody = @("event-organizer") | ConvertTo-Json
    
    $assignResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/users/$userId/roles" -Body $assignRolesBody -UseAuth $true
    
    if ($assignResponse -ne $null) {
        Write-Host "   ✅ Role assigned successfully!" -ForegroundColor Green
        
        # Verify by getting the user
        $updatedUser = Invoke-ApiRequest -Method "GET" -Endpoint "/api/users/$userId" -UseAuth $true
        if ($updatedUser) {
            Write-Host "   Current roles: $($updatedUser.roles -join ', ')" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ Failed to assign role" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 9: Delete User
if ($userId) {
    Write-Host "📝 Test 9: Delete User" -ForegroundColor Yellow
    Write-Host "   DELETE /api/users/$userId" -ForegroundColor Gray
    
    $deleteResponse = Invoke-ApiRequest -Method "DELETE" -Endpoint "/api/users/$userId" -UseAuth $true
    
    if ($deleteResponse -ne $null) {
        Write-Host "   ✅ User deleted successfully!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to delete user" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 10: Refresh Token
Write-Host "📝 Test 10: Refresh Token" -ForegroundColor Yellow
Write-Host "   POST /api/auth/refresh" -ForegroundColor Gray

if ($loginResponse -and $loginResponse.refresh_token) {
    $refreshBody = @{
        refreshToken = $loginResponse.refresh_token
    } | ConvertTo-Json
    
    $refreshResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/auth/refresh" -Body $refreshBody
    
    if ($refreshResponse) {
        Write-Host "   ✅ Token refreshed successfully!" -ForegroundColor Green
        Write-Host "   New Token (first 50 chars): $($refreshResponse.access_token.Substring(0, 50))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Failed to refresh token" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  No refresh token available" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Additional Resources:" -ForegroundColor Cyan
Write-Host "   - API Documentation: http://localhost:8083/q/swagger-ui" -ForegroundColor White
Write-Host "   - Keycloak Console: http://localhost:8180" -ForegroundColor White
Write-Host "   - Full Guide: KEYCLOAK-AUTHENTICATION-GUIDE.md" -ForegroundColor White
Write-Host ""
