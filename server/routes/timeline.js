import express from "express";
import { withClient } from "../db/client.js";

const router = express.Router();

// GET /api/service-orders/:id/timeline
router.get("/service-orders/:id/timeline", async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `
        SELECT *
        FROM timeline_comments
        WHERE os_id = $1
        ORDER BY created_at ASC
        `,
        [id]
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error("[timeline] Erro ao listar timeline:", err.message);
    res.status(500).json({ error: "Erro ao listar timeline." });
  }
});

// POST /api/timeline
router.post("/", async (req, res) => {
  const { os_id, kind, message } = req.body || {};
  if (!os_id || !message) {
    return res.status(400).json({ error: "os_id e message são obrigatórios." });
  }

  try {
    const row = await withClient(async (client) => {
      const result = await client.query(
        `
        INSERT INTO timeline_comments (os_id, kind, message, created_by)
        VALUES ($1, COALESCE($2, 'system'), $3, $4)
        RETURNING *
        `,
        [os_id, kind || "system", message, req.user?.id || null]
      );
      return result.rows[0];
    });
    res.status(201).json(row);
  } catch (err) {
    console.error("[timeline] Erro ao adicionar comentário:", err.message);
    res.status(500).json({ error: "Erro ao adicionar comentário." });
  }
});

export default router;

