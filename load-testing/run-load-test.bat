@echo off
echo ========================================
echo Event Tracker MVP Load Testing Suite
echo ========================================
echo.

echo Checking prerequisites...

:: Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    pause
    exit /b 1
) else (
    echo [OK] Node.js is available
)

:: Check if Artillery is available
artillery --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Artillery.js is not installed globally
    echo [INFO] Installing Artillery.js...
    npm install -g artillery
    if errorlevel 1 (
        echo [ERROR] Failed to install Artillery
        pause
        exit /b 1
    )
) else (
    echo [OK] Artillery.js is available
)

:: Check if backend is running
echo Checking if backend is running...
curl -f http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend is not accessible at http://localhost:5000
    echo [INFO] Please start your backend server first!
    echo [INFO] Run: cd backend ^&^& npm run dev
    pause
    exit /b 1
) else (
    echo [OK] Backend is running
)

:: Check if Redis is running
echo Checking Redis connection...
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Redis might not be running
    echo [INFO] Cache testing will be limited
) else (
    echo [OK] Redis is running
)

:: Create reports directory
if not exist "reports" mkdir reports
echo [OK] Reports directory ready

echo.
echo Starting Load Test...
echo Target: http://localhost:5000
echo.

:: Generate timestamp for report files
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

set "reportFile=reports/load-test-report-%timestamp%.json"
set "htmlReport=reports/load-test-report-%timestamp%.html"

echo ==========================================
echo Phase 1: Redis Cache Performance Test
echo ==========================================
node redis-monitor.js test

echo.
echo ================================
echo Phase 2: Starting Load Test
echo ================================

:: Run Artillery load test
artillery run artillery-config.yml --output %reportFile%
if errorlevel 1 (
    echo [ERROR] Load test failed
    pause
    exit /b 1
)

echo [OK] Load test completed

:: Generate HTML report
echo Generating HTML report...
artillery report %reportFile% --output %htmlReport%
if errorlevel 1 (
    echo [WARNING] Failed to generate HTML report
) else (
    echo [OK] HTML report generated: %htmlReport%
)

echo.
echo =================================
echo Phase 3: Final Redis Report
echo =================================
node redis-monitor.js report

echo.
echo =====================
echo Load Testing Complete!
echo =====================
echo.
echo Reports Generated:
echo   JSON Report: %reportFile%
echo   HTML Report: %htmlReport%
echo.
echo Key Metrics to Check:
echo   1. Response Times (p95, p99)
echo   2. Error Rates
echo   3. Throughput (requests/sec)
echo   4. Redis Cache Hit Ratio
echo   5. Memory Usage
echo.

:: Ask to open HTML report
if exist "%htmlReport%" (
    set /p openReport="Would you like to open the HTML report now? (y/n): "
    if /i "%openReport%"=="y" start "" "%htmlReport%"
)

echo [OK] Load testing session completed!
pause