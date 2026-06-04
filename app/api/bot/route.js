// Proxies the website chat UI (/bot) to the bot backend's web API.
// Set BOT_API_URL in the Next.js env for production (default: local dev).
export const dynamic = "force-dynamic";

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:8081/web/message";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const res = await fetch(BOT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e) {
    return Response.json(
      {
        error: "bot_unreachable",
        messages: [
          {
            text:
              "⚠️ The Dr Saab AI engine isn't running. Start it with `npm start` in the bot/ folder, then try again.",
            rows: [],
          },
        ],
      },
      { status: 200 }
    );
  }
}
