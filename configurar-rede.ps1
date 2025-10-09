# Script de Configuracao para Acesso em Rede Local
# SysZap - Backend + Frontend

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  SYSPZAP - Configuracao de Rede  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Descobrir IP da maquina
Write-Host "[*] Descobrindo endereco IP da maquina..." -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress

if ($ip) {
    Write-Host "[OK] IP encontrado: $ip" -ForegroundColor Green
} else {
    Write-Host "[!] Nao foi possivel detectar o IP automaticamente" -ForegroundColor Red
    $ip = Read-Host "Digite o IP da sua maquina manualmente (exemplo: 192.168.1.100)"
}

Write-Host ""
Write-Host "[*] Criando arquivos de configuracao..." -ForegroundColor Yellow

# Criar .env do Backend
$backendEnv = @"
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="seu-secret-super-seguro-aqui-mude-isso"
"@

$backendEnv | Out-File -FilePath "back\.env" -Encoding utf8 -Force
Write-Host "[OK] Criado: back\.env" -ForegroundColor Green

# Criar .env do Frontend
$frontendEnv = @"
# URL da API Backend
# IP detectado: $ip
# Para acessar apenas localmente, use: http://localhost:3000
# Para acessar de outros dispositivos na rede, use: http://${ip}:3000
VITE_API_URL=http://${ip}:3000
"@

$frontendEnv | Out-File -FilePath "front sysZap\.env" -Encoding utf8 -Force
Write-Host "[OK] Criado: front sysZap\.env" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Configuracao Concluida!  " -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs de Acesso:" -ForegroundColor Yellow
Write-Host "   Frontend (Local):  http://localhost:5173" -ForegroundColor White
Write-Host "   Frontend (Rede):   http://${ip}:5173" -ForegroundColor White
Write-Host "   Backend (Local):   http://localhost:3000" -ForegroundColor White
Write-Host "   Backend (Rede):    http://${ip}:3000" -ForegroundColor White
Write-Host "   API Docs:          http://${ip}:3000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Para iniciar o sistema, execute:" -ForegroundColor Yellow
Write-Host "   .\iniciar-sistema.ps1" -ForegroundColor Cyan
Write-Host ""
