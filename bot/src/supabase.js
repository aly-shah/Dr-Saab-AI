// Data layer. Uses Supabase (Postgres) when configured, otherwise an
// in-memory store so the bot can run with just Telegram + LLM keys.
// NOTE: in-memory data resets when the process restarts.

import { config } from "./config.js";

const todayISO = () => new Date().toISOString().slice(0, 10);
const yesterdayISO = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const nowISO = () => new Date().toISOString();
const daysAgoISO = (n) => new Date(Date.now() - n * 86400000).toISOString();

let backend;

// ----------------------------------------------------------------
// Supabase backend
// ----------------------------------------------------------------
async function makeSupabaseBackend() {
  const { createClient } = await import("@supabase/supabase-js");
  const { default: WebSocket } = await import("ws");
  const db = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket },
  });

  return {
    async getUserByTelegramId(telegramId) {
      const { data, error } = await db.from("users").select("*").eq("telegram_id", telegramId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async createUser(telegramId) {
      const { data, error } = await db
        .from("users")
        .insert({ telegram_id: telegramId, tier: config.defaultTier })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    async updateUser(userId, patch) {
      const { data, error } = await db.from("users").update(patch).eq("id", userId).select("*").single();
      if (error) throw error;
      return data;
    },
    async addGlucose(userId, value, context, note) {
      const { error } = await db.from("glucose_logs").insert({ user_id: userId, value_mgdl: value, context, note });
      if (error) throw error;
    },
    async addMedication(userId, name, dose) {
      const { error } = await db.from("medication_logs").insert({ user_id: userId, name, dose, taken: true });
      if (error) throw error;
    },
    async addHealthLog(userId, fields) {
      const { error } = await db.from("health_logs").insert({ user_id: userId, ...fields });
      if (error) throw error;
    },
    async addLabReport(userId, rawInput, analysis) {
      const { error } = await db.from("lab_reports").insert({ user_id: userId, raw_input: rawInput, analysis });
      if (error) throw error;
    },
    async saveCoachMessage(userId, kind, role, content) {
      try {
        await db.from("coach_messages").insert({ user_id: userId, kind, role, content });
      } catch {
        /* best-effort */
      }
    },
    async recentGlucose(userId, limit) {
      const { data, error } = await db
        .from("glucose_logs")
        .select("value_mgdl, context, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    async weeklyRaw(userId) {
      const since = daysAgoISO(7);
      const [{ data: g }, { data: m }, { data: h }] = await Promise.all([
        db.from("glucose_logs").select("value_mgdl, created_at").eq("user_id", userId).gte("created_at", since),
        db.from("medication_logs").select("id").eq("user_id", userId).gte("created_at", since),
        db.from("health_logs").select("weight_kg, created_at").eq("user_id", userId).gte("created_at", since),
      ]);
      return { g: g || [], m: m || [], h: h || [] };
    },
    async latestWeight(userId) {
      const { data } = await db
        .from("health_logs")
        .select("weight_kg, created_at")
        .eq("user_id", userId)
        .not("weight_kg", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.weight_kg ?? null;
    },
  };
}

// ----------------------------------------------------------------
// Postgres backend (local or any Postgres via DATABASE_URL)
// ----------------------------------------------------------------
async function makePostgresBackend() {
  const pg = (await import("pg")).default;
  const { Pool, types } = pg;
  // Return DATE columns as plain 'YYYY-MM-DD' strings (not JS Date) so the
  // streak comparison works.
  types.setTypeParser(1082, (v) => v);

  const pool = new Pool({ connectionString: config.databaseUrl, max: 5 });
  pool.on("error", (e) => console.error("pg pool error:", e?.message));

  const insertDynamic = async (table, obj) => {
    const keys = Object.keys(obj);
    const cols = keys.join(", ");
    const ph = keys.map((_, i) => `$${i + 1}`).join(", ");
    await pool.query(`insert into ${table} (${cols}) values (${ph})`, Object.values(obj));
  };

  return {
    async getUserByTelegramId(telegramId) {
      const { rows } = await pool.query("select * from users where telegram_id = $1", [telegramId]);
      return rows[0] || null;
    },
    async createUser(telegramId) {
      const { rows } = await pool.query(
        "insert into users (telegram_id, tier) values ($1, $2) returning *",
        [telegramId, config.defaultTier]
      );
      return rows[0];
    },
    async updateUser(userId, patch) {
      const keys = Object.keys(patch);
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const vals = keys.map((k) => patch[k]);
      const { rows } = await pool.query(
        `update users set ${set}, updated_at = now() where id = $${vals.length + 1} returning *`,
        [...vals, userId]
      );
      return rows[0];
    },
    async addGlucose(userId, value, context, note) {
      await insertDynamic("glucose_logs", { user_id: userId, value_mgdl: value, context, note });
    },
    async addMedication(userId, name, dose) {
      await insertDynamic("medication_logs", { user_id: userId, name, dose, taken: true });
    },
    async addHealthLog(userId, fields) {
      await insertDynamic("health_logs", { user_id: userId, ...fields });
    },
    async addLabReport(userId, rawInput, analysis) {
      await insertDynamic("lab_reports", { user_id: userId, raw_input: rawInput, analysis });
    },
    async saveCoachMessage(userId, kind, role, content) {
      try {
        await insertDynamic("coach_messages", { user_id: userId, kind, role, content });
      } catch {
        /* best-effort */
      }
    },
    async recentGlucose(userId, limit) {
      const { rows } = await pool.query(
        "select value_mgdl, context, created_at from glucose_logs where user_id = $1 order by created_at desc limit $2",
        [userId, limit]
      );
      return rows;
    },
    async weeklyRaw(userId) {
      const since = daysAgoISO(7);
      const [g, m, h] = await Promise.all([
        pool.query("select value_mgdl, created_at from glucose_logs where user_id=$1 and created_at>=$2", [userId, since]),
        pool.query("select id from medication_logs where user_id=$1 and created_at>=$2", [userId, since]),
        pool.query("select weight_kg, created_at from health_logs where user_id=$1 and created_at>=$2", [userId, since]),
      ]);
      return { g: g.rows, m: m.rows, h: h.rows };
    },
    async latestWeight(userId) {
      const { rows } = await pool.query(
        "select weight_kg from health_logs where user_id=$1 and weight_kg is not null order by created_at desc limit 1",
        [userId]
      );
      return rows[0]?.weight_kg ?? null;
    },
  };
}

// ----------------------------------------------------------------
// In-memory backend
// ----------------------------------------------------------------
function makeMemoryBackend() {
  const usersById = new Map();
  const usersByTg = new Map();
  const glucose = [];
  const meds = [];
  const health = [];
  const labs = [];
  let seq = 1;

  return {
    async getUserByTelegramId(telegramId) {
      const id = usersByTg.get(telegramId);
      return id ? usersById.get(id) : null;
    },
    async createUser(telegramId) {
      const user = {
        id: "u" + seq++,
        telegram_id: telegramId,
        name: null, age: null, gender: null, city: null, language: "en",
        height_cm: null, weight_kg: null, diabetes_status: null, goals: null, medications: null,
        doctor_code: null, challenge_code: null, team_code: null,
        tier: config.defaultTier, streak: 0, last_log_date: null, onboarded: false,
        created_at: nowISO(),
      };
      usersById.set(user.id, user);
      usersByTg.set(telegramId, user.id);
      return user;
    },
    async updateUser(userId, patch) {
      const user = { ...usersById.get(userId), ...patch };
      usersById.set(userId, user);
      return user;
    },
    async addGlucose(userId, value, context, note) {
      glucose.push({ user_id: userId, value_mgdl: value, context, note, created_at: nowISO() });
    },
    async addMedication(userId, name, dose) {
      meds.push({ user_id: userId, name, dose, created_at: nowISO() });
    },
    async addHealthLog(userId, fields) {
      health.push({ user_id: userId, ...fields, created_at: nowISO() });
    },
    async addLabReport(userId, rawInput, analysis) {
      labs.push({ user_id: userId, raw_input: rawInput, analysis, created_at: nowISO() });
    },
    async saveCoachMessage() {
      /* not persisted in memory mode */
    },
    async recentGlucose(userId, limit) {
      return glucose
        .filter((r) => r.user_id === userId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, limit);
    },
    async weeklyRaw(userId) {
      const since = daysAgoISO(7);
      const within = (arr) => arr.filter((r) => r.user_id === userId && r.created_at >= since);
      return { g: within(glucose), m: within(meds), h: within(health) };
    },
    async latestWeight(userId) {
      const rows = health
        .filter((r) => r.user_id === userId && r.weight_kg != null)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      return rows[0]?.weight_kg ?? null;
    },
  };
}

let storeName;
if (config.hasPostgres) {
  backend = await makePostgresBackend();
  storeName = "Postgres";
} else if (config.hasSupabase) {
  backend = await makeSupabaseBackend();
  storeName = "Supabase";
} else {
  backend = makeMemoryBackend();
  storeName = "in-memory (data resets on restart)";
}
console.log(`   Store: ${storeName}`);

// ----------------------------------------------------------------
// Public API (same regardless of backend)
// ----------------------------------------------------------------

export const getUserByTelegramId = (tg) => backend.getUserByTelegramId(tg);
export const createUser = (tg) => backend.createUser(tg);
export const updateUser = (id, patch) => backend.updateUser(id, patch);

export async function getOrCreateUser(telegramId) {
  return (await backend.getUserByTelegramId(telegramId)) || (await backend.createUser(telegramId));
}

// Consistency / streak engine
export async function registerActivity(user) {
  const today = todayISO();
  if (user.last_log_date === today) return user;
  let streak = 1;
  if (user.last_log_date === yesterdayISO()) streak = (user.streak || 0) + 1;
  return backend.updateUser(user.id, { streak, last_log_date: today });
}

export const addGlucose = (id, v, c = "random", n = null) => backend.addGlucose(id, v, c, n);
export const addMedication = (id, name, dose = null) => backend.addMedication(id, name, dose);
export const addHealthLog = (id, fields) => backend.addHealthLog(id, fields);
export const addLabReport = (id, raw, analysis) => backend.addLabReport(id, raw, analysis);
export const saveCoachMessage = (id, kind, role, content) => backend.saveCoachMessage(id, kind, role, content);
export const recentGlucose = (id, limit = 5) => backend.recentGlucose(id, limit);
export const latestWeight = (id) => backend.latestWeight(id);

export async function weeklyStats(userId) {
  const { g, m, h } = await backend.weeklyRaw(userId);
  const values = g.map((r) => Number(r.value_mgdl)).filter((n) => !Number.isNaN(n));
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  return {
    glucoseCount: g.length,
    glucoseAvg: avg,
    glucoseMin: values.length ? Math.min(...values) : null,
    glucoseMax: values.length ? Math.max(...values) : null,
    medicationCount: m.length,
    healthCount: h.length,
  };
}
