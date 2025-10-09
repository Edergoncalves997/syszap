# 🎯 PASSO A PASSO - Como Rodar o Sistema

## Opção 1: SUPER RÁPIDO (2 comandos apenas!)

### 1. Abra o PowerShell nesta pasta e execute:

```powershell
.\configurar-rede.ps1
```

**O que este comando faz:**
- Descobre automaticamente o IP da sua máquina
- Cria o arquivo `.env` no backend
- Cria o arquivo `.env` no frontend com seu IP
- Mostra as URLs que você vai usar

### 2. Depois execute:

```powershell
.\iniciar-sistema.ps1
```

**O que este comando faz:**
- Instala as dependências (se necessário)
- Configura o banco de dados
- Abre 2 janelas: Backend (azul) e Frontend (amarelo)
- Inicia tudo automaticamente!

### 3. Pronto! Acesse no navegador:
- No seu PC: `http://localhost:5173`
- No celular/outro PC: `http://SEU_IP:5173`

---

## Opção 2: MANUAL (se preferir fazer passo a passo)

### Passo 1: Descubra seu IP
```powershell
ipconfig
```
Procure por **"Endereço IPv4"** (exemplo: 192.168.1.100)

### Passo 2: Crie o arquivo .env no Backend
```powershell
cd back
```

Crie um arquivo chamado `.env` com este conteúdo:
```
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="seu-secret-aqui"
```

### Passo 3: Crie o arquivo .env no Frontend
```powershell
cd "front sysZap"
```

Crie um arquivo chamado `.env` com este conteúdo (USE SEU IP!):
```
VITE_API_URL=http://192.168.1.100:3000
```
⚠️ **IMPORTANTE:** Troque `192.168.1.100` pelo SEU IP!

### Passo 4: Instale as dependências do Backend
```powershell
cd back
npm install
npx prisma generate
```

### Passo 5: Instale as dependências do Frontend
```powershell
cd "front sysZap"
npm install
```

### Passo 6: Inicie o Backend (em um terminal)
```powershell
cd back
npm run dev
```
Deixe este terminal aberto!

### Passo 7: Inicie o Frontend (em OUTRO terminal)
```powershell
cd "front sysZap"
npm run dev
```
Deixe este terminal aberto também!

---

## 📱 Como testar no celular?

1. Conecte o celular na **mesma rede WiFi** do computador
2. Abra o navegador do celular
3. Digite: `http://SEU_IP:5173` (exemplo: `http://192.168.1.100:5173`)

---

## 🔥 Problema: "Não consigo acessar de outro dispositivo"

Execute como **Administrador**:
```powershell
.\liberar-firewall.ps1
```

Ou libere manualmente:
1. Abra "Firewall do Windows"
2. "Configurações avançadas"
3. "Regras de Entrada" → "Nova Regra"
4. Porta TCP: `3000` e `5173`
5. Permitir conexão

---

## ❓ Perguntas Frequentes

**Q: Preciso instalar algo antes?**
A: Sim, você precisa ter o Node.js instalado. Baixe em: https://nodejs.org

**Q: Como paro o sistema?**
A: Pressione `Ctrl + C` nas janelas do Backend e Frontend

**Q: Preciso fazer isso toda vez?**
A: Não! Depois da primeira vez, só precisa executar `.\iniciar-sistema.ps1`

**Q: Posso usar apenas localmente?**
A: Sim! No frontend, use `VITE_API_URL=http://localhost:3000` no arquivo `.env`

---

## 🎯 RESUMÃO

```powershell
# Primeira vez:
.\configurar-rede.ps1
.\iniciar-sistema.ps1

# Próximas vezes:
.\iniciar-sistema.ps1
```

**É isso! Simples assim! 🚀**

