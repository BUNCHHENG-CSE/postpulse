# PostPulse WSL Docker PostgreSQL Startup Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting PostPulse PostgreSQL 16 via WSL Docker..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Ensure WSL background process keeps the WSL2 VM active
Start-Process -FilePath "wsl" -ArgumentList "sleep infinity" -WindowStyle Hidden -ErrorAction SilentlyContinue

# 2. Run docker compose up in WSL
wsl docker compose up -d

# 3. Wait for health check
Write-Host "`nWaiting for PostgreSQL container to become healthy..." -ForegroundColor Yellow
$maxAttempts = 20
$attempt = 0
$isHealthy = $false

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 1
    $status = (wsl docker inspect --format="{{.State.Health.Status}}" postpulse_postgres 2>$null).Trim()
    if ($status -eq "healthy") {
        $isHealthy = $true
        break
    }
    $attempt++
    Write-Host "." -NoNewline
}

if ($isHealthy) {
    Write-Host "`n[OK] PostgreSQL 16 is healthy and accepting connections on 127.0.0.1:5435!" -ForegroundColor Green
    Write-Host "Database URL: postgresql://postgres:postgres@127.0.0.1:5435/postpulse?schema=public`n" -ForegroundColor Green
    
    # Run seed / verification
    Write-Host "Verifying database tables & benchmark data..." -ForegroundColor Cyan
    node ./scripts/verify-db.mjs
} else {
    Write-Host "`n[WARN] Container started. Inspect logs with: wsl docker logs postpulse_postgres" -ForegroundColor Yellow
}
