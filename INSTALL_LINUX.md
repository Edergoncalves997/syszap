# 🐧 Guia de Instalação - Ubuntu/Linux

Este guia vai te ajudar a instalar e configurar o sistema SysZap no Ubuntu 22.04 LTS (ou versões superiores).

## 📋 Pré-requisitos do Sistema

- Ubuntu 22.04 LTS ou superior
- Acesso root ou sudo
- Conexão com a internet
- Mínimo 2GB de RAM (recomendado 4GB+)
- Mínimo 10GB de espaço em disco

---

## 🔧 PARTE 1: Instalação das Dependências do Sistema

### 1.1 Atualizar o Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Instalar Ferramentas Básicas

```bash
sudo apt install -y curl wget git build-essential
```

---

## 📦 PARTE 2: Instalação do Node.js

### Opção A: Instalar Node.js via NodeSource (Recomendado)

```bash
# Instalar Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

### Opção B: Instalar Node.js via NVM (Node Version Manager)

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recarregar o shell
source ~/.bashrc

# Instalar Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verificar instalação
node --version
npm --version
```

**Nota:** Use a Opção A para instalação global no sistema, ou Opção B se precisar gerenciar múltiplas versões do Node.js.

---

## 🗄️ PARTE 3: Instalação do PostgreSQL

### 3.1 Instalar PostgreSQL

```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Iniciar e habilitar o serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### 3.2 Configurar PostgreSQL

```bash
# Acessar o PostgreSQL como usuário postgres
sudo -u postgres psql

# Dentro do psql, criar o banco de dados e usuário
CREATE DATABASE whatsapp_sys;
CREATE USER syszap_user WITH PASSWORD 'sua_senha_segura_aqui';
ALTER ROLE syszap_user SET client_encoding TO 'utf8';
ALTER ROLE syszap_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE syszap_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_sys TO syszap_user;
\q
```

**Importante:** Anote a senha que você definiu! Você vai precisar dela no arquivo `.env`.

### 3.3 Configurar Acesso Remoto (Opcional)

Se precisar acessar o PostgreSQL de outro servidor:

```bash
# Editar arquivo de configuração
sudo nano /etc/postgresql/*/main/postgresql.conf

# Descomentar e alterar:
# listen_addresses = 'localhost'  # ou '*' para aceitar de qualquer IP

# Editar pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Adicionar linha para permitir conexões:
# host    all             all             0.0.0.0/0               md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

---

## 📥 PARTE 4: Clonar e Configurar o Projeto

### 4.1 Clonar o Repositório

```bash
# Navegar para o diretório desejado (ex: /var/www ou /home/usuario)
cd /var/www  # ou outro diretório de sua preferência

# Clonar o repositório
git clone https://github.com/Edergoncalves997/syszap.git
cd syszap
```

### 4.2 Instalar Dependências do Backend

```bash
cd back
npm install
```

### 4.3 Configurar Variáveis de Ambiente do Backend

```bash
# Criar arquivo .env
nano .env
```

Cole o seguinte conteúdo (ajuste conforme sua configuração):

```env
# Database
DATABASE_URL="postgresql://syszap_user:sua_senha_segura_aqui@localhost:5432/whatsapp_sys?schema=public"

# JWT
JWT_SECRET="sua_chave_secreta_muito_forte_aqui_altere_esta_chave"

# Server
PORT=3000
NODE_ENV=production

# WhatsApp
# A pasta tokens/ será criada automaticamente
```

**Salve o arquivo:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 4.4 Configurar o Banco de Dados (Prisma)

```bash
# Gerar o Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate deploy

# (Opcional) Verificar o banco com Prisma Studio
npx prisma studio
# Acesse http://localhost:5555 no navegador
```

### 4.5 Instalar Dependências do Frontend

```bash
cd ../"front sysZap"
npm install
```

### 4.6 Configurar Variáveis de Ambiente do Frontend

```bash
# Criar arquivo .env
nano .env
```

Cole o seguinte conteúdo (ajuste o IP se necessário):

```env
# API Backend
VITE_API_URL=http://localhost:3000

# WebSocket
VITE_WS_URL=ws://localhost:3000
```

**Para acesso remoto**, use o IP do servidor:
```env
VITE_API_URL=http://131.72.53.170:3000
VITE_WS_URL=ws://131.72.53.170:3000
```

---

## 🚀 PARTE 5: Executar o Sistema

### 5.1 Modo Desenvolvimento

**Terminal 1 - Backend:**
```bash
cd /var/www/syszap/back
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /var/www/syszap/"front sysZap"
npm run dev
```

### 5.2 Modo Produção

**Build do Frontend:**
```bash
cd /var/www/syszap/"front sysZap"
npm run build
```

**Build do Backend:**
```bash
cd /var/www/syszap/back
npm run build
```

**Executar Backend:**
```bash
cd /var/www/syszap/back
npm start
```

**Servir Frontend (com nginx ou outro servidor web):**
```bash
# Instalar nginx
sudo apt install -y nginx

# Configurar nginx para servir o frontend
sudo nano /etc/nginx/sites-available/syszap
```

Cole a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com ou IP;

    root /var/www/syszap/front sysZap/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar o site:
```bash
sudo ln -s /etc/nginx/sites-available/syszap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔄 PARTE 6: Executar como Serviço (Systemd)

### 6.1 Criar Serviço para o Backend

```bash
sudo nano /etc/systemd/system/syszap-backend.service
```

Cole o seguinte conteúdo:

```ini
[Unit]
Description=SysZap Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/syszap/back
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Ativar e iniciar o serviço:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable syszap-backend
sudo systemctl start syszap-backend
sudo systemctl status syszap-backend
```

### 6.2 Ver Logs do Backend

```bash
# Ver logs em tempo real
sudo journalctl -u syszap-backend -f

# Ver últimas 100 linhas
sudo journalctl -u syszap-backend -n 100
```

---

## 🔥 PARTE 7: Configurar Firewall

```bash
# Instalar UFW (se não estiver instalado)
sudo apt install -y ufw

# Permitir SSH (importante fazer primeiro!)
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir porta do backend (se necessário)
sudo ufw allow 3000/tcp

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

---

## ✅ PARTE 8: Verificação Final

### 8.1 Verificar Serviços

```bash
# PostgreSQL
sudo systemctl status postgresql

# Backend (se configurado como serviço)
sudo systemctl status syszap-backend

# Nginx (se configurado)
sudo systemctl status nginx
```

### 8.2 Testar Conexão com Banco

```bash
sudo -u postgres psql -d whatsapp_sys -c "\dt"
```

### 8.3 Acessar o Sistema

- **Frontend:** `http://seu-ip-ou-dominio`
- **Backend API:** `http://seu-ip-ou-dominio:3000`
- **Documentação API:** `http://seu-ip-ou-dominio:3000/docs`
- **Prisma Studio:** `http://seu-ip-ou-dominio:5555` (se estiver rodando)

---

## 🛠️ Comandos Úteis

### Reiniciar Serviços

```bash
# Backend
sudo systemctl restart syszap-backend

# PostgreSQL
sudo systemctl restart postgresql

# Nginx
sudo systemctl restart nginx
```

### Ver Logs

```bash
# Backend
sudo journalctl -u syszap-backend -f

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# Nginx
sudo tail -f /var/log/nginx/error.log
```

### Atualizar o Projeto

```bash
cd /var/www/syszap
git pull
cd back
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
sudo systemctl restart syszap-backend
```

---

## 🆘 Solução de Problemas

### Erro: "Cannot find module '../generated/prisma'"

```bash
cd back
npx prisma generate
```

### Erro de conexão com PostgreSQL

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar credenciais no .env
cat back/.env | grep DATABASE_URL

# Testar conexão manual
psql -U syszap_user -d whatsapp_sys -h localhost
```

### Erro de permissão na pasta tokens/

```bash
# Criar pasta e dar permissões
mkdir -p /var/www/syszap/back/tokens
chown -R www-data:www-data /var/www/syszap/back/tokens
chmod -R 755 /var/www/syszap/back/tokens
```

### Porta 3000 já em uso

```bash
# Verificar o que está usando a porta
sudo lsof -i :3000

# Ou matar o processo
sudo kill -9 $(sudo lsof -t -i:3000)
```

---

## 📚 Próximos Passos

1. ✅ Configure uma sessão do WhatsApp através da interface
2. ✅ Crie empresas e usuários
3. ✅ Configure filas de atendimento
4. ✅ Teste o envio e recebimento de mensagens

---

**Pronto!** Seu sistema está instalado e configurado no Ubuntu! 🎉

Para suporte, consulte a documentação adicional:
- `SETUP.md` - Configuração geral
- `back/README.md` - Documentação do backend
- `back/WHATSAPP_INTEGRATION.md` - Integração WhatsApp

