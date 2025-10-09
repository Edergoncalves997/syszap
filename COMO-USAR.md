# 🚀 Guia de Início Rápido - Sys3 Atendimento

## 📋 Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn

## 🔧 Instalação

1. **Instalar as dependências:**
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Acessar o sistema:**
   - Abra seu navegador em: `http://localhost:5173`

## 🔐 Credenciais de Teste

### Administrador
- **Email:** `admin@sys3.com`
- **Senha:** `123`
- **Acesso:** Todas as funcionalidades

### Gerente
- **Email:** `carlos@techplus.com`
- **Senha:** `123`
- **Acesso:** Gerenciar empresa TechPlus

### Usuário
- **Email:** `joao@sys3.com`
- **Senha:** `123`
- **Acesso:** Seus próprios chamados

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Sidebar.tsx     # Menu lateral
│   ├── Header.tsx      # Cabeçalho
│   ├── Modal.tsx       # Janelas modais
│   ├── CompanyCard.tsx # Card de empresa
│   ├── UserTable.tsx   # Tabela de usuários
│   ├── TicketList.tsx  # Lista de chamados
│   ├── ChatPanel.tsx   # Painel de chat
│   └── ClientDetails.tsx # Detalhes do cliente
├── pages/              # Páginas do sistema
│   ├── Login.tsx       # Tela de login
│   ├── admin/          # Páginas administrativas
│   │   ├── Dashboard.tsx
│   │   ├── Companies.tsx
│   │   └── Users.tsx
│   ├── Tickets.tsx     # Atendimentos
│   ├── Clients.tsx     # Clientes
│   ├── Reports.tsx     # Relatórios
│   └── Settings.tsx    # Configurações
├── context/            # Context API
│   └── AuthContext.tsx # Autenticação e estado global
├── data/               # Dados mockados
│   ├── mockCompanies.ts
│   ├── mockUsers.ts
│   ├── mockTickets.ts
│   └── mockClients.ts
├── App.tsx             # Configuração de rotas
├── main.tsx            # Entry point
└── index.css           # Estilos globais
```

## 🎯 Funcionalidades Principais

### Para Administradores
- ✅ Dashboard completo com visão geral
- ✅ Gerenciar empresas cadastradas
- ✅ Adicionar/editar/excluir empresas
- ✅ Testar conexões WhatsApp
- ✅ Gerenciar usuários de todas as empresas
- ✅ Visualizar todos os chamados
- ✅ Relatórios globais

### Para Gerentes
- ✅ Visualizar todos os chamados da empresa
- ✅ Gerenciar clientes da empresa
- ✅ Relatórios da empresa
- ✅ Configurações de perfil

### Para Usuários
- ✅ Visualizar seus próprios chamados
- ✅ Chat em tempo real (mockado)
- ✅ Gerenciar clientes
- ✅ Relatórios básicos

## 🎨 Design e UI

- **Cores principais:**
  - Azul primário: `#337EEF`
  - Azul claro: `#71AEF7`
  - Cinza neutro: `#F2F4F7`

- **Fontes:** Inter e Poppins

- **Componentes:**
  - Cards com sombras suaves
  - Cantos arredondados
  - Indicadores de status coloridos (🟢 🟡 🔴)
  - Design responsivo

## 🔄 Fluxo de Uso

1. **Login:** Escolha uma credencial de teste
2. **Redirecionamento:** Sistema redireciona conforme o nível de acesso
3. **Navegação:** Use o menu lateral para acessar as funcionalidades
4. **Operações:** Todas as operações são mockadas (não há backend)

## 🛠️ Próximos Passos (Integração Backend)

Para integrar com um backend real:

1. Substituir as funções do `AuthContext.tsx` por chamadas de API
2. Implementar autenticação JWT
3. Conectar com APIs REST ou GraphQL
4. Adicionar WebSocket para chat em tempo real
5. Implementar upload de arquivos
6. Adicionar notificações push

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`.

## 🐛 Troubleshooting

### Porta já em uso
Se a porta 5173 estiver em uso, o Vite escolherá automaticamente outra porta.

### Erros de TypeScript
Execute `npm install` para garantir que todas as dependências estão instaladas.

### Hot Reload não funciona
Verifique se há firewalls bloqueando a conexão.

## 📞 Suporte

Sistema desenvolvido para demonstração de front-end multiempresa com React, TypeScript e TailwindCSS.

---

**Versão:** 1.0.0  
**Última atualização:** Outubro 2025

