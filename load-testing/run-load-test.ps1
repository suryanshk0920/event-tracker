# Event Tracker MVP Load Testing Script
# This script sets up and runs comprehensive load testing with Redis monitoring

param(
    [string]$Target = "http://localhost:5000",
    [int]$Duration = 300,
    [string]$ReportDir = "./reports"
)

Write-Host "Event Tracker MVP Load Testing Suite" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check if Artillery is installed
try {
    $artilleryVersion = artillery --version 2>$null
    Write-Host "[OK] Artillery.js is installed: $artilleryVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Artillery.js is not installed. Installing..." -ForegroundColor Red
    npm install -g artillery
}

# Check if backend is running
Write-Host "Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$Target/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Backend is running on $Target" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Backend is not accessible at $Target" -ForegroundColor Red
    Write-Host "Please start your backend server first!" -ForegroundColor Red
    exit 1
}

# Check if Redis is running
Write-Host "Checking Redis connection..." -ForegroundColor Yellow
try {
    redis-cli ping | Out-Null
    Write-Host "[OK] Redis is running and accessible" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Redis might not be running. Load test will continue, but caching won't be tested." -ForegroundColor Yellow
}

# Create reports directory
if (-not (Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
    Write-Host "[OK] Created reports directory: $ReportDir" -ForegroundColor Green
}

# Generate timestamp for this test run
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = "$ReportDir/load-test-report-$timestamp.json"
$htmlReport = "$ReportDir/load-test-report-$timestamp.html"

Write-Host ""
Write-Host "Starting Load Test Configuration:" -ForegroundColor Cyan
Write-Host "  Target: $Target" -ForegroundColor White
Write-Host "  Duration: $Duration seconds" -ForegroundColor White
Write-Host "  Report: $reportFile" -ForegroundColor White
Write-Host ""

# Update artillery config with current target
$configContent = Get-Content "artillery-config.yml" -Raw
$configContent = $configContent -replace "target: 'http://localhost:5000'", "target: '$Target'"
$configContent | Set-Content "artillery-config-temp.yml"

Write-Host "Phase 1: Pre-test Redis Cache Performance Test" -ForegroundColor Magenta
Write-Host "==============================================" -ForegroundColor Magenta
node redis-monitor.js test

Write-Host ""
Write-Host "Phase 2: Starting Redis Monitoring" -ForegroundColor Magenta
Write-Host "==================================" -ForegroundColor Magenta

# Start Redis monitoring in background
$monitorJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node redis-monitor.js monitor
}

Write-Host "[OK] Redis monitoring started (Job ID: $($monitorJob.Id))" -ForegroundColor Green

# Wait a moment for monitoring to start
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Phase 3: Running Artillery Load Test" -ForegroundColor Magenta
Write-Host "===================================" -ForegroundColor Magenta

# Run the main load test
$loadTestStart = Get-Date
try {
    artillery run artillery-config-temp.yml --output $reportFile
    $loadTestEnd = Get-Date
    $testDuration = ($loadTestEnd - $loadTestStart).TotalSeconds
    
    Write-Host "[OK] Load test completed in $([math]::Round($testDuration, 2)) seconds" -ForegroundColor Green
    
    # Generate HTML report
    Write-Host "Generating HTML report..." -ForegroundColor Yellow
    artillery report $reportFile --output $htmlReport
    Write-Host "[OK] HTML report generated: $htmlReport" -ForegroundColor Green
    
} catch {
    Write-Host "[ERROR] Load test failed: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Clean up temporary config
    if (Test-Path "artillery-config-temp.yml") {
        Remove-Item "artillery-config-temp.yml" -Force
    }
}

Write-Host ""
Write-Host "Phase 4: Generating Final Reports" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta

# Stop Redis monitoring
Stop-Job $monitorJob -ErrorAction SilentlyContinue
Remove-Job $monitorJob -ErrorAction SilentlyContinue

# Generate final Redis report
node redis-monitor.js report

Write-Host ""
Write-Host "Load Testing Complete!" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host ""
Write-Host "Reports Generated:" -ForegroundColor Cyan
Write-Host "  JSON Report: $reportFile" -ForegroundColor White
Write-Host "  HTML Report: $htmlReport" -ForegroundColor White
Write-Host ""
Write-Host "Key Metrics to Check:" -ForegroundColor Yellow
Write-Host "  1. Response Times (p95, p99)" -ForegroundColor White
Write-Host "  2. Error Rates" -ForegroundColor White
Write-Host "  3. Throughput (requests/sec)" -ForegroundColor White
Write-Host "  4. Redis Cache Hit Ratio" -ForegroundColor White
Write-Host "  5. Memory Usage" -ForegroundColor White
Write-Host ""

# Open HTML report if it exists
if (Test-Path $htmlReport) {
    $openReport = Read-Host "Would you like to open the HTML report now? (y/n)"
    if ($openReport -eq "y" -or $openReport -eq "Y") {
        Start-Process $htmlReport
    }
}

Write-Host "[OK] Load testing session completed successfully!" -ForegroundColor Green
