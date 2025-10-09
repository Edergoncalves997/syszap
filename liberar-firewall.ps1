# Script para Liberar Portas no Firewall do Windows
# SysZap - Portas 3000 (Backend) e 5173 (Frontend)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Configuração de Firewall  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está executando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host ""
    Write-Host "👉 Clique com botão direito no arquivo e selecione 'Executar como Administrador'" -ForegroundColor Yellow
    Write-Host "   Ou execute no PowerShell: Start-Process powershell -Verb RunAs -ArgumentList '-File .\liberar-firewall.ps1'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host "✅ Executando como Administrador" -ForegroundColor Green
Write-Host ""
Write-Host "🔥 Configurando regras de firewall..." -ForegroundColor Yellow
Write-Host ""

# Remover regras antigas se existirem
Remove-NetFirewallRule -DisplayName "SysZap Backend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "SysZap Frontend" -ErrorAction SilentlyContinue

# Criar regra para o Backend (porta 3000)
Write-Host "➕ Liberando porta 3000 (Backend)..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "SysZap Backend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any | Out-Null
Write-Host "✅ Porta 3000 liberada!" -ForegroundColor Green

# Criar regra para o Frontend (porta 5173)
Write-Host "➕ Liberando porta 5173 (Frontend)..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "SysZap Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Any | Out-Null
Write-Host "✅ Porta 5173 liberada!" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  ✅ Firewall Configurado!  " -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Agora você pode acessar o sistema de outros dispositivos na rede!" -ForegroundColor Yellow
Write-Host ""
pause
