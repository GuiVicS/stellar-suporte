import express from "express";
import { withClient } from "../db/client.js";

const router = express.Router();

// GET /api/service-orders/:id/parts
router.get("/service-orders/:id/parts", async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `
        SELECT *
        FROM parts_used
        WHERE os_id = $1
        ORDER BY created_at DESC
        `,
        [id]
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error("[parts] Erro ao listar peças:", err.message);
    res.status(500).json({ error: "Erro ao listar peças." });
  }
});

// POST /api/parts
router.post("/", async (req, res) => {
  const { os_id, part_name, quantity, cost, note } = req.body || {};
  if (!os_id || !part_name) {
    return res.status(400).json({ error: "os_id e part_name são obrigatórios." });
  }

  try {
    const row = await withClient(async (client) => {
      const result = await client.query(
        `
        INSERT INTO parts_used (os_id, part_name, quantity, note)
        VALUES ($1, $2, COALESCE($3, 1), $4)
        RETURNING *
        `,
        [os_id, part_name, quantity || 1, note || ""]
      );
      return result.rows[0];
    });
    res.status(201).json(row);
  } catch (err) {
    console.error("[parts] Erro ao adicionar peça:", err.message);
    res.status(500).json({ error: "Erro ao adicionar peça." });
  }
});

// DELETE /api/parts/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await withClient(async (client) => {
      const result = await client.query(
        `DELETE FROM parts_used WHERE id = $1 RETURNING id`,
        [id]
      );
      return result.rowCount;
    });

    if (!deleted) {
      return res.status(404).json({ error: "Peça não encontrada." });
    }
    res.status(204).end();
  } catch (err) {
    console.error("[parts] Erro ao remover peça:", err.message);
    res.status(500).json({ error: "Erro ao remover peça." });
  }
});

export default router;

