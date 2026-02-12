import express from "express";
import { withClient } from "../db/client.js";

const router = express.Router();

// GET /api/notifications
router.get("/", async (req, res) => {
  if (!req.user) return res.json([]);
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `
        SELECT *
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [req.user.id]
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error("[notifications] Erro ao listar notificações:", err.message);
    res.status(500).json({ error: "Erro ao listar notificações." });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  const { id } = req.params;
  if (!req.user) return res.status(401).json({ error: "Não autenticado" });

  try {
    await withClient(async (client) => {
      await client.query(
        `
        UPDATE notifications
        SET read = true
        WHERE id = $1 AND user_id = $2
        `,
        [id, req.user.id]
      );
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[notifications] Erro ao marcar como lida:", err.message);
    res.status(500).json({ error: "Erro ao marcar notificação como lida." });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado" });
  try {
    await withClient(async (client) => {
      await client.query(
        `
        UPDATE notifications
        SET read = true
        WHERE user_id = $1 AND read = false
        `,
        [req.user.id]
      );
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[notifications] Erro ao marcar todas como lidas:", err.message);
    res.status(500).json({ error: "Erro ao marcar todas notificações como lidas." });
  }
});

export default router;

