import bcrypt from "bcryptjs";
import { withClient } from "./client.js";

const BCRYPT_ROUNDS = 12;

export async function runSeed({ adminEmail, adminPassword, adminName } = {}) {
  await withClient(async (client) => {
    console.log("[seed] Iniciando seed de dados básicos...");

    // Tabela de referência de papéis
    await client.query(`
      INSERT INTO roles (id, name)
      VALUES 
        ('admin', 'Administrador'),
        ('gerente', 'Gerente'),
        ('tecnico', 'Técnico')
      ON CONFLICT (id) DO NOTHING;
    `);

    if (adminEmail && adminPassword) {
      const hashedPassword = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
      const adminFullName = adminName || "Admin";

      const res = await client.query(
        `
        INSERT INTO users (email, password, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
        RETURNING id;
      `,
        [adminEmail, hashedPassword, adminFullName]
      );

      const userId = res.rows[0]?.id;
      if (userId) {
        // Criar perfil para o admin
        await client.query(
          `
          INSERT INTO profiles (user_id, name, active)
          VALUES ($1, $2, true)
          ON CONFLICT (user_id) DO NOTHING;
        `,
          [userId, adminFullName]
        );

        await client.query(
          `
          INSERT INTO user_roles (user_id, role)
          VALUES ($1, 'admin')
          ON CONFLICT (user_id) DO NOTHING;
        `,
          [userId]
        );
      }
    }

    console.log("[seed] Seed concluído.");
  });
}

// Execução via CLI: node server/db/seed.js
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[seed] Erro ao executar seed:", err.message);
      process.exit(1);
    });
}

