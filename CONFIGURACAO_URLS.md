# 🎯 Configuração de URLs Centralizada

## ✅ PROBLEMA RESOLVIDO

Antes, as URLs estavam **mockadas** (hardcoded) em vários arquivos diferentes:
- ❌ `WhatsAppMessages.tsx` → `http://localhost:3000`
- ❌ `AllMessages.tsx` → `http://localhost:3000`
- ❌ `WhatsAppSessions.tsx` → `http://localhost:3000`
- ❌ `AuthContext.tsx` → `http://localhost:3000` (em mensagens de erro)
- ✅ `api.ts` → Já usava variável de ambiente
- ✅ `websocketService.ts` → Já usava variável de ambiente

---

## 📁 SOLUÇÃO IMPLEMENTADA

### 1️⃣ Arquivo de Configuração Único

Foi criado o arquivo **`front sysZap/src/config/env.ts`** que centraliza **TODAS** as configurações de URLs:

```typescript
/**
 * Configuração Centralizada de URLs e Variáveis de Ambiente
 * 
 * Este é o ÚNICO arquivo que deve conter configurações de URLs.
 * Todos os outros arquivos devem importar deste arquivo.
 */

// URL base da API (Backend)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// URL do WebSocket
export const getWebSocketURL = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = API_BASE_URL.replace('http://', '').replace('https://', '');
  return `${protocol}//${host}/ws`;
};

// Exportar configurações
export const config = {
  API_BASE_URL,
  WEBSOCKET_URL: getWebSocketURL(),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
```

### 2️⃣ Arquivos Atualizados

Todos os arquivos que tinham URLs hardcoded foram atualizados para usar o arquivo de configuração:

✅ **`src/services/api.ts`**
```typescript
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
  // ...
});
```

✅ **`src/services/websocketService.ts`**
```typescript
import { getWebSocketURL } from '../config/env';

connect(companyId?: string, userId?: string): void {
  let url = getWebSocketURL();
  // ...
}
```

✅ **`src/pages/WhatsAppMessages.tsx`**
```typescript
import { API_BASE_URL } from '../config/env';

const response = await fetch(`${API_BASE_URL}/sessions`, {
  // ...
});
```

✅ **`src/pages/admin/AllMessages.tsx`**
```typescript
import { API_BASE_URL } from '../../config/env';

const response = await fetch(`${API_BASE_URL}/companies/${companyId}/chats`, {
  // ...
});
```

✅ **`src/pages/admin/WhatsAppSessions.tsx`**
```typescript
import { API_BASE_URL } from '../../config/env';

const response = await fetch(`${API_BASE_URL}/sessions`, {
  // ...
});
```

✅ **`src/context/AuthContext.tsx`**
```typescript
import { API_BASE_URL } from '../config/env';

toast.error(`❌ Erro de conexão! Backend não está respondendo. Verifique se está rodando em ${API_BASE_URL}`);
```

### 3️⃣ Documentação Criada

Foi criado o arquivo **`front sysZap/src/config/README.md`** com instruções completas sobre como usar a configuração centralizada.

---

## 🔧 COMO USAR

### Para Desenvolvimento Local

1. Não é necessário criar arquivo `.env` (usará o valor padrão `http://localhost:3000`)

**OU**

2. Crie o arquivo `.env` no diretório `front sysZap`:
```bash
VITE_API_URL=http://localhost:3000
```

### Para Acessar na Rede Local

1. Descubra o IP da sua máquina (exemplo: `192.168.1.100`)
2. Crie o arquivo `.env` no diretório `front sysZap`:
```bash
VITE_API_URL=http://192.168.1.100:3000
```

3. Execute o sistema:
```bash
# No backend
npm run dev

# No frontend (em outro terminal)
npm run dev
```

---

## ✨ BENEFÍCIOS DA SOLUÇÃO

### 1. **Centralização**
- ✅ Um único lugar para configurar URLs
- ✅ Fácil de encontrar e modificar

### 2. **Manutenção**
- ✅ Mudanças feitas em um único arquivo
- ✅ Não precisa buscar em vários arquivos

### 3. **Flexibilidade**
- ✅ Usa variáveis de ambiente
- ✅ Fácil de configurar para diferentes ambientes (dev, prod, rede local)

### 4. **Segurança**
- ✅ Evita URLs hardcoded no código
- ✅ Valores sensíveis em variáveis de ambiente

### 5. **Deploy**
- ✅ Fácil de configurar para produção
- ✅ Apenas alterar uma variável de ambiente

---

## 🔍 VERIFICAÇÃO

Para verificar se todas as URLs foram centralizadas, execute no terminal:

```bash
cd "front sysZap"
grep -r "http://localhost:3000" src/
```

**Resultado esperado:** Apenas o arquivo `src/config/env.ts` deve aparecer (no valor padrão).

---

## 📝 REGRA DE OURO

### ⚠️ NUNCA MAIS USE URLs HARDCODED!

```typescript
// ❌ ERRADO
const response = await fetch('http://localhost:3000/sessions');

// ✅ CORRETO
import { API_BASE_URL } from '../config/env';
const response = await fetch(`${API_BASE_URL}/sessions`);
```

---

## 🎓 EXEMPLO COMPLETO

```typescript
// Importar configuração
import { API_BASE_URL, getWebSocketURL, config } from '../config/env';

// Usar em fetch
const sessions = await fetch(`${API_BASE_URL}/sessions`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Usar em WebSocket
const wsUrl = getWebSocketURL();
const ws = new WebSocket(wsUrl);

// Usar objeto config completo
console.log('Ambiente:', config.IS_DEV ? 'Desenvolvimento' : 'Produção');
console.log('API URL:', config.API_BASE_URL);
console.log('WebSocket URL:', config.WEBSOCKET_URL);
```

---

## 📊 RESUMO DAS MUDANÇAS

| Arquivo | Status | Mudança |
|---------|--------|---------|
| `config/env.ts` | ✅ **NOVO** | Arquivo de configuração centralizado |
| `config/README.md` | ✅ **NOVO** | Documentação completa |
| `services/api.ts` | ✅ **ATUALIZADO** | Usa `API_BASE_URL` |
| `services/websocketService.ts` | ✅ **ATUALIZADO** | Usa `getWebSocketURL()` |
| `pages/WhatsAppMessages.tsx` | ✅ **ATUALIZADO** | Usa `API_BASE_URL` |
| `pages/admin/AllMessages.tsx` | ✅ **ATUALIZADO** | Usa `API_BASE_URL` |
| `pages/admin/WhatsAppSessions.tsx` | ✅ **ATUALIZADO** | Usa `API_BASE_URL` |
| `context/AuthContext.tsx` | ✅ **ATUALIZADO** | Usa `API_BASE_URL` em mensagens |

---

## ✅ TUDO PRONTO!

Agora você tem:
1. ✅ Um único arquivo de configuração (`config/env.ts`)
2. ✅ Todos os arquivos usando essa configuração
3. ✅ Documentação completa
4. ✅ Flexibilidade para diferentes ambientes
5. ✅ Código mais limpo e manutenível

**Sem erros de lint! 🎉**

---

## 📞 PRÓXIMOS PASSOS

1. Para testar localmente:
   ```bash
   # Backend
   cd back
   npm run dev

   # Frontend (novo terminal)
   cd "front sysZap"
   npm run dev
   ```

2. Para testar na rede:
   - Crie o arquivo `.env` no diretório `front sysZap`
   - Adicione: `VITE_API_URL=http://SEU_IP:3000`
   - Execute normalmente

---

**🎯 Missão cumprida! Agora você tem uma configuração de URLs centralizada e profissional!**

