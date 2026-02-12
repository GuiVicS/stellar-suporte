import express from "express";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import installRouter from "./routes/install.js";
import authRouter from "./routes/auth.js";
import customersRouter from "./routes/customers.js";
import serviceOrdersRouter from "./routes/serviceOrders.js";
import checklistRouter from "./routes/checklist.js";
import timelineRouter from "./routes/timeline.js";
import partsRouter from "./routes/parts.js";
import notificationsRouter from "./routes/notifications.js";
import profilesRouter from "./routes/profiles.js";
import { isInstalled } from "./config/installState.js";
import { getPool } from "./db/client.js";
import { authMiddleware, requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(authMiddleware);

// Healthcheck simples - sempre 200
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Readiness - só 200 se instalado + DB ok
app.get("/api/ready", async (req, res) => {
  if (!isInstalled()) {
    return res.status(503).json({
      status: "not_installed",
      message: "Aplicação ainda não instalada. Acesse /install.",
    });
  }

  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return res.json({ status: "ok" });
  } catch (err) {
    console.error("[ready] Falha ao verificar banco:", err.message);
    return res.status(503).json({
      status: "db_error",
      message: "Banco de dados indisponível.",
    });
  }
});

// Rotas de instalação e autenticação
app.use("/api/install", installRouter);
app.use("/api/auth", authRouter);

// Rotas de domínio (protegem por papel onde faz sentido)
app.use("/api/customers", requireAuth(["admin", "gerente"]), customersRouter);
app.use("/api/service-orders", requireAuth(["admin", "gerente", "tecnico"]), serviceOrdersRouter);
app.use("/api/checklist", requireAuth(["admin", "gerente", "tecnico"]), checklistRouter);
app.use("/api/timeline", requireAuth(["admin", "gerente", "tecnico"]), timelineRouter);
app.use("/api/parts", requireAuth(["admin", "gerente", "tecnico"]), partsRouter);
app.use("/api/notifications", requireAuth(["admin", "gerente", "tecnico"]), notificationsRouter);
app.use("/api/profiles", requireAuth(["admin", "gerente"]), profilesRouter);

// Middleware para forçar /install quando não instalado
app.use((req, res, next) => {
  const p = req.path;
  const installed = isInstalled();

  // Rotas da API e health são tratadas pelos seus próprios handlers
  if (p.startsWith("/api/")) return next();

  // Assets estáticos sempre passam (para express.static servir)
  const ext = path.extname(p);
  if (ext && ext !== ".html") return next();

  // Rotas relacionadas a install
  const isInstallRoute = p === "/install" || p.startsWith("/install/");

  if (!installed && !isInstallRoute) {
    return res.redirect("/install");
  }

  if (installed && isInstallRoute) {
    return res.redirect("/");
  }

  next();
});

// Servir frontend buildado
// process.cwd() retorna /app no container (WORKDIR do Dockerfile)
const distPath = path.resolve(process.cwd(), "dist");

console.log("[server] distPath resolvido:", distPath);
console.log("[server] dist/ existe?", fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  // Servir assets estáticos com cache
  app.use(
    express.static(distPath, {
      maxAge: "1d",
      index: false, // Não servir index.html automaticamente para "/"
    })
  );

  // SPA fallback – qualquer rota que não seja /api retorna index.html
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Rota não encontrada." });
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.warn("[server] Pasta dist/ não encontrada. Rode `npm run build` antes de iniciar em produção.");
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Rota não encontrada." });
    }
    res.status(500).send("Erro: frontend não foi compilado. Execute npm run build.");
  });
}

app.listen(PORT, () => {
  console.log(`[server] Rodando em http://0.0.0.0:${PORT}`);
});

