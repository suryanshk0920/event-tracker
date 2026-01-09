# Event Tracker Development Server Starter
Write-Host "🚀 Starting Event Tracker Development Servers..." -ForegroundColor Green

# Start Backend in a new PowerShell window
Write-Host "📡 Starting Backend Server on port 5000..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\websites\event-tracker-mvp\backend'; npm run dev"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Start Frontend in a new PowerShell window
Write-Host "🎨 Starting Frontend Server on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\websites\event-tracker-mvp\frontend'; npm run dev"

Write-Host "`n✅ Both servers are starting!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "🔧 Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "`nPress any key to continue..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")