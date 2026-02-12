import express from "express";
import { withClient } from "../db/client.js";

const router = express.Router();

// GET /api/service-orders/:id/checklist
router.get("/service-orders/:id/checklist", async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `
        SELECT *
        FROM checklist_items
        WHERE os_id = $1
        ORDER BY created_at ASC
        `,
        [id]
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error("[checklist] Erro ao listar checklist:", err.message);
    res.status(500).json({ error: "Erro ao listar checklist." });
  }
});

// PATCH /api/checklist/:id
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { checked } = req.body || {};

  try {
    const row = await withClient(async (client) => {
      const result = await client.query(
        `
        UPDATE checklist_items
        SET checked = $1,
            checked_at = CASE WHEN $1 = true THEN now() ELSE NULL END
        WHERE id = $2
        RETURNING *
        `,
        [!!checked, id]
      );
      return result.rows[0];
    });

    if (!row) {
      return res.status(404).json({ error: "Item de checklist não encontrado." });
    }

    res.json(row);
  } catch (err) {
    console.error("[checklist] Erro ao atualizar item:", err.message);
    res.status(500).json({ error: "Erro ao atualizar item." });
  }
});

export default router;

