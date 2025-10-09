# 🚀 Guia de Execução - Backend e Frontend em Rede Local

Este guia mostra como executar o sistema SysZap e disponibilizá-lo para acesso em sua rede local.

## 📋 Pré-requisitos

- Node.js instalado (versão 16 ou superior)
- npm ou yarn
- Git (opcional)

## 🔧 Configuração Inicial

### 1. Descobrir o IP da sua máquina

**Windows:**
```powershell
ipconfig
```
Procure por "Endereço IPv4" na sua interface de rede ativa (geralmente WiFi ou Ethernet).
Exemplo: `192.168.1.100`

**Linux/Mac:**
```bash
ifconfig
# ou
ip addr show
```

### 2. Configurar o Backend

```powershell
cd back

# Copiar arquivo de exemplo (se não tiver .env)
copy .env.example .env

# Instalar dependências (se ainda não instalou)
npm install

# Gerar cliente Prisma
npx prisma generate

# Executar migrações do banco
npx prisma migrate dev
```

**Nota:** O backend já está configurado para aceitar conexões de qualquer IP (`0.0.0.0:3000`)

### 3. Configurar o Frontend

```powershell
cd "front sysZap"

# Criar arquivo .env
echo VITE_API_URL=http://SEU_IP_AQUI:3000 > .env
```

**IMPORTANTE:** Substitua `SEU_IP_AQUI` pelo IP que você descobriu no passo 1.

Exemplo:
```
VITE_API_URL=http://192.168.1.100:3000
```

Se você também copiar o arquivo de exemplo:
```powershell
copy .env.example .env
# E depois edite o .env com seu IP
```

```powershell
# Instalar dependências (se ainda não instalou)
npm install
```

## ▶️ Executando o Sistema

### Opção 1: Executar em terminais separados (Recomendado)

**Terminal 1 - Backend:**
```powershell
cd back
npm run dev
```

Aguarde até ver:
```
🚀 Servidor rodando em http://localhost:3000
📚 Documentação em http://localhost:3000/docs
```

**Terminal 2 - Frontend:**
```powershell
cd "front sysZap"
npm run dev
```

Aguarde até ver algo como:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### Opção 2: Script único (Windows PowerShell)

Você pode criar um script para iniciar ambos. Crie um arquivo `start-all.ps1`:

```powershell
# start-all.ps1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd back; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'front sysZap'; npm run dev"
```

Execute:
```powershell
.\start-all.ps1
```

## 🌐 Acessando de Outros Dispositivos

### No mesmo computador:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Documentação API: http://localhost:3000/docs

### De outros dispositivos na mesma rede:
- Frontend: http://SEU_IP:5173
- Backend: http://SEU_IP:3000
- Documentação API: http://SEU_IP:3000/docs

**Exemplo (se seu IP for 192.168.1.100):**
- Frontend: http://192.168.1.100:5173
- Backend: http://192.168.1.100:3000

## 🔥 Configurações de Firewall

Se não conseguir acessar de outros dispositivos, pode ser necessário liberar as portas no firewall:

**Windows:**
```powershell
# Liberar porta 3000 (Backend)
New-NetFirewallRule -DisplayName "SysZap Backend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# Liberar porta 5173 (Frontend)
New-NetFirewallRule -DisplayName "SysZap Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

Ou manualmente:
1. Abra "Firewall do Windows Defender"
2. Clique em "Configurações avançadas"
3. Clique em "Regras de Entrada" → "Nova Regra"
4. Selecione "Porta" → TCP → Portas específicas: `3000` e `5173`
5. Selecione "Permitir conexão"

## 🛠️ Solução de Problemas

### Backend não inicia:
- Verifique se a porta 3000 não está em uso
- Execute: `npx prisma generate`
- Verifique se o arquivo `.env` existe (pode criar vazio)

### Frontend não conecta ao backend:
- Verifique se o arquivo `.env` no frontend tem o IP correto
- Verifique se o backend está rodando
- Teste acessar: http://SEU_IP:3000/health

### Não consegue acessar de outros dispositivos:
- Verifique se está na mesma rede WiFi/Ethernet
- Verifique as regras de firewall
- Tente desabilitar temporariamente o firewall para testar
- No Windows: `Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False`
  (Lembre-se de reativar depois!)

### Erro de CORS:
- O backend já está configurado com `origin: true`, deve aceitar qualquer origem
- Se persistir, edite `back/src/server.ts` linha 26

## 📱 Testando em Dispositivos Móveis

1. Conecte seu celular/tablet na mesma rede WiFi
2. Abra o navegador
3. Acesse: http://SEU_IP:5173
4. Pronto! Você pode testar o sistema no mobile

## 🔒 Notas de Segurança

⚠️ **ATENÇÃO:** Esta configuração é apenas para desenvolvimento/testes locais!

Para produção:
- Configure HTTPS
- Configure CORS adequadamente
- Use variáveis de ambiente seguras
- Configure um reverse proxy (nginx, caddy)
- Não exponha diretamente à internet sem segurança adequada

## 📊 Monitoramento

Enquanto o sistema está rodando, você pode:
- Ver logs em tempo real nos terminais
- Acessar a documentação da API: http://SEU_IP:3000/docs
- Verificar health check: http://SEU_IP:3000/health

## 🛑 Parando o Sistema

Pressione `Ctrl + C` em cada terminal onde o backend e frontend estão rodando.

---

## 🎯 Resumo Rápido

```powershell
# 1. Descobrir IP
ipconfig

# 2. Configurar Frontend
cd "front sysZap"
echo VITE_API_URL=http://192.168.1.100:3000 > .env  # Use seu IP!
npm install

# 3. Backend (Terminal 1)
cd back
npm install
npx prisma generate
npm run dev

# 4. Frontend (Terminal 2)
cd "front sysZap"
npm run dev

# 5. Acessar
# Local: http://localhost:5173
# Rede: http://192.168.1.100:5173
```

**Pronto! 🎉 Seu sistema está rodando e acessível na rede!**
