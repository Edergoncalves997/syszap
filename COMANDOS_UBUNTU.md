# 🐧 Comandos Rápidos para Ubuntu

## Instalação Completa (Copie e Cole)

### Opção 1: Criar /var/www e instalar

```bash
# 1. Criar diretório /var/www
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

# 2. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 3. Instalar Git (se não tiver)
sudo apt install -y git

# 4. Clonar o repositório
cd /var/www
git clone https://github.com/Edergoncalves997/syszap.git
cd syszap

# 5. Dar permissão ao script
chmod +x install-linux.sh

# 6. Executar instalação
bash install-linux.sh
```

### Opção 2: Instalar no diretório home (mais simples)

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Git (se não tiver)
sudo apt install -y git

# 3. Clonar no diretório home
cd ~
git clone https://github.com/Edergoncalves997/syszap.git
cd syszap

# 4. Dar permissão ao script
chmod +x install-linux.sh

# 5. Executar instalação
bash install-linux.sh
```

## Apenas Atualizar o Projeto

```bash
# Se instalou em /var/www
cd /var/www/syszap

# Ou se instalou em ~ (home)
cd ~/syszap

# Atualizar
git pull
cd back
npm install
npx prisma generate
npx prisma migrate deploy
```

## Verificar Status

```bash
# Ver se PostgreSQL está rodando
sudo systemctl status postgresql

# Ver se o backend está rodando (se configurado como serviço)
sudo systemctl status syszap-backend

# Ver logs do backend
sudo journalctl -u syszap-backend -f
```

## Iniciar Manualmente

```bash
# Terminal 1 - Backend
# Se instalou em /var/www
cd /var/www/syszap/back
# Ou se instalou em ~
cd ~/syszap/back

npm run dev

# Terminal 2 - Frontend
# Se instalou em /var/www
cd /var/www/syszap/"front sysZap"
# Ou se instalou em ~
cd ~/syszap/"front sysZap"

npm run dev
```

## Criar Diretório /var/www (se preferir)

```bash
# Criar diretório
sudo mkdir -p /var/www

# Dar permissão ao seu usuário
sudo chown $USER:$USER /var/www

# Verificar
ls -la /var/www
```
