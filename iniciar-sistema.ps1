# Script para Iniciar Backend e Frontend
# SysZap

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "    Iniciando SysZap Sistema      " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se node_modules existem
Write-Host "[*] Verificando dependencias..." -ForegroundColor Yellow

if (!(Test-Path "back\node_modules")) {
    Write-Host "[*] Instalando dependencias do Backend..." -ForegroundColor Yellow
    Set-Location back
    npm install
    Write-Host "[OK] Dependencias do Backend instaladas!" -ForegroundColor Green
    Set-Location ..
}

if (!(Test-Path "front sysZap\node_modules")) {
    Write-Host "[*] Instalando dependencias do Frontend..." -ForegroundColor Yellow
    Set-Location "front sysZap"
    npm install
    Write-Host "[OK] Dependencias do Frontend instaladas!" -ForegroundColor Green
    Set-Location ..
}

# Verificar se Prisma esta configurado
Write-Host "[*] Verificando configuracao do Prisma..." -ForegroundColor Yellow
Set-Location back
if (!(Test-Path "node_modules\.prisma")) {
    Write-Host "[*] Gerando cliente Prisma..." -ForegroundColor Yellow
    npx prisma generate
    Write-Host "[OK] Cliente Prisma gerado!" -ForegroundColor Green
}
Set-Location ..

Write-Host ""
Write-Host "[*] Iniciando servicos..." -ForegroundColor Green
Write-Host ""

# Iniciar Backend em nova janela
Write-Host "[*] Iniciando Backend na porta 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\back'; Write-Host 'BACKEND - SysZap' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Start-Sleep -Seconds 3

# Iniciar Frontend em nova janela
Write-Host "[*] Iniciando Frontend na porta 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\front sysZap'; Write-Host 'FRONTEND - SysZap' -ForegroundColor Yellow; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Sistema Iniciado com Sucesso!  " -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Duas janelas foram abertas:" -ForegroundColor Yellow
Write-Host "   - Backend (janela azul)" -ForegroundColor Cyan
Write-Host "   - Frontend (janela amarela)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Aguarde alguns segundos e acesse:" -ForegroundColor Yellow

# Tentar pegar o IP do .env
$envContent = Get-Content "front sysZap\.env" -ErrorAction SilentlyContinue
$apiUrl = ($envContent | Where-Object {$_ -match "VITE_API_URL"}) -replace "VITE_API_URL=", "" -replace "#.*", "" -replace " ", ""
$ip = ($apiUrl -replace "http://", "" -replace ":3000", "")

if ($ip) {
    Write-Host "   LOCAL:  http://localhost:5173" -ForegroundColor White
    Write-Host "   REDE:   http://${ip}:5173" -ForegroundColor White
} else {
    Write-Host "   http://localhost:5173" -ForegroundColor White
}

Write-Host ""
Write-Host "Para parar o sistema, feche as janelas ou pressione Ctrl+C" -ForegroundColor Red
Write-Host ""