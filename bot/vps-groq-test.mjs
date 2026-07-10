// Zero-dependency VPS diagnostic for the Groq "Premature close" failure.
// Run on the VPS:  node bot/vps-groq-test.mjs
//
// It makes the SAME large Groq request two ways and reports which complete:
//   A) global fetch (undici)      — Node's built-in stack the app fails on now
//   B) node:https, keepAlive off  — the exact mechanism the node-fetch fix uses
//
// Interpretation:
//   B succeeds  -> the deployed node-fetch fix WILL work. Deploy with confidence.
//   B fails too -> it's an IP-layer/MTU problem, not undici. Do the MTU fix
//                  first (ip link set dev <iface> mtu 1400); code can't help.
import dns from "node:dns";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

dns.setDefaultResultOrder("ipv4first"); // mirror the app (index.js)

// --- find GROQ_API_KEY: env first, then bot/.env next to this file ---
function loadKey() {
  if (process.env.GROQ_API_KEY?.trim()) return process.env.GROQ_API_KEY.trim();
  for (const p of [path.join(process.cwd(), "bot/.env"), path.join(process.cwd(), ".env")]) {
    try {
      const line = fs.readFileSync(p, "utf8").split("\n").find((l) => l.startsWith("GROQ_API_KEY="));
      if (line) return line.slice("GROQ_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
    } catch { /* ignore */ }
  }
  return "";
}
const KEY = loadKey();
if (!KEY) {
  console.error("No GROQ_API_KEY found (checked env, bot/.env, .env). Run: GROQ_API_KEY=xxx node bot/vps-groq-test.mjs");
  process.exit(1);
}

const BODY = JSON.stringify({
  model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
  // Ask for a large response — that is what triggers the mid-body drop.
  messages: [{ role: "user", content: "Write 600 words about the benefits of walking for people with diabetes." }],
  max_tokens: 900,
});
const HEADERS = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function viaUndici() {
  const t0 = Date.now();
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: HEADERS, body: BODY });
  const text = await res.text(); // full body read — where "Premature close" fires
  const content = JSON.parse(text).choices?.[0]?.message?.content ?? "";
  return { ms: Date.now() - t0, bytes: text.length, words: content.split(/\s+/).length };
}

function viaCoreHttps() {
  const t0 = Date.now();
  const agent = new https.Agent({ keepAlive: false }); // fresh connection, no undici
  return new Promise((resolve, reject) => {
    const req = https.request(
      "https://api.groq.com/openai/v1/chat/completions",
      { method: "POST", headers: { ...HEADERS, "Content-Length": Buffer.byteLength(BODY) }, agent, family: 4 },
      (res) => {
        let text = "";
        res.on("data", (c) => (text += c));
        res.on("end", () => {
          try {
            const content = JSON.parse(text).choices?.[0]?.message?.content ?? "";
            resolve({ ms: Date.now() - t0, bytes: text.length, words: content.split(/\s+/).length });
          } catch (e) { reject(new Error("bad body: " + e.message)); }
        });
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.write(BODY);
    req.end();
  });
}

async function run(label, fn) {
  try {
    const r = await fn();
    console.log(`  ${label}: ✅ OK — ${r.words} words, ${r.bytes} bytes, ${r.ms}ms`);
    return true;
  } catch (e) {
    console.log(`  ${label}: ❌ FAILED — ${e?.message || e}`);
    return false;
  }
}

console.log("Testing Groq from this host (large response)…\n");
const undiciOk = await run("A) global fetch (undici, current stack)", viaUndici);
const httpsOk = await run("B) node:https keepAlive:false (the fix)   ", viaCoreHttps);

console.log("\n--- verdict ---");
if (httpsOk && !undiciOk) console.log("It's an undici problem. The node-fetch fix WILL work → deploy it.");
else if (httpsOk && undiciOk) console.log("Both work now (may be intermittent). node-fetch fix is safe to deploy and adds resilience.");
else console.log("Core HTTPS also fails → it's a network/MTU problem, NOT undici. Do the MTU fix first; code can't help.");
process.exit(0);
