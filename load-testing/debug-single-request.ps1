# Debug Script - Test Single Registration Request
# This will help us identify the exact error causing 500 responses

Write-Host "🔍 Testing Single Registration Request..." -ForegroundColor Yellow

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$randomId = Get-Random -Minimum 1000 -Maximum 9999

$body = @{
    name = "Debug User $randomId"
    email = "debug$($timestamp)_$($randomId)@example.com"
    password = "password123"
    department = "Computer Science"
    role = "STUDENT"
    roll_no = "CS$($timestamp)$($randomId)"
    division = "A"
} | ConvertTo-Json

Write-Host "📤 Sending request with data:" -ForegroundColor Cyan
Write-Host $body -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
    
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}