# Enhanced Load Test Runner with Rate Limiting Fix
# Run this script to test the Event Tracker MVP under heavy load

param(
    [string]$Target = "http://localhost:5000",
    [int]$Duration = 300,  # 5 minutes by default
    [switch]$SkipRedisCheck
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Event Tracker MVP - Load Test (FIXED)   " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Function to check if a service is running
function Test-ServiceHealth($url, $name) {
    try {
        $response = Invoke-WebRequest -Uri "$url/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
        Write-Host "✅ $name is running" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $name is not responding at $url" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Check prerequisites
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check if Artillery is installed
try {
    $artilleryVersion = artillery --version 2>&1
    Write-Host "✅ Artillery is installed: $artilleryVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Artillery is not installed. Please install it:" -ForegroundColor Red
    Write-Host "   npm install -g artillery" -ForegroundColor Yellow
    exit 1
}

# Check backend health
if (-not (Test-ServiceHealth $Target "Backend API")) {
    Write-Host "`n⚠️  CRITICAL: Backend is not running!" -ForegroundColor Red
    Write-Host "Please start the backend server with load testing enabled:" -ForegroundColor Yellow
    Write-Host "cd backend ; start-load-test.bat" -ForegroundColor Cyan
    exit 1
}

# Check Redis (optional)
if (-not $SkipRedisCheck) {
    Write-Host "🔍 Checking Redis connection..." -ForegroundColor Yellow
    
    # Test Redis via backend health endpoint
    try {
        $redisHealth = Invoke-WebRequest -Uri "$Target/health/redis" -UseBasicParsing -TimeoutSec 5
        if ($redisHealth.StatusCode -eq 200) {
            Write-Host "✅ Redis is connected and operational" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Redis might not be available (continuing anyway...)" -ForegroundColor Yellow
    }
}

# Create timestamped report directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportDir = "reports"
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir | Out-Null
}

Write-Host "`n🚀 Starting Load Test..." -ForegroundColor Green
Write-Host "   Target: $Target" -ForegroundColor Cyan
Write-Host "   Duration: $Duration seconds" -ForegroundColor Cyan
Write-Host "   Reports will be saved to: $reportDir" -ForegroundColor Cyan

# Set environment variable for load testing
$env:ENABLE_LOAD_TESTING = "true"

Write-Host "`n⚡ LOAD TEST CONFIGURATION ENABLED ⚡" -ForegroundColor Yellow
Write-Host "   Rate limiting is now relaxed for load testing" -ForegroundColor Yellow

# Run the artillery load test
$reportFile = "$reportDir/load-test-report-$timestamp"

Write-Host "`n🎯 Running Artillery Load Test..." -ForegroundColor Magenta

try {
    # Run artillery with JSON and HTML reports
    artillery run "artillery-config.yml" `
        --target $Target `
        --output "$reportFile.json" `
        --environment production
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Load test completed successfully!" -ForegroundColor Green
        
        # Generate HTML report
        Write-Host "📊 Generating HTML report..." -ForegroundColor Yellow
        artillery report "$reportFile.json" --output "$reportFile.html"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ HTML report generated: $reportFile.html" -ForegroundColor Green
        }
        
        # Show summary
        Write-Host "`n📋 LOAD TEST SUMMARY" -ForegroundColor Cyan
        Write-Host "==================" -ForegroundColor Cyan
        Write-Host "JSON Report: $reportFile.json" -ForegroundColor White
        Write-Host "HTML Report: $reportFile.html" -ForegroundColor White
        
        # Try to open HTML report
        if (Test-Path "$reportFile.html") {
            $openReport = Read-Host "`nOpen HTML report in browser? (y/N)"
            if ($openReport -eq 'y' -or $openReport -eq 'Y') {
                Start-Process "$reportFile.html"
            }
        }
        
        Write-Host "`n✨ Load test completed successfully!" -ForegroundColor Green
        Write-Host "Check the reports for detailed performance metrics." -ForegroundColor Cyan
        
    } else {
        Write-Host "`n❌ Load test failed!" -ForegroundColor Red
        Write-Host "Check the artillery configuration and backend status." -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "`n❌ Error running load test: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clean up environment variable
    Remove-Item Env:ENABLE_LOAD_TESTING -ErrorAction SilentlyContinue
}

Write-Host "`n🎉 All done!" -ForegroundColor Green