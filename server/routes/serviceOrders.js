import express from "express";
import { withClient } from "../db/client.js";

const router = express.Router();

// GET /api/service-orders
router.get("/", async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `
        SELECT
          so.*,
          row_to_json(cust) AS customer,
          row_to_json(addr) AS address,
          row_to_json(mac) AS machine
        FROM service_orders so
        LEFT JOIN customers cust ON cust.id = so.customer_id
        LEFT JOIN customer_addresses addr ON addr.id = so.address_id
        LEFT JOIN machines mac ON mac.id = so.machine_id
        ORDER BY so.scheduled_start ASC
        `
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error("[serviceOrders] Erro ao listar OS:", err.message);
    res.status(500).json({ error: "Erro ao listar ordens de serviço." });
  }
});

// POST /api/service-orders
router.post("/", async (req, res) => {
  const body = req.body || {};
  const {
    customer_id,
    address_id,
    machine_id,
    technician_id,
    type,
    priority,
    status,
    scheduled_start,
    scheduled_end,
    estimated_duration_min,
    problem_description,
  } = body;

  if (!customer_id) {
    return res.status(400).json({ error: "customer_id é obrigatório." });
  }

  try {
    const row = await withClient(async (client) => {
      const result = await client.query(
        `
        INSERT INTO service_orders (
          code,
          customer_id,
          address_id,
          machine_id,
          technician_id,
          type,
          priority,
          status,
          scheduled_start,
          scheduled_end,
          estimated_duration_min,
          problem_description
        )
        VALUES (
          '', $1, $2, $3, $4, COALESCE($5, 'corretiva')::os_type,
          COALESCE($6, 'media')::priority,
          COALESCE($7, 'a_fazer')::os_status,
          COALESCE($8, now()),
          $9,
          COALESCE($10, 60),
          COALESCE($11, '')
        )
        RETURNING *
        `,
        [
          customer_id,
          address_id || null,
          machine_id || null,
          technician_id || null,
          type || null,
          priority || null,
          status || null,
          scheduled_start || null,
          scheduled_end || null,
          estimated_duration_min || null,
          problem_description || "",
        ]
      );
      return result.rows[0];
    });
    res.status(201).json(row);
  } catch (err) {
    console.error("[serviceOrders] Erro ao criar OS:", err.message);
    res.status(500).json({ error: "Erro ao criar ordem de serviço." });
  }
});

// PUT /api/service-orders/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  // Monta SET dinâmico simples
  const allowedFields = [
    "customer_id",
    "address_id",
    "machine_id",
    "technician_id",
    "type",
    "priority",
    "status",
    "scheduled_start",
    "scheduled_end",
    "estimated_duration_min",
    "actual_departure_at",
    "arrived_at",
    "started_at",
    "finished_at",
    "problem_description",
    "diagnosis",
    "resolution",
    "next_steps",
    "customer_signature_name",
    "customer_signature_doc",
    "customer_signature_image",
  ];

  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      setClauses.push(`${field} = $${idx}`);
      values.push(updates[field]);
      idx += 1;
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }

  values.push(id);

  try {
    const row = await withClient(async (client) => {
      const result = await client.query(
        `
        UPDATE service_orders
        SET ${setClauses.join(", ")}
        WHERE id = $${idx}
        RETURNING *
        `,
        values
      );
      return result.rows[0];
    });

    if (!row) {
      return res.status(404).json({ error: "Ordem de serviço não encontrada." });
    }

    res.json(row);
  } catch (err) {
    console.error("[serviceOrders] Erro ao atualizar OS:", err.message);
    res.status(500).json({ error: "Erro ao atualizar ordem de serviço." });
  }
});

export default router;

