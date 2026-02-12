import express from "express";
import { withClient } from "../db/client.js";

const router = express.Router();

// GET /api/profiles
router.get("/", async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `
        SELECT *
        FROM profiles
        ORDER BY name ASC
        `
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error("[profiles] Erro ao listar perfis:", err.message);
    res.status(500).json({ error: "Erro ao listar perfis." });
  }
});

// GET /api/profiles/technicians
router.get("/technicians", async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `
        SELECT
          p.*,
          ur.role
        FROM profiles p
        JOIN user_roles ur ON ur.user_id = p.user_id
        WHERE ur.role = 'tecnico'
          AND p.active = true
        ORDER BY p.name ASC
        `
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error("[profiles] Erro ao listar técnicos:", err.message);
    res.status(500).json({ error: "Erro ao listar técnicos." });
  }
});

// PATCH /api/profiles/:id
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { active, phone, avatar_url } = req.body || {};

  const setClauses = [];
  const values = [];
  let idx = 1;

  if (typeof active === "boolean") {
    setClauses.push(`active = $${idx++}`);
    values.push(active);
  }
  if (typeof phone === "string") {
    setClauses.push(`phone = $${idx++}`);
    values.push(phone);
  }
  if (typeof avatar_url === "string") {
    setClauses.push(`avatar_url = $${idx++}`);
    values.push(avatar_url);
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }

  values.push(id);

  try {
    const row = await withClient(async (client) => {
      const result = await client.query(
        `
        UPDATE profiles
        SET ${setClauses.join(", ")}
        WHERE id = $${idx}
        RETURNING *
        `,
        values
      );
      return result.rows[0];
    });

    if (!row) {
      return res.status(404).json({ error: "Perfil não encontrado." });
    }

    res.json(row);
  } catch (err) {
    console.error("[profiles] Erro ao atualizar perfil:", err.message);
    res.status(500).json({ error: "Erro ao atualizar perfil." });
  }
});

export default router;

