import crypto from "crypto";

// ADMIN_PASSWORD is the only source of truth. There is no baked-in fallback:
// if the env var is missing or blank the admin panel stays locked rather than
// falling back to a password that anyone can read out of the repo.
const PASSWORD = process.env.ADMIN_PASSWORD?.trim() || "";

// Derive an opaque cookie token from the password so the raw password
// is never stored in the cookie. Empty when no password is configured, which
// makes isAuthed() reject every cookie (an unset password can't be guessed).
export function adminToken() {
  if (!PASSWORD) return "";
  return crypto.createHash("sha256").update(`drsaab::${PASSWORD}`).digest("hex");
}

export function isConfigured() {
  return PASSWORD.length > 0;
}

export function checkPassword(pw) {
  if (!PASSWORD) return false;
  return typeof pw === "string" && pw.length > 0 && pw === PASSWORD;
}

export function isAuthed(req) {
  const token = adminToken();
  if (!token) return false;
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)dz_admin=([a-f0-9]+)/);
  return !!m && m[1] === token;
}

export const COOKIE_NAME = "dz_admin";
