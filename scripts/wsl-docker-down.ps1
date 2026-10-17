# PostPulse WSL Docker PostgreSQL Shutdown Script
Write-Host "Stopping PostPulse PostgreSQL container..." -ForegroundColor Cyan
wsl docker compose down
Write-Host "[OK] PostgreSQL container stopped." -ForegroundColor Green
