# Script para Configurar Banco de Dados PostgreSQL
# Execute como Administrador após instalar o PostgreSQL

Write-Host "🗄️ Configurando Banco de Dados PostgreSQL..." -ForegroundColor Green

# Verificar se PostgreSQL está instalado
try {
    $psqlVersion = psql --version
    Write-Host "✅ PostgreSQL encontrado: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL não encontrado!" -ForegroundColor Red
    Write-Host "Instale o PostgreSQL primeiro e tente novamente." -ForegroundColor Yellow
    pause
    exit 1
}

# Solicitar informações do banco
Write-Host "`n📝 Configuração do Banco de Dados" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$dbHost = Read-Host "Host do PostgreSQL (padrão: localhost)"
if ([string]::IsNullOrEmpty($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "Porta do PostgreSQL (padrão: 5432)"
if ([string]::IsNullOrEmpty($dbPort)) { $dbPort = "5432" }

$dbUser = Read-Host "Usuário do PostgreSQL (padrão: postgres)"
if ([string]::IsNullOrEmpty($dbUser)) { $dbUser = "postgres" }

$dbPassword = Read-Host "Senha do PostgreSQL" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

$dbName = Read-Host "Nome do banco (padrão: whatsapp_sys)"
if ([string]::IsNullOrEmpty($dbName)) { $dbName = "whatsapp_sys" }

# Definir variável de ambiente para senha
$env:PGPASSWORD = $dbPasswordPlain

Write-Host "`n🔧 Criando banco de dados..." -ForegroundColor Yellow

# Criar banco de dados
try {
    $createDbQuery = "CREATE DATABASE `"$dbName`";"
    $createDbQuery | psql -h $dbHost -p $dbPort -U $dbUser -d postgres
    Write-Host "✅ Banco de dados '$dbName' criado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Banco de dados pode já existir ou houve erro na criação." -ForegroundColor Yellow
}

# Atualizar arquivo .env do backend
Write-Host "`n📝 Atualizando arquivo .env..." -ForegroundColor Yellow

$projectPath = "C:\Projetos\Sys3-Whatsapp\back"
$envFile = "$projectPath\.env"

if (Test-Path $envFile) {
    $envContent = @"
# Database
DATABASE_URL="postgresql://$dbUser`:$dbPasswordPlain`@$dbHost`:$dbPort`/$dbName"

# JWT
JWT_SECRET="sua_chave_secreta_muito_forte_aqui_123456789"

# Server
PORT=3000
NODE_ENV=production

# WhatsApp
# A pasta tokens/ será criada automaticamente
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "✅ Arquivo .env atualizado!" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo .env não encontrado em: $envFile" -ForegroundColor Red
}

# Executar migrations do Prisma
Write-Host "`n🔄 Executando migrations do Prisma..." -ForegroundColor Yellow

Set-Location $projectPath

try {
    npx prisma migrate dev --name init
    Write-Host "✅ Migrations executadas com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao executar migrations!" -ForegroundColor Red
    Write-Host "Verifique se o banco de dados está acessível e tente novamente." -ForegroundColor Yellow
}

# Gerar cliente Prisma
Write-Host "`n🔨 Gerando cliente Prisma..." -ForegroundColor Yellow

try {
    npx prisma generate
    Write-Host "✅ Cliente Prisma gerado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao gerar cliente Prisma!" -ForegroundColor Red
}

# Testar conexão
Write-Host "`n🧪 Testando conexão com o banco..." -ForegroundColor Yellow

try {
    $testQuery = "SELECT version();"
    $result = $testQuery | psql -h $dbHost -p $dbPort -U $dbUser -d $dbName
    Write-Host "✅ Conexão com banco testada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao testar conexão!" -ForegroundColor Red
}

Write-Host "`n🎉 CONFIGURAÇÃO DO BANCO CONCLUÍDA!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "📊 Banco: $dbName" -ForegroundColor White
Write-Host "🌐 Host: $dbHost`:$dbPort" -ForegroundColor White
Write-Host "👤 Usuário: $dbUser" -ForegroundColor White
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Execute: C:\Projetos\Sys3-Whatsapp\iniciar-sistema.bat" -ForegroundColor White
Write-Host "2. Acesse: http://[IP_DO_SERVIDOR]:4173" -ForegroundColor White
Write-Host "3. Configure uma sessão do WhatsApp" -ForegroundColor White

Write-Host "`nPressione qualquer tecla para continuar..." -ForegroundColor Cyan
pause
