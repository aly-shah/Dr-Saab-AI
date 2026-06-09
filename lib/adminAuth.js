import crypto from "crypto";

const PASSWORD = process.env.ADMIN_PASSWORD || "drsaab-admin";

// Derive an opaque cookie token from the password so the raw password
// is never stored in the cookie.
export function adminToken() {
  return crypto.createHash("sha256").update(`drsaab::${PASSWORD}`).digest("hex");
}

export function checkPassword(pw) {
  return typeof pw === "string" && pw.length > 0 && pw === PASSWORD;
}

export function isAuthed(req) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)dz_admin=([a-f0-9]+)/);
  return !!m && m[1] === adminToken();
}

export const COOKIE_NAME = "dz_admin";
