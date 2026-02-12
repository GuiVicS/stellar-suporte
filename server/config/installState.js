import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = "/data";
const CONFIG_FILENAME = "config.json";

const CONFIG_PATH =
  process.env.INSTALL_CONFIG_PATH ||
  path.join(DATA_DIR, CONFIG_FILENAME);

const SCHEMA_VERSION = 1;

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) return null;
  // Deriva chave de 32 bytes a partir da ENCRYPTION_KEY
  return crypto.createHash("sha256").update(String(key)).digest();
}

function encrypt(text) {
  const key = getEncryptionKey();
  if (!key) return { encrypted: false, value: text };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: true,
    value: Buffer.concat([iv, tag, encrypted]).toString("base64"),
  };
}

function decrypt(payload) {
  const key = getEncryptionKey();
  if (!payload || !payload.encrypted) return payload?.value || "";
  if (!key) {
    // Sem chave, não conseguimos descriptografar; falha segura
    throw new Error("ENCRYPTION_KEY ausente para descriptografar databaseUrl");
  }
  const buf = Buffer.from(payload.value, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function readInstallConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return null;
    }
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error("[installState] Falha ao ler config de instalação:", err.message);
    return null;
  }
}

export function saveInstallConfig({ databaseUrl }) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const payload = encrypt(databaseUrl);

    const config = {
      installed: true,
      installedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      databaseUrl: payload,
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), {
      mode: 0o600,
    });

    return config;
  } catch (err) {
    console.error("[installState] Falha ao salvar config de instalação:", err.message);
    throw err;
  }
}

export function isInstalled() {
  const cfg = readInstallConfig();
  return !!cfg?.installed;
}

export function getEffectiveDatabaseUrl() {
  // ENV tem prioridade para cenários avançados
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const cfg = readInstallConfig();
  if (!cfg?.databaseUrl) return null;
  try {
    return decrypt(cfg.databaseUrl);
  } catch (err) {
    console.error("[installState] Erro ao descriptografar databaseUrl:", err.message);
    return null;
  }
}

export function getSchemaVersion() {
  const cfg = readInstallConfig();
  return cfg?.schemaVersion ?? null;
}

