import express from "express";
import { withClient } from "../db/client.js";

const router = express.Router();

// GET /api/customers
router.get("/", async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `SELECT id, name, cpf_cnpj, main_contact_name, phone, email, created_at
         FROM customers
         ORDER BY name ASC`
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error("[customers] Erro ao listar clientes:", err.message);
    res.status(500).json({ error: "Erro ao listar clientes." });
  }
});

// POST /api/customers
router.post("/", async (req, res) => {
  const { name, cpf_cnpj, main_contact_name, phone, email } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome do cliente é obrigatório." });
  }

  try {
    const row = await withClient(async (client) => {
      const result = await client.query(
        `INSERT INTO customers (name, cpf_cnpj, main_contact_name, phone, email)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name.trim(), cpf_cnpj || "", main_contact_name || "", phone || "", email || ""]
      );
      return result.rows[0];
    });
    res.status(201).json(row);
  } catch (err) {
    console.error("[customers] Erro ao criar cliente:", err.message);
    res.status(500).json({ error: "Erro ao criar cliente." });
  }
});

// GET /api/customers/:id/addresses
router.get("/:id/addresses", async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `SELECT *
         FROM customer_addresses
         WHERE customer_id = $1
         ORDER BY created_at ASC`,
        [id]
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error("[customers] Erro ao listar endereços:", err.message);
    res.status(500).json({ error: "Erro ao listar endereços." });
  }
});

// POST /api/customers/:id/addresses
router.post("/:id/addresses", async (req, res) => {
  const { id } = req.params;
  const { label, street, number, city, state, zip, is_default } = req.body || {};
  if (!street || !city) {
    return res.status(400).json({ error: "Rua e cidade são obrigatórias." });
  }

  try {
    const row = await withClient(async (client) => {
      const result = await client.query(
        `INSERT INTO customer_addresses
         (customer_id, label, street, number, city, state, zip, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, false))
         RETURNING *`,
        [id, label || "Principal", street, number || "", city, state || "", zip || "", !!is_default]
      );
      return result.rows[0];
    });
    res.status(201).json(row);
  } catch (err) {
    console.error("[customers] Erro ao criar endereço:", err.message);
    res.status(500).json({ error: "Erro ao criar endereço." });
  }
});

// GET /api/customers/:id/machines
router.get("/:id/machines", async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `SELECT *
         FROM machines
         WHERE customer_id = $1
         ORDER BY model ASC`,
        [id]
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error("[customers] Erro ao listar máquinas:", err.message);
    res.status(500).json({ error: "Erro ao listar máquinas." });
  }
});

// POST /api/customers/:id/machines
router.post("/:id/machines", async (req, res) => {
  const { id } = req.params;
  const { model, serial_number, notes } = req.body || {};
  if (!model || !model.trim()) {
    return res.status(400).json({ error: "Modelo da máquina é obrigatório." });
  }

  try {
    const row = await withClient(async (client) => {
      const result = await client.query(
        `INSERT INTO machines (customer_id, model, serial_number, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [id, model.trim(), serial_number || "", notes || ""]
      );
      return result.rows[0];
    });
    res.status(201).json(row);
  } catch (err) {
    console.error("[customers] Erro ao criar máquina:", err.message);
    res.status(500).json({ error: "Erro ao criar máquina." });
  }
});

export default router;

