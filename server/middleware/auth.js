import crypto from "crypto";
import { withClient } from "../db/client.js";
import { isInstalled } from "../config/installState.js";

function parseCookies(header) {
  const result = {};
  if (!header) return result;
  const parts = header.split(";");
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=");
    if (!key) continue;
    result[key] = decodeURIComponent(rest.join("=") || "");
  }
  return result;
}

export async function authMiddleware(req, res, next) {
  try {
    // Se o app ainda não está instalado, não há tabelas de sessions/users
    if (!isInstalled()) {
      req.user = null;
      return next();
    }

    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies["session_token"];
    if (!token) {
      req.user = null;
      return next();
    }

    const user = await withClient(async (client) => {
      const { rows } = await client.query(
        `
          SELECT
            u.id,
            u.email,
            u.name,
            p.id as profile_id,
            p.phone,
            p.avatar_url,
            p.active,
            COALESCE(
              (
                SELECT role
                FROM user_roles
                WHERE user_id = u.id
                ORDER BY role = 'admin' DESC, role = 'gerente' DESC, role = 'tecnico' DESC
                LIMIT 1
              ),
              'tecnico'
            ) as role
          FROM sessions s
          JOIN users u ON u.id = s.user_id
          LEFT JOIN profiles p ON p.user_id = u.id
          WHERE s.token = $1
        `,
        [token]
      );
      return rows[0] || null;
    });

    req.user = user;
    return next();
  } catch (err) {
    console.error("[auth] Erro ao carregar usuário:", err.message);
    req.user = null;
    return next();
  }
}

export function requireAuth(requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    if (requiredRoles && !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  };
}

export async function createSession(userId) {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await withClient(async (client) => {
    await client.query(
      `
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES ($1, $2, $3)
      `,
      [userId, token, expiresAt.toISOString()]
    );
  });

  return { token, expiresAt };
}

export async function destroySession(token) {
  if (!token) return;
  await withClient(async (client) => {
    await client.query(`DELETE FROM sessions WHERE token = $1`, [token]);
  });
}

