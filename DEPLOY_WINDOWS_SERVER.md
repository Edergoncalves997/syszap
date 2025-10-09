# 🚀 Deploy Completo no Windows Server - Passo a Passo

Este guia vai te ajudar a configurar todo o sistema do zero no Windows Server para acesso remoto.

## 📋 Pré-requisitos do Windows Server

- Windows Server 2016 ou superior
- Acesso administrativo ao servidor
- Conexão com a internet
- IP estático configurado

## 🔧 PARTE 1: Instalação do Node.js

### 1.1 Baixar e Instalar Node.js

1. **Acesse o site oficial**: https://nodejs.org/
2. **Baixe a versão LTS** (recomendada para produção)
3. **Execute o instalador** como administrador
4. **Siga o assistente** de instalação (aceite os termos e clique "Próximo")
5. **Marque a opção** "Automatically install the necessary tools" (instala ferramentas necessárias)
6. **Conclua a instalação**

### 1.2 Verificar Instalação

Abra o **Prompt de Comando** como administrador e execute:

```cmd
node --version
npm --version
```

Deve mostrar as versões instaladas.

## 🗄️ PARTE 2: Instalação do PostgreSQL

### 2.1 Baixar PostgreSQL

1. **Acesse**: https://www.postgresql.org/download/windows/
2. **Clique em "Download the installer"**
3. **Baixe a versão mais recente** (ex: PostgreSQL 15)

### 2.2 Instalar PostgreSQL

1. **Execute o instalador** como administrador
2. **Escolha o diretório** de instalação (padrão: `C:\Program Files\PostgreSQL\15`)
3. **Selecione os componentes**:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (interface gráfica)
   - ✅ Stack Builder
   - ✅ Command Line Tools

4. **Configure o diretório de dados** (padrão: `C:\Program Files\PostgreSQL\15\data`)
5. **Defina senha do usuário postgres** (ANOTE ESTA SENHA!)
6. **Configure a porta** (padrão: 5432)
7. **Selecione o locale** (Portuguese, Brazil)
8. **Conclua a instalação**

### 2.3 Configurar PostgreSQL

1. **Abra o pgAdmin 4** (instalado junto)
2. **Conecte ao servidor** usando:
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: [sua senha]

3. **Crie um banco de dados**:
   - Clique com botão direito em "Databases"
   - "Create" → "Database"
   - Nome: `whatsapp_sys`
   - Owner: postgres
   - Clique "Save"

## 🌐 PARTE 3: Configuração de Rede e Firewall

### 3.1 Configurar Firewall do Windows

1. **Abra o "Firewall do Windows Defender"**
2. **Clique em "Configurações Avançadas"**
3. **Clique em "Regras de Entrada" → "Nova Regra"**
4. **Selecione "Porta" → "Próximo"**
5. **TCP** → **Portas específicas**: `3000, 5432` → **Próximo**
6. **Permitir a conexão** → **Próximo**
7. **Marque todas as opções** (Domínio, Privada, Pública) → **Próximo**
8. **Nome**: "WhatsApp System" → **Concluir**

### 3.2 Configurar IP Estático (se necessário)

1. **Painel de Controle** → **Rede e Internet** → **Central de Rede e Compartilhamento**
2. **Clique na sua conexão** → **Propriedades**
3. **Selecione "Protocolo IP versão 4"** → **Propriedades**
4. **Marque "Usar o seguinte endereço IP"**
5. **Configure**:
   - IP: `192.168.1.100` (exemplo)
   - Máscara: `255.255.255.0`
   - Gateway: `192.168.1.1` (gateway da sua rede)
   - DNS: `8.8.8.8` e `8.8.4.4`

## 📥 PARTE 4: Baixar e Configurar o Sistema

### 4.1 Baixar o Código

1. **Abra o Prompt de Comando** como administrador
2. **Navegue para a pasta desejada**:
```cmd
cd C:\
mkdir Projetos
cd Projetos
```

3. **Clone o repositório**:
```cmd
git clone https://github.com/Edergoncalves997/Sys3-Whatsapp.git
cd Sys3-Whatsapp
```

### 4.2 Configurar o Backend

1. **Navegue para a pasta do backend**:
```cmd
cd back
```

2. **Instale as dependências**:
```cmd
npm install
```

3. **Crie o arquivo de configuração**:
```cmd
notepad .env
```

4. **Cole o seguinte conteúdo** (ajuste conforme sua configuração):
```env
# Database
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/whatsapp_sys"

# JWT
JWT_SECRET="sua_chave_secreta_muito_forte_aqui_123456789"

# Server
PORT=3000
NODE_ENV=production

# WhatsApp
# A pasta tokens/ será criada automaticamente
```

5. **Salve o arquivo** (Ctrl+S) e feche o Notepad

6. **Configure o banco de dados**:
```cmd
npx prisma migrate dev
```

7. **Teste se está funcionando**:
```cmd
npm run build
npm start
```

Se aparecer "Server running on port 3000", está funcionando! Pressione Ctrl+C para parar.

### 4.3 Configurar o Frontend

1. **Abra outro Prompt de Comando** como administrador
2. **Navegue para a pasta do frontend**:
```cmd
cd C:\Projetos\Sys3-Whatsapp\front sysZap
```

3. **Instale as dependências**:
```cmd
npm install
```

4. **Crie o arquivo de configuração**:
```cmd
notepad .env
```

5. **Cole o seguinte conteúdo** (substitua pelo IP do seu servidor):
```env
# API Backend
VITE_API_URL=http://192.168.1.100:3000

# WebSocket
VITE_WS_URL=ws://192.168.1.100:3000
```

6. **Salve o arquivo** e feche o Notepad

7. **Compile o frontend**:
```cmd
npm run build
```

## 🚀 PARTE 5: Executar o Sistema

### 5.1 Iniciar o Backend

1. **Abra o Prompt de Comando** como administrador
2. **Navegue para a pasta do backend**:
```cmd
cd C:\Projetos\Sys3-Whatsapp\back
```

3. **Inicie o servidor**:
```cmd
npm start
```

4. **Deixe este terminal aberto** (o backend deve ficar rodando)

### 5.2 Iniciar o Frontend

1. **Abra outro Prompt de Comando** como administrador
2. **Navegue para a pasta do frontend**:
```cmd
cd C:\Projetos\Sys3-Whatsapp\front sysZap
```

3. **Inicie o servidor de produção**:
```cmd
npm run preview
```

4. **Deixe este terminal aberto** também

## 🌍 PARTE 6: Acesso Remoto

### 6.1 Testar Localmente

1. **No servidor**, abra o navegador
2. **Acesse**: `http://localhost:4173` (frontend)
3. **Teste se carrega** a interface

### 6.2 Acesso de Outros Computadores

1. **Descubra o IP do servidor**:
```cmd
ipconfig
```

2. **Anote o IP** (ex: 192.168.1.100)

3. **De outros computadores na rede**, acesse:
   - `http://192.168.1.100:4173` (frontend)
   - `http://192.168.1.100:3000` (backend API)

### 6.3 Configurar Roteador (para acesso externo)

1. **Acesse o painel do roteador** (geralmente 192.168.1.1)
2. **Configure Port Forwarding**:
   - Porta 80 → 192.168.1.100:4173 (frontend)
   - Porta 3000 → 192.168.1.100:3000 (backend)
3. **Salve as configurações**

## 🔧 PARTE 7: Configuração como Serviço (Opcional)

### 7.1 Instalar PM2 (Gerenciador de Processos)

1. **Instale o PM2 globalmente**:
```cmd
npm install -g pm2
```

2. **Configure o backend**:
```cmd
cd C:\Projetos\Sys3-Whatsapp\back
pm2 start dist/server.js --name "whatsapp-backend"
pm2 save
pm2 startup
```

3. **Configure o frontend**:
```cmd
cd C:\Projetos\Sys3-Whatsapp\front sysZap
pm2 start "npm run preview" --name "whatsapp-frontend"
pm2 save
```

### 7.2 Verificar Status

```cmd
pm2 status
pm2 logs
```

## 🛡️ PARTE 8: Segurança Adicional

### 8.1 Configurar HTTPS (Recomendado)

1. **Obtenha um certificado SSL** (Let's Encrypt ou comprado)
2. **Configure um proxy reverso** (Nginx ou IIS)
3. **Redirecione HTTP para HTTPS**

### 8.2 Backup do Banco

1. **Configure backup automático** do PostgreSQL
2. **Faça backup regular** da pasta `tokens/`
3. **Documente as configurações** importantes

## 📱 PARTE 9: Primeiro Uso

### 9.1 Acessar o Sistema

1. **Abra o navegador** e acesse: `http://IP_DO_SERVIDOR:4173`
2. **Faça login** com as credenciais padrão
3. **Configure uma sessão do WhatsApp**:
   - Vá em "Configurações" → "WhatsApp"
   - Clique em "Conectar Nova Sessão"
   - Escaneie o QR Code com seu WhatsApp

### 9.2 Testar Funcionalidades

- ✅ Login no sistema
- ✅ Conexão do WhatsApp
- ✅ Recebimento de mensagens
- ✅ Envio de mensagens
- ✅ Interface responsiva

## 🆘 Solução de Problemas

### Erro de Conexão com Banco
```cmd
# Verificar se PostgreSQL está rodando
net start postgresql-x64-15

# Testar conexão
psql -U postgres -h localhost -d whatsapp_sys
```

### Erro de Porta em Uso
```cmd
# Verificar portas em uso
netstat -ano | findstr :3000
netstat -ano | findstr :4173

# Matar processo se necessário
taskkill /PID [NUMERO_DO_PID] /F
```

### Erro de Firewall
- Verifique se as portas 3000 e 4173 estão liberadas
- Teste com firewall desabilitado temporariamente

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `pm2 logs`
2. Teste as conexões de rede
3. Verifique as configurações do banco
4. Confirme se todas as dependências estão instaladas

---

**🎉 Parabéns!** Seu sistema WhatsApp está rodando no Windows Server e acessível remotamente!
