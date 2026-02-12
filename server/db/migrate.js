import fs from "fs";
import path from "path";
import { getPool } from "./client.js";

const MIGRATIONS_DIR = path.join(process.cwd(), "server", "migrations");

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function getAppliedVersions(client) {
  const res = await client.query("SELECT version FROM schema_migrations ORDER BY version ASC");
  return res.rows.map((r) => r.version);
}

export async function runMigrations() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await ensureMigrationsTable(client);

    const files = getMigrationFiles();
    const applied = new Set(await getAppliedVersions(client));

    for (const file of files) {
      const match = file.match(/^(\d+)_.*\.sql$/);
      if (!match) continue;
      const version = Number(match[1]);
      if (applied.has(version)) continue;

      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, "utf8");
      console.log(`[migrate] Aplicando migração ${file}...`);
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [version]);
    }

    await client.query("COMMIT");
    console.log("[migrate] Migrações aplicadas com sucesso.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[migrate] Erro ao aplicar migrações:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Execução via CLI: node server/db/migrate.js
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

