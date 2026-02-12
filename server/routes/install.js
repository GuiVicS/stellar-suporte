import express from "express";
import { saveInstallConfig, isInstalled, getSchemaVersion } from "../config/installState.js";
import { testConnection } from "../db/client.js";
import { runMigrations } from "../db/migrate.js";
import { runSeed } from "../db/seed.js";

const router = express.Router();

function buildDatabaseUrl(body) {
  if (body.databaseUrl) return body.databaseUrl;
  const {
    host = "postgres",
    port = 5432,
    database = "app",
    user = "app",
    password = "app",
  } = body;
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(
    password
  )}@${host}:${port}/${database}`;
}

router.get("/status", (req, res) => {
  const installed = isInstalled();
  res.json({
    installed,
    schemaVersion: getSchemaVersion(),
  });
});

router.post("/test-connection", async (req, res) => {
  try {
    const databaseUrl = buildDatabaseUrl(req.body || {});
    const result = await testConnection(databaseUrl);
    if (result.ok) {
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false, error: result.error });
  } catch (err) {
    console.error("[install] Erro ao testar conexão:", err.message);
    return res.status(400).json({
      ok: false,
      error: "Falha ao testar conexão com o banco de dados.",
    });
  }
});

router.post("/apply", async (req, res) => {
  const steps = {
    test: null,
    migrate: null,
    seed: null,
    finalize: null,
  };

  try {
    const databaseUrl = buildDatabaseUrl(req.body || {});
    const adminEmail = req.body.adminEmail;
    const adminPassword = req.body.adminPassword;
    const adminName = req.body.adminName;

    // 1) Testar conexão
    const testResult = await testConnection(databaseUrl);
    if (!testResult.ok) {
      steps.test = { status: "error", message: testResult.error };
      return res.status(400).json({ ok: false, steps });
    }
    steps.test = { status: "ok" };

    // 2) Aplicar migrations
    process.env.DATABASE_URL = databaseUrl; // usa URL fornecida para as migrations
    try {
      await runMigrations();
      steps.migrate = { status: "ok" };
    } catch (err) {
      console.error("[install] Erro em migrations:", err.message);
      steps.migrate = {
        status: "error",
        message: "Erro ao aplicar migrations. Verifique logs do servidor.",
      };
      return res.status(500).json({ ok: false, steps });
    }

    // 3) Seed
    try {
      await runSeed({ adminEmail, adminPassword, adminName });
      steps.seed = { status: "ok" };
    } catch (err) {
      console.error("[install] Erro em seed:", err.message);
      steps.seed = {
        status: "error",
        message: "Erro ao executar seed inicial. Verifique logs do servidor.",
      };
      return res.status(500).json({ ok: false, steps });
    }

    // 4) Persistir config
    try {
      const cfg = saveInstallConfig({ databaseUrl });
      steps.finalize = { status: "ok" };
      return res.json({
        ok: true,
        steps,
        config: {
          installed: cfg.installed,
          installedAt: cfg.installedAt,
          schemaVersion: cfg.schemaVersion,
        },
      });
    } catch (err) {
      console.error("[install] Erro ao salvar config:", err.message);
      steps.finalize = {
        status: "error",
        message: "Erro ao salvar configuração de instalação.",
      };
      return res.status(500).json({ ok: false, steps });
    }
  } catch (err) {
    console.error("[install] Erro inesperado:", err.message);
    return res.status(500).json({
      ok: false,
      steps,
      error: "Erro inesperado durante a instalação. Tente novamente.",
    });
  }
});

export default router;

