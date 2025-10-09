# Backend (Node + Prisma)

1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`.
2. Rode `npx prisma migrate dev --name init` para criar as tabelas.
3. Gere o client: `npx prisma generate`.

Estrutura de IDs e Enums:
- IDs são UUIDs.
- Enums são inteiros mapeados no código.


