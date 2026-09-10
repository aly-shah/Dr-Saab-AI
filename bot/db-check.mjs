// Why aren't uploaded reports showing in the admin panel?
//
// Run on the VPS from the repo root:   node bot/db-check.mjs
//
// It answers, in order, the only four things that can be wrong:
//   1. Is the bot writing to a real database at all, or to memory?
//   2. Is it the SAME database the admin panel reads?
//   3. Does lab_reports have the columns the bot inserts?
//   4. Does an insert shaped exactly like a saved report actually work?
//
// Read-only apart from step 4, which inserts inside a transaction and rolls
// it back, so nothing is left behind.
import fs from "node:fs";
import path from "node:path";

function loadEnv(file) {
  const out = {};
  try {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* file may not exist */
  }
  return out;
}

const root = process.cwd();
const botEnv = loadEnv(path.join(root, "bot/.env"));
const webEnv = loadEnv(path.join(root, ".env.production"));

const redact = (url) => String(url || "").replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
const line = "-".repeat(72);

console.log(line);
console.log("1. Which store is the BOT using?");
const botDb = process.env.DATABASE_URL || botEnv.DATABASE_URL || "";
const botSupabase = botEnv.SUPABASE_URL || "";
if (botDb) console.log(`   Postgres  ${redact(botDb)}`);
else if (botSupabase) console.log(`   Supabase  ${botSupabase}`);
else {
  console.log("   *** IN-MEMORY *** — bot/.env has no DATABASE_URL and no SUPABASE_URL.");
  console.log("   Nothing the bot saves survives a restart, and the admin panel");
  console.log("   reads a different store entirely. This alone explains missing reports.");
}

console.log(line);
console.log("2. Which store does the ADMIN PANEL read?");
const adminDb = webEnv.DATABASE_URL || process.env.DATABASE_URL || "";
console.log(`   Postgres  ${adminDb ? redact(adminDb) : "(not set — /api/admin will fail)"}`);
if (botDb && adminDb && botDb !== adminDb) {
  console.log("   *** MISMATCH *** the bot and the admin panel are on DIFFERENT databases.");
  console.log("   Reports are being saved — just not where the panel is looking.");
} else if (botDb && adminDb) {
  console.log("   Same database as the bot. Good.");
}

if (!botDb) {
  console.log(line);
  console.log("Stopping here: fix bot/.env DATABASE_URL first, then re-run.");
  process.exit(0);
}

const pg = (await import("pg")).default;
const pool = new pg.Pool({ connectionString: botDb, max: 2 });

try {
  console.log(line);
  console.log("3. Does lab_reports have the columns the bot writes?");
  const { rows: cols } = await pool.query(
    `select column_name from information_schema.columns
      where table_schema = current_schema() and table_name = 'lab_reports'`,
  );
  if (!cols.length) {
    console.log("   *** lab_reports TABLE DOES NOT EXIST *** — run: psql ... -f bot/db/schema.sql");
    process.exit(1);
  }
  const have = new Set(cols.map((c) => c.column_name));
  const want = [
    "user_id", "raw_input", "analysis", "created_at",
    "metadata", "lab_values", "lab_source", "media_type", "media_data", "file_name",
  ];
  for (const c of want) console.log(`   ${have.has(c) ? "ok     " : "MISSING"}  ${c}`);
  const missing = want.filter((c) => !have.has(c));
  if (missing.length) {
    console.log(`   *** ${missing.length} column(s) missing *** — re-run bot/db/schema.sql:`);
    console.log(`       psql "${redact(botDb)}" -f bot/db/schema.sql`);
  }

  console.log(line);
  console.log("4. What is actually stored right now?");
  const { rows: counts } = await pool.query(
    `select count(*)::int total,
            count(*) filter (where analysis is not null)::int analysed,
            count(*) filter (where media_data is not null)::int with_file
       from lab_reports`,
  );
  console.log(`   lab_reports rows: ${counts[0].total} (analysed ${counts[0].analysed}, with a stored file ${counts[0].with_file})`);
  const { rows: recent } = await pool.query(
    `select r.created_at, u.source, coalesce(u.name, u.phone_number, u.telegram_id::text, '?') who,
            r.media_type, r.analysis is not null as analysed
       from lab_reports r join users u on u.id = r.user_id
      order by r.created_at desc limit 10`,
  );
  if (!recent.length) console.log("   (no rows at all — nothing has ever been saved)");
  for (const r of recent) {
    console.log(
      `   ${new Date(r.created_at).toISOString().slice(0, 16)}  ${String(r.who).slice(0, 22).padEnd(22)}` +
        `  via ${String(r.source || "?").padEnd(8)} ${r.media_type || "no file"}  ${r.analysed ? "analysed" : "NOT analysed"}`,
    );
  }
  const { rows: users } = await pool.query(
    `select source, count(*)::int n from users group by source order by n desc`,
  );
  console.log(`   patients by channel: ${users.map((u) => `${u.source || "?"}=${u.n}`).join(", ") || "none"}`);
  console.log("   NOTE: the web chat creates its own patient row per browser session.");
  console.log("   A report sent on the website will NOT appear under your WhatsApp patient.");

  console.log(line);
  console.log("5. Can the bot's exact insert succeed? (rolled back afterwards)");
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows: u } = await client.query("select id from users order by created_at desc limit 1");
    if (!u[0]) {
      console.log("   skipped — no users in the database yet");
    } else {
      const names = ["user_id", "raw_input", "analysis", "metadata", "lab_values", "lab_source", "media_type", "media_data", "file_name"]
        .filter((c) => have.has(c));
      const vals = {
        user_id: u[0].id,
        raw_input: "[db-check]",
        analysis: null,
        metadata: JSON.stringify({ status: "db_check" }),
        lab_values: null,
        lab_source: null,
        media_type: "image",
        media_data: "data:image/png;base64,iVBORw0KGgo=",
        file_name: "db-check.png",
      };
      await client.query(
        `insert into lab_reports (${names.join(", ")}) values (${names.map((_, i) => `$${i + 1}`).join(", ")})`,
        names.map((n) => vals[n]),
      );
      console.log("   INSERT OK — the database accepts a saved report.");
    }
    await client.query("rollback");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    console.log(`   *** INSERT FAILED *** ${e.code ? `[${e.code}] ` : ""}${e.message}`);
    console.log("   This is the error the bot hits and swallows when saving a report.");
  } finally {
    client.release();
  }
  console.log(line);
} finally {
  await pool.end();
}
