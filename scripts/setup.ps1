# ─────────────────────────────────────────────────────────────────────────────
# FinPolicy Compiler — Project Setup (Windows PowerShell)
# ─────────────────────────────────────────────────────────────────────────────
$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "🚀 FinPolicy Compiler — Project Setup" -ForegroundColor Cyan
Write-Host ("━" * 40) -ForegroundColor Cyan

# 1. Install all workspace dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# 2. Copy environment files if they don't already exist
Write-Host ""
Write-Host "📋 Copying environment files..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "   ✅ backend\.env created from .env.example" -ForegroundColor Green
} else {
    Write-Host "   ⚡ backend\.env already exists — skipping" -ForegroundColor Gray
}

if (-not (Test-Path "frontend\.env")) {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "   ✅ frontend\.env created from .env.example" -ForegroundColor Green
} else {
    Write-Host "   ⚡ frontend\.env already exists — skipping" -ForegroundColor Gray
}

Write-Host ""
Write-Host ("━" * 40) -ForegroundColor Cyan
Write-Host "✅  Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Edit  backend\.env  with your PostgreSQL credentials" -ForegroundColor White
Write-Host "  2. Run:  npm run db:migrate   — create database tables" -ForegroundColor White
Write-Host "  3. Run:  npm run db:seed      — seed default users" -ForegroundColor White
Write-Host "  4. Run:  npm run dev          — start all services" -ForegroundColor White
Write-Host ""
