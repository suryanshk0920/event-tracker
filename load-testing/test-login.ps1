# Test Login API

Write-Host "Testing Login API..." -ForegroundColor Yellow

$loginBody = @"
{
    "email": "debug1759578735.81974_4298@example.com",
    "password": "password123"
}
"@

Write-Host "Sending login request..." -ForegroundColor Cyan
Write-Host $loginBody -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "`n✅ LOGIN SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor Green
}
catch {
    Write-Host "`n❌ LOGIN FAILED! Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error details: $responseBody" -ForegroundColor Yellow
    }
    catch {
        Write-Host "Could not read error details" -ForegroundColor Red
    }
}