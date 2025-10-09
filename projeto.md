Visão geral do projeto
Objetivo: Plataforma de atendimento via WhatsApp com multi-sessões (múlticos números por empresa), filas, tickets e histórico de mensagens.
Arquitetura: Frontend React (TypeScript) + Backend Node.js (API própria) integrando com WPPConnect (WhatsApp Web automation). Banco relacional com UUIDs e enums como inteiros.
Frontend (front sysZap)
Stack: React + TypeScript, Vite, TailwindCSS, React Router, Context API.
Estado atual: usa dados mockados (src/data/*) e fluxo de autenticação simulado (context/AuthContext.tsx). Componentização para layout (Sidebar, Header), páginas (Tickets, etc.) e rotas protegidas.
Próxima etapa: substituir mocks por chamadas HTTP ao backend (REST/WebSocket). Autenticação via token (Bearer). Renderizar QR para login de sessões (SVG/PNG) e estados de sessão (aguardando QR, conectado, erro...).
Backend (a criar) com WPPConnect
Papel: encapsular WPPConnect em uma API REST/WebSocket consumida pelo front. Não expor WPPConnect direto no browser.
Principais responsabilidades:
Gerenciar sessões (criar/ler/encerrar, QR, reconexão, heartbeats).
Enviar/receber mensagens (texto e mídia), sincronizar chats.
Processar webhooks/eventos do WPPConnect (mensagens recebidas, acks, mudanças de estado).
Persistir entidades de negócio (empresas, clientes, tickets) e histórico (mensagens, mídia, logs).
Sessões:
Multi-sessões por empresa (números distintos).
Estados como inteiros: CONNECTED(0), DISCONNECTED(1), WAITING_QR(2), AUTHENTICATING(3), SYNCING(4), ERROR(5).
Armazenar QR (como SVG ou texto base para render), Session_Token, Last_Heartbeat.
Mensageria:
Direção IN/OUT, tipos (texto, mídia, etc.), status (QUEUED, SENT, DELIVERED, READ, FAILED).
Controle assíncrono via Outbox (opcional, recomendado para robustez e escala).
Modelo de dados (relacional)
Padrões globais:
PKs e FKs com UUID.
Enums armazenados como int (mapa de valores mantido no código/documentação).
Particionamento lógico por Company_Id (quase todas as tabelas possuem Company_Id).
Tabelas chave e função:
Companies: cadastro de empresas (inclui CNPJ único).
Users: usuários do sistema, vínculo opcional a empresa (admins globais).
Clients: contatos/cliente final do WhatsApp por empresa (número, WA_User_Id).
Queues: filas de atendimento (Vendas/Suporte), greeting.
Categories: classificação de tickets.
Tickets: atendimentos (cliente, agente, fila/categoria, SLA/priority).
Sessions: sessões de WhatsApp por empresa (estado, QR, webhook, heartbeat).
Chats: conversas (privadas/grupos) por sessão (WA_Chat_Id, tipo, unread).
Messages: mensagens por chat/sessão (direção, tipo, status, mídia, metadados).
Message_Status_History: trilha de mudanças de status por mensagem.
Media: arquivos (provider, chave de storage, mime, hash).
Webhook_Events: eventos brutos do WPPConnect (para auditoria/reprocesso).
Outbox: fila de envio assíncrono (idempotência, tentativas, next retry).
Session_Logs: logs operacionais por sessão (INFO/WARN/ERROR).
Índices recomendados:
Únicos: (Company_Id, Session_Id, WA_Message_Id) em Messages; (Company_Id, Session_Id, WA_Chat_Id) em Chats; (Company_Id, Phone_Number) em Sessions; (Company_Id, WhatsApp_Number) em Clients; Outbox(Idempotency_Key); Companies(CNPJ).
Performance: Messages(Chat_Id, Created_At DESC), Chats(Session_Id, Last_Message_At DESC).
API design (sugestão de endpoints)
Sessões:
POST /sessions → cria sessão e retorna dados + QR (SVG/PNG/base64).
GET /sessions / GET /sessions/:id → status/heartbeat.
DELETE /sessions/:id → encerra sessão.
Chats/Mensagens:
GET /sessions/:id/chats → lista conversas.
GET /chats/:chatId/messages (paginação asc/desc, cursor).
POST /messages → envia (body: sessionId, to ou chatId, conteúdo).
Upload de mídia: POST /media (retorna Media_Id), usar no POST /messages.
Tickets:
CRUD básico e ações (abrir/atribuir/fechar).
Webhooks:
POST /webhooks/wppconnect → evento bruto; pipeline atualiza Chats, Messages, Message_Status_History, Clients.
Autenticação:
JWT (Bearer) simples para front; escopos por empresa; rate limit.
Fluxos críticos
Onboarding de sessão: criar sessão → exibir QR → confirmar CONNECTED → sincronizar chats recentes → iniciar listener de eventos.
Recebimento de mensagem: webhook → persistir Clients/Chats/Messages → atualizar contadores/unread → notificar front (WebSocket/SSE).
Envio de mensagem:
Sincrono (simples): API → WPPConnect → gravar Messages/status.
Com Outbox (robusto): API → Outbox(PENDING) → worker envia → atualiza Messages/status e Outbox.
Observabilidade e confiabilidade
Logs: Session_Logs + agregação (stdout, Loki/ELK).
Métricas: mensagens por minuto, latências de envio, taxa de erro, status por sessão.
Retries/Backoff: Outbox (exponencial/linear), DLQ opcional.
Idempotência: Outbox.Idempotency_Key (e/ou cabeçalhos Idempotency-Key na API).
Segurança e compliance
Proteção da API: JWT com escopos; CORS restrito; rate limit & IP allowlist (opcional).
Armazenamento de mídia: preferir S3/GCS/Azure, assinar URLs; evitar servir arquivos brutos sem auth.
LGPD: data minimization, retenção configurável, exclusão por empresa, audit trails.
CNPJ: armazenado como CHAR(14) sem máscara; validação de DV; índice único.
Deploy e ambiente
Container: Docker para backend + WPPConnect, com Chrome/Playwright/Puppeteer conforme necessidade.
Variáveis de ambiente: PORT, DB_URL, STORAGE_PROVIDER/KEYS, JWT_SECRET, WPPCONNECT_OPTS (proxy, headless), WEBHOOK_URL.
Escala:
Sessions são com state; cada processo/worker precisa manter contexto por sessão (sharding por Session_Id).
Use uma store compartilhada (Redis/DB) para distribuir trabalho de Outbox e deduplicação.
Diagrama (classes/relacionamentos)
Já fornecido em Mermaid com CNPJ em Companies, UUIDs e enums como int. Use o Mermaid Live Editor para renderizar em SVG e documentar.
Como o front interage
Substitui mocks por chamadas GET/POST aos endpoints acima.
Autenticado com Bearer token; headers com empresa/escopo.
Atualizações em tempo real por WebSocket/SSE (novas mensagens/estados de sessão).
Upload de mídia via endpoint dedicado; enviar mensagem referenciando Media_Id.
Em resumo: front React consome sua API; backend orquestra WPPConnect e persiste tudo com robustez (sessions, chats, messages, tickets), usando UUIDs e enums como inteiros, com capacidade para multi-sessões e escala.