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
    async deleteUser(userId) {
      // Child tables (glucose/medication/health/labs/coach/kb/challenges/…)
      // all `on delete cascade`, so removing the user row wipes everything.
      const { error } = await db.from("users").delete().eq("id", userId);
      if (error) throw error;
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
    async windowRaw(userId, days) {
      const since = daysAgoISO(days);
      const [{ data: g }, { data: m }, { data: h }] = await Promise.all([
        db.from("glucose_logs").select("value_mgdl, context, created_at").eq("user_id", userId).gte("created_at", since),
        db.from("medication_logs").select("id").eq("user_id", userId).gte("created_at", since),
        db.from("health_logs").select("id").eq("user_id", userId).gte("created_at", since),
      ]);
      return { g: g || [], m: m || [], h: h || [] };
    },
    async joinChallenge(userId, type, code) {
      const { data } = await db
        .from("user_challenges")
        .select("id")
        .eq("user_id", userId)
        .eq("challenge_type", type)
        .eq("status", "active")
        .maybeSingle();
      if (data) return { already: true };
      await db.from("user_challenges").insert({ user_id: userId, challenge_type: type, code: code || null, status: "active" });
      return { already: false };
    },
    async listChallenges(userId) {
      const { data } = await db
        .from("user_challenges")
        .select("challenge_type, code, status, started_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("started_at", { ascending: false });
      return data || [];
    },
    async addServiceRequest(userId, serviceType) {
      const { data } = await db
        .from("service_requests")
        .insert({ user_id: userId, service_type: serviceType, status: "requested" })
        .select("id")
        .single();
      return data?.id;
    },
    async saveProfileAnswer(userId, key, value) {
      const { data } = await db.from("users").select("profile_answers").eq("id", userId).maybeSingle();
      const merged = { ...(data?.profile_answers || {}), [key]: value == null ? "" : String(value) };
      await db.from("users").update({ profile_answers: merged }).eq("id", userId);
    },
    // --- Build 1: medications master ---
    async findMedicationByName(userId, name) {
      const { data } = await db
        .from("medications")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .ilike("name", name)
        .maybeSingle();
      return data || null;
    },
    async listMedications(userId) {
      const { data } = await db
        .from("medications")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
    async addMedicationMaster(userId, name, dose, frequency, reminderEnabled) {
      const { data } = await db
        .from("medications")
        .insert({ user_id: userId, name, dose, frequency, reminder_enabled: !!reminderEnabled, active: true })
        .select("*")
        .single();
      return data;
    },
    // --- Build 1: symptoms ---
    async addSymptomLog(userId, symptoms) {
      await db.from("symptom_logs").insert({ user_id: userId, symptoms });
    },
    // --- Build 1: reminders ---
    async addReminderSchedule(userId, fields) {
      const { data } = await db
        .from("reminder_schedules")
        .insert({ user_id: userId, active: true, ...fields })
        .select("*")
        .single();
      return data;
    },
    async listReminders(userId) {
      const { data } = await db
        .from("reminder_schedules")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
    async deactivateReminder(userId, id) {
      await db.from("reminder_schedules").update({ active: false }).eq("user_id", userId).eq("id", id);
    },
    async dueReminders(nowIso) {
      const { data } = await db
        .from("reminder_schedules")
        .select("*")
        .eq("active", true)
        .lte("next_fire_at", nowIso)
        .limit(100);
      return data || [];
    },
    async markReminderFired(id, nextFireAt) {
      await db.from("reminder_schedules").update({ last_fired_at: new Date().toISOString(), next_fire_at: nextFireAt }).eq("id", id);
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
    async createUser(telegramId, source = "telegram") {
      const { rows } = await pool.query(
        "insert into users (telegram_id, tier, source) values ($1, $2, $3) returning *",
        [telegramId, config.defaultTier, source]
      );
      return rows[0];
    },
    async allActiveUsers() {
      const { rows } = await pool.query(
        `select u.id, u.telegram_id, u.language, u.streak, u.last_log_date,
                u.last_reminder_date, u.last_streak_date, u.last_winback_date, u.last_summary_date,
                kb.last_seen
         from users u left join patient_kb kb on kb.user_id = u.id
         where u.onboarded and coalesce(u.source,'telegram') = 'telegram'`
      );
      return rows;
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
    async deleteUser(userId) {
      // FKs cascade on delete, so this removes all of the user's data too.
      await pool.query("delete from users where id = $1", [userId]);
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
    async recordMessage(userId) {
      await pool.query(
        `insert into patient_kb (user_id, message_count, last_seen) values ($1, 1, now())
         on conflict (user_id) do update set message_count = patient_kb.message_count + 1, last_seen = now()`,
        [userId]
      );
    },
    async upsertKB(userId, content) {
      await pool.query(
        `insert into patient_kb (user_id, content, updated_at) values ($1, $2, now())
         on conflict (user_id) do update set content = excluded.content, updated_at = now()`,
        [userId, content]
      );
    },
    async windowRaw(userId, days) {
      const since = daysAgoISO(days);
      const [g, m, h] = await Promise.all([
        pool.query("select value_mgdl, context, created_at from glucose_logs where user_id=$1 and created_at>=$2", [userId, since]),
        pool.query("select id from medication_logs where user_id=$1 and created_at>=$2", [userId, since]),
        pool.query("select id from health_logs where user_id=$1 and created_at>=$2", [userId, since]),
      ]);
      return { g: g.rows, m: m.rows, h: h.rows };
    },
    async joinChallenge(userId, type, code) {
      const ex = await pool.query(
        "select id from user_challenges where user_id=$1 and challenge_type=$2 and status='active'",
        [userId, type]
      );
      if (ex.rows[0]) return { already: true };
      await pool.query(
        "insert into user_challenges (user_id, challenge_type, code, status) values ($1,$2,$3,'active')",
        [userId, type, code || null]
      );
      return { already: false };
    },
    async listChallenges(userId) {
      const { rows } = await pool.query(
        "select challenge_type, code, status, started_at from user_challenges where user_id=$1 and status='active' order by started_at desc",
        [userId]
      );
      return rows;
    },
    async addServiceRequest(userId, serviceType) {
      const { rows } = await pool.query(
        "insert into service_requests (user_id, service_type, status) values ($1,$2,'requested') returning id",
        [userId, serviceType]
      );
      return rows[0].id;
    },
    async saveProfileAnswer(userId, key, value) {
      await pool.query(
        `update users set profile_answers = coalesce(profile_answers,'{}'::jsonb) || jsonb_build_object($2::text, $3::text),
                          updated_at = now() where id=$1`,
        [userId, key, value == null ? "" : String(value)]
      );
    },
    // --- Build 1: medications master ---
    async findMedicationByName(userId, name) {
      const { rows } = await pool.query(
        "select * from medications where user_id=$1 and active and lower(name)=lower($2) limit 1",
        [userId, name]
      );
      return rows[0] || null;
    },
    async listMedications(userId) {
      const { rows } = await pool.query(
        "select * from medications where user_id=$1 and active order by created_at desc",
        [userId]
      );
      return rows;
    },
    async addMedicationMaster(userId, name, dose, frequency, reminderEnabled) {
      const { rows } = await pool.query(
        `insert into medications (user_id, name, dose, frequency, reminder_enabled, active)
         values ($1,$2,$3,$4,$5,true) returning *`,
        [userId, name, dose, frequency, !!reminderEnabled]
      );
      return rows[0];
    },
    // --- Build 1: symptoms ---
    async addSymptomLog(userId, symptoms) {
      await insertDynamic("symptom_logs", { user_id: userId, symptoms });
    },
    // --- Build 1: reminders ---
    async addReminderSchedule(userId, fields) {
      const obj = { user_id: userId, active: true, ...fields };
      const keys = Object.keys(obj);
      const cols = keys.join(", ");
      const ph = keys.map((_, i) => `$${i + 1}`).join(", ");
      const { rows } = await pool.query(
        `insert into reminder_schedules (${cols}) values (${ph}) returning *`,
        Object.values(obj)
      );
      return rows[0];
    },
    async listReminders(userId) {
      const { rows } = await pool.query(
        "select * from reminder_schedules where user_id=$1 and active order by created_at desc",
        [userId]
      );
      return rows;
    },
    async deactivateReminder(userId, id) {
      await pool.query("update reminder_schedules set active=false where user_id=$1 and id=$2", [userId, id]);
    },
    async dueReminders(nowIso) {
      const { rows } = await pool.query(
        "select * from reminder_schedules where active and next_fire_at <= $1 order by next_fire_at limit 100",
        [nowIso]
      );
      return rows;
    },
    async markReminderFired(id, nextFireAt) {
      await pool.query(
        "update reminder_schedules set last_fired_at=now(), next_fire_at=$2 where id=$1",
        [id, nextFireAt]
      );
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
  const kb = new Map();
  const challenges = [];
  const serviceReqs = [];
  const medsMaster = [];
  const symptoms = [];
  const reminders = [];
  let seq = 1;
  let reqSeq = 1;
  let medSeq = 1;
  let remSeq = 1;

  return {
    async getUserByTelegramId(telegramId) {
      const id = usersByTg.get(telegramId);
      return id ? usersById.get(id) : null;
    },
    async createUser(telegramId, source = "telegram") {
      const user = {
        id: "u" + seq++,
        telegram_id: telegramId,
        name: null, age: null, gender: null, city: null, language: "en",
        height_cm: null, weight_kg: null, diabetes_status: null, goals: null, medications: null,
        doctor_code: null, challenge_code: null, team_code: null,
        tier: config.defaultTier, streak: 0, last_log_date: null, onboarded: false,
        source, created_at: nowISO(),
        // v2 journey fields
        user_type: null, date_of_birth: null, diagnosis_duration: null,
        latest_hba1c: null, hba1c_date_bucket: null,
        latest_fasting_sugar: null, fasting_reading_date: null,
        latest_random_sugar: null, random_reading_date: null,
        diabetes_meds: null, other_conditions: null, non_diabetes_meds: null,
        monitoring_habit: null, monitoring_device: null,
        primary_goal: null, primary_challenge: null, motivation_driver: null,
        disclaimer_accepted: false,
        consistency_score: 50, motivation_score: 50, risk_score: 50, engagement_score: 50,
        total_checkins: 0,
      };
      usersById.set(user.id, user);
      usersByTg.set(telegramId, user.id);
      return user;
    },
    async allActiveUsers() {
      return []; // reminders run against a persistent DB only
    },
    async updateUser(userId, patch) {
      const user = { ...usersById.get(userId), ...patch };
      usersById.set(userId, user);
      return user;
    },
    async deleteUser(userId) {
      const user = usersById.get(userId);
      if (user) usersByTg.delete(user.telegram_id);
      usersById.delete(userId);
      kb.delete(userId);
      const purge = (arr) => {
        for (let i = arr.length - 1; i >= 0; i--) if (arr[i].user_id === userId) arr.splice(i, 1);
      };
      [glucose, meds, health, labs, challenges, serviceReqs].forEach(purge);
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
    async recordMessage(userId) {
      const k = kb.get(userId) || { message_count: 0 };
      k.message_count = (k.message_count || 0) + 1;
      k.last_seen = nowISO();
      kb.set(userId, k);
    },
    async upsertKB(userId, content) {
      const k = kb.get(userId) || { message_count: 0 };
      k.content = content;
      k.updated_at = nowISO();
      kb.set(userId, k);
    },
    async windowRaw(userId, days) {
      const since = daysAgoISO(days);
      const within = (arr) => arr.filter((r) => r.user_id === userId && r.created_at >= since);
      return { g: within(glucose), m: within(meds), h: within(health) };
    },
    async joinChallenge(userId, type, code) {
      if (challenges.some((c) => c.user_id === userId && c.challenge_type === type && c.status === "active")) {
        return { already: true };
      }
      challenges.push({ user_id: userId, challenge_type: type, code: code || null, status: "active", started_at: nowISO() });
      return { already: false };
    },
    async listChallenges(userId) {
      return challenges.filter((c) => c.user_id === userId && c.status === "active");
    },
    async addServiceRequest(userId, serviceType) {
      const id = reqSeq++;
      serviceReqs.push({ id, user_id: userId, service_type: serviceType, status: "requested", created_at: nowISO() });
      return id;
    },
    async saveProfileAnswer(userId, key, value) {
      const user = usersById.get(userId);
      if (!user) return;
      user.profile_answers = { ...(user.profile_answers || {}), [key]: value == null ? "" : String(value) };
    },
    async findMedicationByName(userId, name) {
      const needle = String(name || "").toLowerCase();
      return (
        medsMaster.find(
          (m) => m.user_id === userId && m.active && String(m.name).toLowerCase() === needle
        ) || null
      );
    },
    async listMedications(userId) {
      return medsMaster.filter((m) => m.user_id === userId && m.active);
    },
    async addMedicationMaster(userId, name, dose, frequency, reminderEnabled) {
      const row = {
        id: "m" + medSeq++,
        user_id: userId,
        name,
        dose,
        frequency,
        reminder_enabled: !!reminderEnabled,
        active: true,
        created_at: nowISO(),
      };
      medsMaster.push(row);
      return row;
    },
    async addSymptomLog(userId, sx) {
      symptoms.push({ user_id: userId, symptoms: sx, created_at: nowISO() });
    },
    async addReminderSchedule(userId, fields) {
      const row = { id: "r" + remSeq++, user_id: userId, active: true, created_at: nowISO(), ...fields };
      reminders.push(row);
      return row;
    },
    async listReminders(userId) {
      return reminders.filter((r) => r.user_id === userId && r.active);
    },
    async deactivateReminder(userId, id) {
      const r = reminders.find((x) => x.user_id === userId && x.id === id);
      if (r) r.active = false;
    },
    async dueReminders(nowIso) {
      return reminders.filter((r) => r.active && r.next_fire_at && r.next_fire_at <= nowIso);
    },
    async markReminderFired(id, nextFireAt) {
      const r = reminders.find((x) => x.id === id);
      if (r) {
        r.last_fired_at = nowISO();
        r.next_fire_at = nextFireAt;
      }
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
export const createUser = (tg, source) => backend.createUser(tg, source);
export const updateUser = (id, patch) => backend.updateUser(id, patch);
export const deleteUser = (id) => backend.deleteUser(id);
export const allActiveUsers = () => backend.allActiveUsers();

export async function getOrCreateUser(telegramId, source = "telegram") {
  return (await backend.getUserByTelegramId(telegramId)) || (await backend.createUser(telegramId, source));
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
export const recordMessage = (id) => backend.recordMessage(id);
export const upsertKB = (id, content) => backend.upsertKB(id, content);

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

// Stats over an arbitrary window (days). Adds an in-range % using simple
// thresholds (fasting in-range ≤130; otherwise ≤180; low <70 counts out).
export async function periodStats(userId, days = 30) {
  const { g, m, h } = await backend.windowRaw(userId, days);
  const values = g.map((r) => Number(r.value_mgdl)).filter((n) => !Number.isNaN(n));
  const inRange = g.filter((r) => {
    const v = Number(r.value_mgdl);
    if (Number.isNaN(v) || v < 70) return false;
    const hi = r.context === "fasting" ? 130 : 180;
    return v <= hi;
  }).length;
  return {
    days,
    glucoseCount: g.length,
    glucoseAvg: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null,
    glucoseMin: values.length ? Math.min(...values) : null,
    glucoseMax: values.length ? Math.max(...values) : null,
    inRangePct: values.length ? Math.round((inRange / values.length) * 100) : null,
    medicationCount: m.length,
    healthCount: h.length,
  };
}

export const joinChallenge = (id, type, code) => backend.joinChallenge(id, type, code);
export const listChallenges = (id) => backend.listChallenges(id);
export const addServiceRequest = (id, type) => backend.addServiceRequest(id, type);
export const saveProfileAnswer = (id, key, value) => backend.saveProfileAnswer(id, key, value);

// --- Build 1 helpers ---
export const findMedicationByName = (id, name) => backend.findMedicationByName(id, name);
export const listMedications = (id) => backend.listMedications(id);
export const addMedicationMaster = (id, name, dose, freq, rem) =>
  backend.addMedicationMaster(id, name, dose, freq, rem);
export const addSymptomLog = (id, sx) => backend.addSymptomLog(id, sx);
export const addReminderSchedule = (id, fields) => backend.addReminderSchedule(id, fields);
export const listReminders = (id) => backend.listReminders(id);
export const deactivateReminder = (id, rid) => backend.deactivateReminder(id, rid);
export const dueReminders = (nowIso = new Date().toISOString()) =>
  backend.dueReminders ? backend.dueReminders(nowIso) : Promise.resolve([]);
export const markReminderFired = (rid, nextFireAt) =>
  backend.markReminderFired ? backend.markReminderFired(rid, nextFireAt) : Promise.resolve();
