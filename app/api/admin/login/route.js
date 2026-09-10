import { checkPassword, adminToken, isConfigured, COOKIE_NAME } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {}
  // No ADMIN_PASSWORD in the environment => the panel is locked, not open.
  if (!isConfigured()) {
    return Response.json(
      { ok: false, error: "Admin login is not configured on this server (ADMIN_PASSWORD is unset)." },
      { status: 503 }
    );
  }
  if (!checkPassword(body.password)) {
    return Response.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${adminToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );
  return res;
}
