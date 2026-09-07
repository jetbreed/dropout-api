# test_api.ps1
Write-Host "Testing API..." -ForegroundColor Green

# 1. Health check
Write-Host "`n[1] Health Check:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -ErrorAction Stop
    Write-Host "✅ $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# 2. Register user
Write-Host "`n[2] Register User:" -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser"
        email = "testuser@example.com"
        password = "test12345"
        role = "school"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/auth/register" -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ User registered: $($response.username)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# 3. Login
Write-Host "`n[3] Login:" -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser"
        password = "test12345"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/auth/login" -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   Token: $($response.access_token.Substring(0, 30))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

Write-Host "`nDone!" -ForegroundColor Green