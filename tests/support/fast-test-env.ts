// Ensure a missed mock cannot silently query the developer database.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  "postgresql://test:test@127.0.0.1:1/unavailable_test";
process.env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
process.env.TWO_FACTOR_ENABLED = "false";
// Vazio (dotenv não sobrescreve) para os testes nunca enviarem e-mail real,
// mesmo com SMTP_HOST definido no .env do desenvolvedor.
process.env.SMTP_HOST = "";
