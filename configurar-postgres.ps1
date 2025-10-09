# Script para Configurar PostgreSQL
# SysZap - Backend

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Configuracao PostgreSQL  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Digite as informacoes do PostgreSQL:" -ForegroundColor Yellow
Write-Host ""

$host_pg = Read-Host "Host (pressione Enter para 'localhost')"
if ([string]::IsNullOrWhiteSpace($host_pg)) { $host_pg = "localhost" }

$port = Read-Host "Porta (pressione Enter para '5432')"
if ([string]::IsNullOrWhiteSpace($port)) { $port = "5432" }

$database = Read-Host "Nome do Banco de Dados"
$user = Read-Host "Usuario do PostgreSQL"
$password = Read-Host "Senha" -AsSecureString
$password_plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host ""
Write-Host "[*] Criando arquivo .env..." -ForegroundColor Yellow

# Criar .env do Backend com PostgreSQL
$backendEnv = @"
PORT=3000
DATABASE_URL="postgresql://${user}:${password_plain}@${host_pg}:${port}/${database}?schema=public"
JWT_SECRET="seu-secret-super-seguro-aqui-mude-isso"
"@

$backendEnv | Out-File -FilePath "back\.env" -Encoding utf8 -Force

Write-Host "[OK] Arquivo back\.env criado!" -ForegroundColor Green
Write-Host ""
Write-Host "Conexao configurada:" -ForegroundColor Yellow
Write-Host "  postgresql://${user}:****@${host_pg}:${port}/${database}" -ForegroundColor White
Write-Host ""
Write-Host "[*] Executando migracoes do banco de dados..." -ForegroundColor Yellow

Set-Location back
npx prisma migrate deploy
Write-Host ""
Write-Host "[*] Gerando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate
Set-Location ..

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Configuracao Concluida!  " -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Yellow
Write-Host "   .\iniciar-sistema.ps1" -ForegroundColor Cyan
Write-Host ""

