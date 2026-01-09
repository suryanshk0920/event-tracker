# Simple Load Test Runner - Compatible with all PowerShell versions

param(
    [string]$Target = "http://localhost:5000",
    [int]$Duration = 300
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Event Tracker MVP - Load Test Runner     " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Function to check if backend is running
function Test-Backend {
    param($url)
    try {
        $response = Invoke-WebRequest -Uri "$url/health" -UseBasicParsing -TimeoutSec 5
        return ($response.StatusCode -eq 200)
    } catch {
        return $false
    }
}

Write-Host "`nChecking Prerequisites..." -ForegroundColor Yellow

# Check Artillery
try {
    $null = & artillery --version 2>&1
    Write-Host "[OK] Artillery is installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Artillery not found. Install with: npm install -g artillery" -ForegroundColor Red
    exit 1
}

# Check backend
if (-not (Test-Backend $Target)) {
    Write-Host "[ERROR] Backend is not running at $Target" -ForegroundColor Red
    Write-Host "Please start the backend first:" -ForegroundColor Yellow
    Write-Host "  1. Open new terminal" -ForegroundColor White
    Write-Host "  2. cd backend" -ForegroundColor White
    Write-Host "  3. start-load-test.bat" -ForegroundColor White
    exit 1
}

Write-Host "[OK] Backend is running" -ForegroundColor Green

# Create report directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportDir = "reports"
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir | Out-Null
}

Write-Host "`nStarting Load Test..." -ForegroundColor Green
Write-Host "Target: $Target" -ForegroundColor Cyan
Write-Host "Reports: $reportDir" -ForegroundColor Cyan

# Set load testing environment
$env:ENABLE_LOAD_TESTING = "true"
Write-Host "[INFO] Load testing mode enabled - rate limits relaxed" -ForegroundColor Yellow

# Run test
$reportFile = "$reportDir/load-test-report-$timestamp"

try {
    Write-Host "`nRunning Artillery..." -ForegroundColor Magenta
    & artillery run "artillery-config.yml" --target $Target --output "$reportFile.json"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[SUCCESS] Load test completed!" -ForegroundColor Green
        
        # Generate HTML report
        Write-Host "Generating HTML report..." -ForegroundColor Yellow
        & artillery report "$reportFile.json" --output "$reportFile.html"
        
        # Summary
        Write-Host "`nReports Generated:" -ForegroundColor Cyan
        Write-Host "JSON: $reportFile.json" -ForegroundColor White
        Write-Host "HTML: $reportFile.html" -ForegroundColor White
        
        # Ask to open
        $open = Read-Host "`nOpen HTML report in browser? (y/N)"
        if ($open -eq 'y' -or $open -eq 'Y') {
            Start-Process "$reportFile.html"
        }
        
    } else {
        Write-Host "`n[ERROR] Load test failed!" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "`n[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    Remove-Item Env:ENABLE_LOAD_TESTING -ErrorAction SilentlyContinue
}

Write-Host "`nDone!" -ForegroundColor Green