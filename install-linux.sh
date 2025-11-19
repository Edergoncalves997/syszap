#!/bin/bash

# Script de Instalação do SysZap para Ubuntu/Linux
# Execute com: bash install-linux.sh

set -e  # Parar em caso de erro

echo "=================================="
echo "  Instalação SysZap - Ubuntu/Linux"
echo "=================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando como root (permitir, mas avisar)
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}⚠️  Executando como root. Continuando...${NC}"
   echo ""
   # Não usar sudo quando já é root
   SUDO_CMD=""
else
   SUDO_CMD="sudo"
fi

# PARTE 1: Atualizar sistema
echo -e "${YELLOW}[1/8] Atualizando sistema...${NC}"
${SUDO_CMD} apt update
${SUDO_CMD} apt upgrade -y

# PARTE 2: Instalar dependências básicas
echo -e "${YELLOW}[2/8] Instalando dependências básicas...${NC}"
${SUDO_CMD} apt install -y curl wget git build-essential

# PARTE 3: Instalar Node.js
echo -e "${YELLOW}[3/8] Instalando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | ${SUDO_CMD} -E bash -
    ${SUDO_CMD} apt install -y nodejs
else
    echo -e "${GREEN}Node.js já está instalado: $(node --version)${NC}"
fi

# PARTE 4: Instalar PostgreSQL
echo -e "${YELLOW}[4/8] Instalando PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    ${SUDO_CMD} apt install -y postgresql postgresql-contrib
    ${SUDO_CMD} systemctl start postgresql
    ${SUDO_CMD} systemctl enable postgresql
else
    echo -e "${GREEN}PostgreSQL já está instalado${NC}"
fi

# PARTE 5: Configurar PostgreSQL
echo -e "${YELLOW}[5/8] Configurando PostgreSQL...${NC}"
# Valores fixos do banco de dados
DB_NAME="syszap"
DB_USER="Sys#3"
DB_PASSWORD="Sys3@2025"
echo "Configuração do banco:"
echo "  - Banco: $DB_NAME"
echo "  - Usuário: $DB_USER"
echo ""

# Criar banco e usuário
# Nota: PostgreSQL requer aspas para nomes com caracteres especiais
# Desabilitar set -e temporariamente para ignorar erro se banco já existir
set +e

# Escolher comando baseado se é root ou não
if [ "$EUID" -eq 0 ]; then
    # Se for root, usar runuser
    PSQL_CMD="runuser -u postgres -- psql"
else
    # Se não for root, usar sudo
    PSQL_CMD="sudo -u postgres psql"
fi

$PSQL_CMD <<EOF
-- Criar banco de dados (ignorar erro se já existir)
CREATE DATABASE "$DB_NAME";

-- Criar usuário (se não existir) ou atualizar senha
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
      EXECUTE format('CREATE USER %I WITH PASSWORD %L', '$DB_USER', '$DB_PASSWORD');
   ELSE
      -- Atualizar senha se usuário já existe
      EXECUTE format('ALTER USER %I WITH PASSWORD %L', '$DB_USER', '$DB_PASSWORD');
   END IF;
END
\$\$;

-- Configurar permissões
ALTER ROLE "$DB_USER" SET client_encoding TO 'utf8';
ALTER ROLE "$DB_USER" SET default_transaction_isolation TO 'read committed';
ALTER ROLE "$DB_USER" SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO "$DB_USER";
\q
EOF
set -e  # Reabilitar set -e

echo -e "${GREEN}Banco de dados configurado com sucesso!${NC}"

# PARTE 6: Verificar se o projeto já está clonado
echo -e "${YELLOW}[6/8] Verificando projeto...${NC}"
if [ ! -d "back" ]; then
    echo -e "${RED}Diretório 'back' não encontrado!${NC}"
    echo "Por favor, clone o repositório primeiro:"
    echo "  git clone https://github.com/Edergoncalves997/syszap.git"
    exit 1
fi

# PARTE 7: Instalar dependências do backend
echo -e "${YELLOW}[7/8] Instalando dependências do backend...${NC}"
cd back
npm install

# Criar arquivo .env do backend
echo -e "${YELLOW}Criando arquivo .env do backend...${NC}"
read -p "Porta do backend (padrão: 3000): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3000}

read -sp "JWT Secret (deixe vazio para gerar aleatório): " JWT_SECRET
echo ""

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo -e "${GREEN}JWT Secret gerado automaticamente${NC}"
fi

# Codificar caracteres especiais na URL (escapar # e @)
DB_USER_ENCODED=$(echo "$DB_USER" | sed 's/#/%23/g')
DB_PASSWORD_ENCODED=$(echo "$DB_PASSWORD" | sed 's/@/%40/g' | sed 's/#/%23/g')

cat > .env <<EOF
# Database
DATABASE_URL="postgresql://$DB_USER_ENCODED:$DB_PASSWORD_ENCODED@localhost:5432/$DB_NAME?schema=public"

# JWT
JWT_SECRET="$JWT_SECRET"

# Server
PORT=$BACKEND_PORT
NODE_ENV=production

# WhatsApp
# A pasta tokens/ será criada automaticamente
EOF

echo -e "${GREEN}Arquivo .env do backend criado!${NC}"

# Gerar Prisma Client e executar migrations
echo -e "${YELLOW}Configurando banco de dados (Prisma)...${NC}"
npx prisma generate
npx prisma migrate deploy

cd ..

# PARTE 8: Instalar dependências do frontend
echo -e "${YELLOW}[8/8] Instalando dependências do frontend...${NC}"
cd "front sysZap"
npm install
echo -e "${GREEN}Dependências do frontend instaladas!${NC}"

cd ..

# Resumo
echo ""
echo -e "${GREEN}=================================="
echo "  Instalação Concluída!"
echo "==================================${NC}"
echo ""
echo "📊 Configuração:"
echo "  - Banco de dados: $DB_NAME"
echo "  - Usuário: $DB_USER"
echo "  - Backend: http://localhost:$BACKEND_PORT"
echo ""
echo "🚀 Para iniciar o sistema:"
echo ""
echo "  # Terminal 1 - Backend"
echo "  cd back"
echo "  npm run dev"
echo ""
echo "  # Terminal 2 - Frontend"
echo "  cd \"front sysZap\""
echo "  npm run dev"
echo ""
echo "📚 Consulte INSTALL_LINUX.md para mais detalhes"
echo ""

