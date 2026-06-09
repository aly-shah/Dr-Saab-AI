import { checkPassword, adminToken, COOKIE_NAME } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {}
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
