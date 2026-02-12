import express from "express";
import bcrypt from "bcryptjs";
import { withClient } from "../db/client.js";
import { authMiddleware, createSession, destroySession } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }

  try {
    const user = await withClient(async (client) => {
      const { rows } = await client.query(
        `
          SELECT id, email, name, password
          FROM users
          WHERE email = $1
        `,
        [email]
      );
      return rows[0] || null;
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const { token, expiresAt } = await createSession(user.id);

    res.cookie("session_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("[auth] Erro no login:", err.message);
    return res.status(500).json({ error: "Erro ao autenticar. Tente novamente." });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const token = (req.cookies && req.cookies.session_token) || null;
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.split(";").find((c) => c.trim().startsWith("session_token="));
    const headerToken = match ? decodeURIComponent(match.split("=")[1]) : null;

    await destroySession(token || headerToken);

    res.clearCookie("session_token");
    return res.json({ ok: true });
  } catch (err) {
    console.error("[auth] Erro no logout:", err.message);
    return res.status(500).json({ error: "Erro ao encerrar sessão." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  return res.json({ user: req.user });
});

export default router;

