import { withClient } from "./client.js";

export async function runSeed({ adminEmail, adminPassword, adminName } = {}) {
  await withClient(async (client) => {
    console.log("[seed] Iniciando seed de dados básicos...");

    // Exemplo de tabelas mínimas; devem corresponder ao schema definido nas migrations
    await client.query(`
      INSERT INTO roles (id, name)
      VALUES 
        ('admin', 'Administrador'),
        ('gerente', 'Gerente'),
        ('tecnico', 'Técnico')
      ON CONFLICT (id) DO NOTHING;
    `);

    if (adminEmail && adminPassword) {
      // Usuário admin inicial; senha em texto simples aqui é apenas placeholder.
      // Em produção, deve-se usar hash (ex: bcrypt) – pode ser evoluído depois.
      const res = await client.query(
        `
        INSERT INTO users (email, password, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
        RETURNING id;
      `,
        [adminEmail, adminPassword, adminName || "Admin"]
      );

      const userId = res.rows[0]?.id;
      if (userId) {
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

