# Script de Instalação Automática - Sistema WhatsApp
# Execute como Administrador no Windows Server

Write-Host "🚀 Iniciando instalação do Sistema WhatsApp no Windows Server..." -ForegroundColor Green

# Verificar se está executando como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Este script deve ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique com botão direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Executando como Administrador" -ForegroundColor Green

# 1. Verificar se Node.js está instalado
Write-Host "`n📦 Verificando Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "📥 Baixe e instale Node.js de: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Reinicie este script após a instalação." -ForegroundColor Yellow
    pause
    exit 1
}

# 2. Verificar se PostgreSQL está instalado
Write-Host "`n🗄️ Verificando PostgreSQL..." -ForegroundColor Cyan
try {
    $psqlVersion = psql --version
    Write-Host "✅ PostgreSQL encontrado: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL não encontrado!" -ForegroundColor Red
    Write-Host "📥 Baixe e instale PostgreSQL de: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "Reinicie este script após a instalação." -ForegroundColor Yellow
    pause
    exit 1
}

# 3. Criar diretório do projeto
Write-Host "`n📁 Criando diretório do projeto..." -ForegroundColor Cyan
$projectPath = "C:\Projetos\Sys3-Whatsapp"
if (Test-Path $projectPath) {
    Write-Host "⚠️ Diretório já existe. Removendo..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $projectPath
}
New-Item -ItemType Directory -Path "C:\Projetos" -Force | Out-Null
Write-Host "✅ Diretório criado: $projectPath" -ForegroundColor Green

# 4. Baixar código do GitHub
Write-Host "`n📥 Baixando código do GitHub..." -ForegroundColor Cyan
try {
    git clone https://github.com/Edergoncalves997/Sys3-Whatsapp.git $projectPath
    Write-Host "✅ Código baixado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao baixar código do GitHub!" -ForegroundColor Red
    Write-Host "Verifique sua conexão com a internet e tente novamente." -ForegroundColor Yellow
    pause
    exit 1
}

# 5. Configurar Backend
Write-Host "`n⚙️ Configurando Backend..." -ForegroundColor Cyan
Set-Location "$projectPath\back"

# Instalar dependências
Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
npm install

# Criar arquivo .env
Write-Host "🔧 Criando arquivo de configuração..." -ForegroundColor Yellow
$envContent = @"
# Database
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/whatsapp_sys"

# JWT
JWT_SECRET="sua_chave_secreta_muito_forte_aqui_123456789"

# Server
PORT=3000
NODE_ENV=production

# WhatsApp
# A pasta tokens/ será criada automaticamente
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Arquivo .env criado!" -ForegroundColor Green

# Compilar backend
Write-Host "🔨 Compilando backend..." -ForegroundColor Yellow
npm run build

# 6. Configurar Frontend
Write-Host "`n🎨 Configurando Frontend..." -ForegroundColor Cyan
Set-Location "$projectPath\front sysZap"

# Instalar dependências
Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
npm install

# Obter IP do servidor
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    $ipAddress = "localhost"
    Write-Host "⚠️ IP da rede não detectado. Usando localhost." -ForegroundColor Yellow
}

# Criar arquivo .env
Write-Host "🔧 Criando arquivo de configuração do frontend..." -ForegroundColor Yellow
$frontendEnvContent = @"
# API Backend
VITE_API_URL=http://$ipAddress`:3000

# WebSocket
VITE_WS_URL=ws://$ipAddress`:3000
"@

$frontendEnvContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Arquivo .env do frontend criado!" -ForegroundColor Green

# Compilar frontend
Write-Host "🔨 Compilando frontend..." -ForegroundColor Yellow
npm run build

# 7. Configurar Firewall
Write-Host "`n🔥 Configurando Firewall..." -ForegroundColor Cyan
try {
    # Liberar porta 3000 (backend)
    New-NetFirewallRule -DisplayName "WhatsApp Backend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow | Out-Null
    Write-Host "✅ Porta 3000 liberada no firewall" -ForegroundColor Green
    
    # Liberar porta 4173 (frontend)
    New-NetFirewallRule -DisplayName "WhatsApp Frontend" -Direction Inbound -Protocol TCP -LocalPort 4173 -Action Allow | Out-Null
    Write-Host "✅ Porta 4173 liberada no firewall" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao configurar firewall. Configure manualmente se necessário." -ForegroundColor Yellow
}

# 8. Instalar PM2 (Gerenciador de Processos)
Write-Host "`n📦 Instalando PM2..." -ForegroundColor Cyan
try {
    npm install -g pm2
    Write-Host "✅ PM2 instalado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao instalar PM2. Você pode instalar manualmente depois." -ForegroundColor Yellow
}

# 9. Criar scripts de inicialização
Write-Host "`n📝 Criando scripts de inicialização..." -ForegroundColor Cyan

# Script para iniciar backend
$backendScript = @"
@echo off
cd /d "$projectPath\back"
npm start
pause
"@
$backendScript | Out-File -FilePath "$projectPath\iniciar-backend.bat" -Encoding ASCII

# Script para iniciar frontend
$frontendScript = @"
@echo off
cd /d "$projectPath\front sysZap"
npm run preview
pause
"@
$frontendScript | Out-File -FilePath "$projectPath\iniciar-frontend.bat" -Encoding ASCII

# Script para iniciar tudo
$allScript = @"
@echo off
echo Iniciando Sistema WhatsApp...
start "Backend" "$projectPath\iniciar-backend.bat"
timeout /t 5
start "Frontend" "$projectPath\iniciar-frontend.bat"
echo Sistema iniciado! Acesse: http://$ipAddress`:4173
pause
"@
$allScript | Out-File -FilePath "$projectPath\iniciar-sistema.bat" -Encoding ASCII

Write-Host "✅ Scripts criados!" -ForegroundColor Green

# 10. Resumo final
Write-Host "`n🎉 INSTALAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "📁 Projeto instalado em: $projectPath" -ForegroundColor White
Write-Host "🌐 Acesse o sistema em: http://$ipAddress`:4173" -ForegroundColor White
Write-Host "🔧 Backend rodando em: http://$ipAddress`:3000" -ForegroundColor White
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Configure o banco de dados PostgreSQL" -ForegroundColor White
Write-Host "2. Execute: npx prisma migrate dev (na pasta back)" -ForegroundColor White
Write-Host "3. Execute: $projectPath\iniciar-sistema.bat" -ForegroundColor White
Write-Host "4. Acesse o sistema e configure uma sessão do WhatsApp" -ForegroundColor White
Write-Host "`n⚠️ IMPORTANTE:" -ForegroundColor Red
Write-Host "- Configure a senha do PostgreSQL no arquivo .env" -ForegroundColor White
Write-Host "- Crie o banco de dados 'whatsapp_sys' no PostgreSQL" -ForegroundColor White
Write-Host "- Execute as migrations do Prisma" -ForegroundColor White

Write-Host "`nPressione qualquer tecla para continuar..." -ForegroundColor Cyan
pause
