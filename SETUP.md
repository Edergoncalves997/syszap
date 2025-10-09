# 🚀 Guia de Setup do Sistema

Este guia vai te ajudar a configurar o projeto após clonar do Git.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL instalado e rodando
- Git instalado

## 🔧 Configuração do Backend

### 1. Instalar dependências
```bash
cd back
npm install
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` na pasta `back/` com o seguinte conteúdo:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"

# JWT
JWT_SECRET="sua_chave_secreta_aqui"

# Server
PORT=3000
NODE_ENV=development
```

### 3. Configurar banco de dados
```bash
# Executar migrations
npx prisma migrate dev

# (Opcional) Abrir Prisma Studio para ver o banco
npm run prisma:studio
```

### 4. Iniciar o backend
```bash
# Modo desenvolvimento
npm run dev

# Ou compilar e rodar em produção
npm run build
npm start
```

**Nota:** A pasta `tokens/` será criada automaticamente quando você conectar uma sessão do WhatsApp pela primeira vez.

## 🎨 Configuração do Frontend

### 1. Instalar dependências
```bash
cd "front sysZap"
npm install
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` na pasta `front sysZap/` com o seguinte conteúdo:

```env
# API Backend
VITE_API_URL=http://localhost:3000

# WebSocket
VITE_WS_URL=ws://localhost:3000
```

**Para acesso em rede local**, use o IP da sua máquina:
```env
VITE_API_URL=http://192.168.1.XXX:3000
VITE_WS_URL=ws://192.168.1.XXX:3000
```

### 3. Iniciar o frontend
```bash
# Modo desenvolvimento
npm run dev

# Ou compilar para produção
npm run build
npm run preview
```

## 📦 O que foi incluído no Git

✅ **Código fonte** (`src/`)
✅ **Configurações** (`package.json`, `tsconfig.json`, etc.)
✅ **Esquema do banco** (`prisma/schema.prisma`)
✅ **Migrations** (`prisma/migrations/`)
✅ **Documentação** (`*.md`)
✅ **Scripts de configuração** (`*.ps1`)

## 🚫 O que NÃO está no Git (será criado localmente)

❌ `node_modules/` - Instale com `npm install`
❌ `dist/` - Gerado com `npm run build`
❌ `tokens/` - Criado automaticamente ao conectar WhatsApp
❌ `.env` - Você precisa criar manualmente (veja acima)
❌ Bibliotecas de terceiros (`whatsapp-web.js/`, `wppconnect/`)

## 🔐 Segurança

⚠️ **NUNCA** commite:
- Arquivos `.env`
- Pasta `tokens/` (contém sessões do WhatsApp)
- Credenciais do banco de dados
- Chaves JWT

## 📚 Documentação Adicional

- `CONFIGURACAO_URLS.md` - Configuração de URLs e rede
- `GUIA_EXECUCAO_REDE.md` - Execução em rede local
- `WHATSAPP_INTEGRATION.md` - Integração com WhatsApp
- `PASSO-A-PASSO.md` - Guia detalhado

## 🆘 Problemas Comuns

### Erro de conexão com banco de dados
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`

### Frontend não conecta no backend
- Verifique se o backend está rodando na porta 3000
- Confirme as URLs no arquivo `.env` do frontend

### Erro ao conectar WhatsApp
- A pasta `tokens/` deve ter permissões de escrita
- Verifique se não há firewall bloqueando

## 🎯 Ordem de execução

1. Configure o banco de dados PostgreSQL
2. Configure e inicie o **backend** primeiro
3. Configure e inicie o **frontend**
4. Acesse o sistema e faça login
5. Conecte uma sessão do WhatsApp

---

**Pronto!** Seu sistema está configurado e pronto para uso! 🎉

