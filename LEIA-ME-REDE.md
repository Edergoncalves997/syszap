# 🚀 Guia Rápido - Rodar Backend e Frontend em Rede Local

## 📝 Passo a Passo Simplificado

### 🎯 Forma Automática (Recomendado)

#### 1️⃣ Configure o sistema para rede local:
```powershell
.\configurar-rede.ps1
```
Este script irá:
- Descobrir automaticamente o IP da sua máquina
- Criar os arquivos `.env` necessários
- Configurar tudo para acesso em rede

#### 2️⃣ Inicie o Backend e Frontend:
```powershell
.\iniciar-sistema.ps1
```
Este script irá:
- Instalar dependências automaticamente (se necessário)
- Configurar o Prisma
- Abrir 2 janelas: uma para o Backend e outra para o Frontend

#### 3️⃣ (Opcional) Libere o Firewall:
```powershell
# Executar como Administrador!
.\liberar-firewall.ps1
```

---

### 🔧 Forma Manual

Se preferir fazer manualmente:

#### 1. Descubra seu IP:
```powershell
ipconfig
```
Procure por "Endereço IPv4" (exemplo: 192.168.1.100)

#### 2. Configure o Backend:
```powershell
cd back

# Crie o arquivo .env com:
# PORT=3000
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="seu-secret-aqui"

npm install
npx prisma generate
```

#### 3. Configure o Frontend:
```powershell
cd "front sysZap"

# Crie o arquivo .env com:
# VITE_API_URL=http://SEU_IP_AQUI:3000

npm install
```

#### 4. Execute o Backend (Terminal 1):
```powershell
cd back
npm run dev
```

#### 5. Execute o Frontend (Terminal 2):
```powershell
cd "front sysZap"
npm run dev
```

---

## 🌐 Como Acessar

### No seu computador:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Documentação API: http://localhost:3000/docs

### De outros dispositivos na rede (celular, tablet, outro PC):
- Frontend: http://SEU_IP:5173
- Backend: http://SEU_IP:3000

**Exemplo:** Se seu IP for `192.168.1.100`:
- Acesse: http://192.168.1.100:5173

---

## 🔥 Problema com Firewall?

Se não conseguir acessar de outros dispositivos:

### Opção 1 - Script Automático:
```powershell
# Clique com botão direito e "Executar como Administrador"
.\liberar-firewall.ps1
```

### Opção 2 - Manual:
1. Abra "Firewall do Windows Defender"
2. Clique em "Configurações avançadas"
3. "Regras de Entrada" → "Nova Regra"
4. Tipo: Porta → TCP → Portas: `3000, 5173`
5. Ação: Permitir conexão

---

## ⚙️ Estrutura dos Arquivos Criados

```
whatsapp/
├── configurar-rede.ps1      ← Configura IPs e cria .env
├── iniciar-sistema.ps1       ← Inicia backend + frontend
├── liberar-firewall.ps1      ← Libera portas no firewall
├── back/
│   └── .env                  ← Criado automaticamente
└── front sysZap/
    └── .env                  ← Criado automaticamente
```

---

## 📱 Testando no Celular

1. Conecte o celular na **mesma rede WiFi**
2. No navegador, acesse: `http://SEU_IP:5173`
3. Pronto! 🎉

---

## 🛑 Para Parar o Sistema

Pressione `Ctrl + C` em cada janela de terminal (Backend e Frontend)

---

## ❓ Problemas Comuns

### "Não consigo acessar de outro dispositivo"
- ✅ Verifique se estão na mesma rede WiFi
- ✅ Execute o script de firewall como administrador
- ✅ Confirme que o IP está correto

### "Backend não inicia"
- ✅ Execute: `cd back` e `npx prisma generate`
- ✅ Verifique se a porta 3000 não está em uso

### "Frontend não conecta ao backend"
- ✅ Verifique se o arquivo `front sysZap\.env` tem o IP correto
- ✅ Confirme que o backend está rodando

---

## 🎯 Resumo Ultra-Rápido

```powershell
# Execute estes 2 comandos:
.\configurar-rede.ps1
.\iniciar-sistema.ps1

# Acesse: http://localhost:5173
# Ou de outro dispositivo: http://SEU_IP:5173
```

**Pronto! 🚀**

