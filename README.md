# Sys3 Atendimento - Sistema Multiempresa

Sistema de atendimento de chamados via WhatsApp com gestão de empresas, usuários e permissões.

## Stack Técnica

- **Backend**: Node.js + Fastify + Prisma + PostgreSQL
- **Frontend**: React 18 com TypeScript
- **Estilos**: TailwindCSS
- **Roteamento**: React Router DOM
- **Estado**: Context API
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **WhatsApp**: WPPConnect

## 🚀 Instalação

### Linux/Ubuntu

Para instalação completa no Ubuntu/Linux, consulte o guia detalhado:

📖 **[INSTALL_LINUX.md](INSTALL_LINUX.md)** - Guia completo de instalação

Ou use o script automatizado:
```bash
bash install-linux.sh
```

### Desenvolvimento Local

```bash
# Backend
cd back
npm install
npm run dev

# Frontend
cd "front sysZap"
npm install
npm run dev
```

O sistema estará disponível em `http://localhost:5173`

## Credenciais de Teste

### Admin
- Email: `admin@sys3.com`
- Senha: `123`

### Manager
- Email: `carlos@techplus.com`
- Senha: `123`

### Usuário
- Email: `joao@sys3.com`
- Senha: `123`

## Estrutura de Permissões

### Admin
- Cadastrar empresas
- Gerenciar usuários de todas as empresas
- Visualizar status de conexões
- Acessar todas as funcionalidades

### Manager
- Gerenciar usuários da sua empresa
- Visualizar todos os atendimentos da empresa
- Acessar relatórios da empresa

### User
- Acessar apenas seus próprios chamados
- Visualizar clientes
- Acessar relatórios básicos

## Funcionalidades

- ✅ Login com controle de acesso por role
- ✅ Dashboard administrativo
- ✅ Gestão de empresas e conexões
- ✅ Gestão de usuários multiempresa
- ✅ Sistema de atendimentos (tickets)
- ✅ Cadastro de clientes
- ✅ Relatórios e dashboards
- ✅ Configurações de perfil

## Build para Produção

```bash
npm run build
```


