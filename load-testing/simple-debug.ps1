# Simple Debug Test for Registration API

Write-Host "Testing Registration API..." -ForegroundColor Yellow

# Generate unique values
$timestamp = Get-Date -UFormat %s
$randomId = Get-Random -Minimum 1000 -Maximum 9999
$uniqueEmail = "debug" + $timestamp + "_" + $randomId + "@example.com"
$uniqueRollNo = "CS" + $timestamp + $randomId

Write-Host "Email: $uniqueEmail" -ForegroundColor Cyan
Write-Host "Roll No: $uniqueRollNo" -ForegroundColor Cyan

$jsonBody = @"
{
    "name": "Debug User $randomId",
    "email": "$uniqueEmail",
    "password": "password123",
    "department": "Computer Science",
    "role": "STUDENT",
    "roll_no": "$uniqueRollNo",
    "division": "A"
}
"@

Write-Host "`nSending request..." -ForegroundColor Yellow
Write-Host $jsonBody -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $jsonBody -ContentType "application/json"
    Write-Host "`n✅ SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor Green
}
catch {
    Write-Host "`n❌ FAILED! Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    
    # Try to get the response body
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