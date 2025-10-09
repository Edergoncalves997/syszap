# 📱 Integração WhatsApp - WPPConnect

## 🎯 Visão Geral

Sistema completo de multi-sessões WhatsApp integrado com backend Fastify + Prisma.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - Interface de QR Code                                  │
│  - Envio de mensagens                                    │
│  - WebSocket para eventos em tempo real                  │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP + WebSocket
┌────────────────▼────────────────────────────────────────┐
│                  Backend (Fastify)                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │           WppManager (Singleton)                │    │
│  │  - Gerencia múltiplas sessões                   │    │
│  │  - Restaura sessões ao iniciar                  │    │
│  │  - Pool de SessionControllers                   │    │
│  └─────────────────┬───────────────────────────────┘    │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────────┐    │
│  │      SessionController (por sessão)             │    │
│  │  - Conecta com WhatsApp                         │    │
│  │  - Processa mensagens                           │    │
│  │  - Gera QR Code                                 │    │
│  │  - Envia mensagens                              │    │
│  └─────────────────┬───────────────────────────────┘    │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────────┐    │
│  │         WPPConnect Library                      │    │
│  │  - Cliente WhatsApp Web                         │    │
│  │  - Puppeteer + Chrome                           │    │
│  └─────────────────┬───────────────────────────────┘    │
└────────────────────┼─────────────────────────────────────┘
                     │
         ┌───────────▼──────────────┐
         │   WhatsApp Servers       │
         └──────────────────────────┘
```

## 📡 Endpoints WhatsApp

### 1. **POST** `/whatsapp/sessions/:id/start`
Inicia uma sessão WhatsApp e gera QR Code.

**Request:**
```http
POST /whatsapp/sessions/uuid-da-sessao/start
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Sessão iniciada com sucesso",
  "status": "qr",
  "qrCode": "data:image/png;base64,..."
}
```

**Estados:**
- `connecting` - Conectando ao WhatsApp
- `qr` - QR Code gerado, aguardando leitura
- `connected` - Conectado e pronto
- `disconnected` - Desconectado

---

### 2. **GET** `/whatsapp/sessions/:id/qr`
Obtém o QR Code atual da sessão.

**Response:**
```json
{
  "qrCode": "data:image/png;base64,..."
}
```

**Erros:**
- `404` - QR Code não disponível
- `410` - QR Code expirado (1 minuto)

---

### 3. **GET** `/whatsapp/sessions/:id/status`
Verifica status da sessão.

**Response:**
```json
{
  "sessionId": "uuid",
  "status": "connected",
  "isConnected": true
}
```

---

### 4. **POST** `/whatsapp/sessions/:id/stop`
Desconecta sessão WhatsApp.

**Response:**
```json
{
  "message": "Sessão desconectada com sucesso"
}
```

---

### 5. **POST** `/whatsapp/messages/send`
Envia mensagem de texto.

**Request:**
```json
{
  "sessionId": "uuid-da-sessao",
  "to": "5511999999999",
  "message": "Olá! Como posso ajudar?"
}
```

**Response:**
```json
{
  "message": "Mensagem enviada com sucesso",
  "result": {
    "id": "message-id-wpp",
    "to": "5511999999999@c.us"
  }
}
```

**Formato do número:**
- Com `@c.us`: `5511999999999@c.us`
- Sem `@c.us`: `5511999999999` (será adicionado automaticamente)

---

### 6. **GET** `/whatsapp/sessions/:id/chats`
Lista todos os chats ativos da sessão.

**Response:**
```json
{
  "chats": [
    {
      "id": "5511999999999@c.us",
      "name": "João Silva",
      "lastMessageTime": 1234567890,
      "unreadCount": 3
    }
  ]
}
```

---

### 7. **GET** `/whatsapp/sessions/:id/chats/:chatId/messages`
Busca mensagens de um chat específico.

**Query params:**
- `limit` (opcional): Número de mensagens (padrão: 50, max: 200)

**Response:**
```json
{
  "messages": [...],
  "total": 50
}
```

---

### 8. **GET** `/whatsapp/stats`
Estatísticas gerais de todas as sessões.

**Response:**
```json
{
  "total": 5,
  "connected": 3,
  "disconnected": 2,
  "sessions": [
    { "id": "uuid1", "status": "connected" },
    { "id": "uuid2", "status": "qr" }
  ]
}
```

---

## 🔌 WebSocket

### Conectar ao WebSocket:
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/whatsapp/uuid-da-sessao');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'status':
      console.log('Status:', data.data);
      break;
    case 'status_change':
      console.log('Status mudou:', data.data);
      break;
    case 'message':
      console.log('Nova mensagem:', data.data);
      break;
  }
};
```

**Eventos emitidos:**
- `status` - Status inicial ao conectar
- `status_change` - Quando status muda (connecting → qr → connected)
- `message` - Nova mensagem recebida

---

## 📋 Fluxo de Uso

### 1. **Criar Sessão no Banco**
```http
POST /sessions
{
  "Company_Id": "uuid-empresa",
  "Session_Name": "Atendimento Principal",
  "Phone_Number": "5511999999999",
  "Status": 0,
  "Session_Token": "token-unico"
}
```

### 2. **Iniciar Sessão WhatsApp**
```http
POST /whatsapp/sessions/:id/start
```
→ Retorna QR Code

### 3. **Exibir QR Code no Frontend**
```jsx
<img src={qrCode} alt="QR Code WhatsApp" />
```

### 4. **Escanear com WhatsApp**
- Abrir WhatsApp no celular
- Ir em "Dispositivos Vinculados"
- Escanear QR Code

### 5. **Aguardar Conexão**
- Status muda para `connected`
- Sessão pronta para uso

### 6. **Enviar Mensagens**
```http
POST /whatsapp/messages/send
{
  "sessionId": "uuid",
  "to": "5511999999999",
  "message": "Olá!"
}
```

---

## 🔄 Funcionalidades Automáticas

### ✅ **Auto-Save de Mensagens**
- Todas as mensagens recebidas são salvas automaticamente no PostgreSQL
- Tabela: `Messages`
- Inclui: texto, mídia, status, timestamp

### ✅ **Auto-Create de Chats**
- Novos chats são criados automaticamente
- Tabela: `Chats`
- Vincula com `Clients` automaticamente

### ✅ **Auto-Create de Clientes**
- Novos contatos são criados como clientes
- Tabela: `Clients`
- Extrai nome e número do WhatsApp

### ✅ **Status ACK**
- Status de entrega é atualizado automaticamente
- 0=ERROR, 1=PENDING, 2=SERVER, 3=DEVICE, 4=READ, 5=PLAYED

### ✅ **Restauração Automática**
- Ao reiniciar o servidor, sessões ativas são restauradas
- Reconecta automaticamente

### ✅ **Heartbeat**
- Atualiza `Last_Heartbeat` periodicamente
- Detecta sessões mortas

---

## 🎯 Multi-Sessão

**Suporte para:**
- ✅ Múltiplas empresas
- ✅ Múltiplos números por empresa
- ✅ Sessões isoladas por empresa
- ✅ Gerenciamento independente

**Exemplo:**
```
Empresa A:
  - Sessão 1: (11) 99999-9999 → Vendas
  - Sessão 2: (11) 88888-8888 → Suporte

Empresa B:
  - Sessão 3: (21) 77777-7777 → Atendimento
```

---

## 🔒 Segurança

- ✅ Todas as rotas requerem autenticação JWT
- ✅ Apenas ADMIN/MANAGER podem gerenciar sessões
- ✅ Tokens WhatsApp armazenados no servidor
- ✅ QR Code expira em 1 minuto
- ✅ Logs de todas as operações

---

## 📊 Dados Salvos Automaticamente

### `Sessions`
- Status da conexão
- QR Code (temporário)
- Token WhatsApp
- Último heartbeat

### `Chats`
- ID do chat WPP
- Última mensagem
- Contador de não lidas
- Tipo (individual/grupo)

### `Messages`
- Texto/mídia
- Direção (IN/OUT)
- Status de entrega
- Timestamp WhatsApp

### `Clients`
- Nome do contato
- Número WhatsApp
- Foto de perfil
- Último contato

### `Session_Logs`
- Eventos da sessão
- Erros e avisos
- Metadata JSON

---

## 🚀 Performance

- **Conexões Persistentes**: Sessões ficam ativas 24/7
- **Eventos Assíncronos**: WebSocket para atualizações em tempo real
- **Cache**: Sessões em memória (Map)
- **Lazy Loading**: Só conecta quando necessário

---

## ⚡ Próximas Melhorias (Opcional)

- [ ] Redis para cache de sessões
- [ ] BullMQ para fila de envio (Outbox)
- [ ] Webhook externo configurável
- [ ] Backup de sessões
- [ ] Métricas e monitoramento
- [ ] Rate limiting por sessão
- [ ] Envio de mídia (imagem, áudio, vídeo)
- [ ] Grupos
- [ ] Enquetes
- [ ] Botões interativos

---

## 🎉 Status

✅ **100% Funcional!**
- Multi-sessão ativo
- QR Code working
- Envio/recebimento de mensagens
- WebSocket events
- Auto-save no banco
- Restauração automática

