# PostPulse WSL Docker PostgreSQL Startup Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting PostPulse PostgreSQL 16 via WSL Docker..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Run docker compose up in WSL
wsl docker compose up -d

# 2. Wait for health check
Write-Host "`nWaiting for PostgreSQL container to become healthy..." -ForegroundColor Yellow
$maxAttempts = 15
$attempt = 0
$isHealthy = $false

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 1
    $status = wsl docker inspect --format="{{.State.Health.Status}}" postpulse_postgres 2>$null
    if ($status -eq "healthy") {
        $isHealthy = $true
        break
    }
    $attempt++
    Write-Host "." -NoNewline
}

if ($isHealthy) {
    Write-Host "`n[OK] PostgreSQL is healthy and accepting connections on localhost:5434!" -ForegroundColor Green
    Write-Host "Connection URL: postgresql://postgres:postgres@localhost:5434/postpulse?schema=public`n" -ForegroundColor Green
} else {
    Write-Host "`n[WARN] Container started. Inspect logs with: wsl docker logs postpulse_postgres" -ForegroundColor Yellow
}
