import pg from "pg";
import { getEffectiveDatabaseUrl } from "../config/installState.js";

const { Pool } = pg;

let pool;

export function getPool(customUrl) {
  if (pool) return pool;

  const databaseUrl = customUrl || getEffectiveDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL não configurada. Execute o fluxo de instalação em /install.");
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pool.on("error", (err) => {
    console.error("[db] Erro inesperado no pool:", err.message);
  });

  return pool;
}

export async function testConnection(databaseUrl) {
  const testPool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await testPool.query("SELECT 1");
    return { ok: true };
  } catch (err) {
    const safeMessage = translateDbError(err);
    return { ok: false, error: safeMessage };
  } finally {
    await testPool.end();
  }
}

function translateDbError(err) {
  // Não expor detalhes sensíveis
  if (err.code === "28P01") return "Credenciais inválidas para o banco de dados.";
  if (err.code === "3D000") return "Banco de dados não existe.";
  if (err.code === "28000") return "Acesso ao banco de dados negado.";
  return "Falha ao conectar ao banco de dados. Verifique host, porta e credenciais.";
}

export async function withClient(fn) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

