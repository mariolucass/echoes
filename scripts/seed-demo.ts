/**
 * Cria (ou reinicia) a conta demo pública do Echoes com decisões de exemplo.
 *
 * Reinicia SEMPRE as decisões/tags da conta demo (nunca toca em outros usuários), então
 * rodar de novo "limpa" o que visitantes alteraram. A API também cria a conta sozinha no
 * primeiro clique em "Explorar com a conta demo"; este script serve para semear antes
 * ou restaurar.
 *
 * Variáveis (use as de produção para semear produção): DATABASE_URL, JWT_SECRET,
 * MONGODB_URI (se usar Mongo), DEMO_USER_EMAIL e DEMO_USER_PASSWORD (obrigatórias).
 *
 * Uso: pnpm seed:demo
 */
import { env } from "../src/config/env.ts";
import prisma from "../src/database/prisma.ts";
import { DemoAccountService } from "../src/services/identity/demo-account.service.ts";

if (!env.DEMO_USER_EMAIL || !env.DEMO_USER_PASSWORD) {
  console.error("Defina DEMO_USER_EMAIL e DEMO_USER_PASSWORD para semear a conta demo.");
  process.exit(1);
}

new DemoAccountService()
  .ensure({ reset: true })
  .then(({ created, seeded }) =>
    console.log(`${created ? "Conta demo criada" : "Conta demo já existia"}; ${seeded} decisões de exemplo.`),
  )
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
