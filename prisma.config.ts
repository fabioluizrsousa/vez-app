import "dotenv/config"
import { defineConfig } from "prisma/config"

// Prisma 7 tirou a connection string de dentro do schema.prisma — agora ela
// fica aqui. É esse arquivo que `prisma generate`, `prisma migrate dev` e
// `prisma db seed` leem; o app em si (app/_lib/prisma.ts) continua pegando
// DATABASE_URL direto do .env via o adapter do pg, sem depender deste arquivo.
//
// `process.env.DATABASE_URL` direto (em vez do helper `env(...)` do Prisma)
// de propósito: `prisma generate` roda automaticamente no postinstall do
// `npm install`, antes de você ter copiado o .env.example pra .env — e
// generate só lê o schema, não precisa de conexão de verdade. O helper
// `env(...)` lança erro se a variável não existir; assim, sem ela, cai num
// valor de exemplo e o generate segue. `migrate dev`/`db seed`, que aí sim
// conectam de verdade, vão exigir a DATABASE_URL real do seu .env.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/db",
  },
})
