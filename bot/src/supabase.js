// Data layer. Uses Supabase (Postgres) when configured, otherwise an
// in-memory store so the bot can run with just Telegram + LLM keys.
// NOTE: in-memory data resets when the process restarts.

import { config } from "./config.js";
import { logError, logWarn } from "./log.js";

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
    async getUserByPhoneNumber(phone) {
      const { data, error } = await db.from("users").select("*").eq("phone_number", phone).maybeSingle();
      if (error) throw error;
      return data;
    },
    async createUser(telegramId, source = "telegram") {
      const { data, error } = await db
        .from("users")
        .insert({ telegram_id: telegramId, tier: config.defaultTier, source })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    // Insert-or-return for WhatsApp. Postgres error code 23505 = unique_violation.
    // When two webhooks from the same user arrive concurrently, one INSERT wins
    // and the loser reads the winning row back — both callers end up with the
    // same user row, so no duplicate profile.
    async createUserByPhone(phone, source = "whatsapp") {
      const { data, error } = await db
        .from("users")
        .insert({ phone_number: phone, tier: config.defaultTier, source })
        .select("*")
        .single();
      if (!error) return data;
      const isDup = error?.code === "23505" || /duplicate key|unique constraint/i.test(error?.message || "");
      if (isDup) {
        const existing = await this.getUserByPhoneNumber(phone);
        if (existing) return existing;
      }
      throw error;
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
    async addLabReport(userId, rawInput, analysis, extras = {}) {
      const { error } = await db.from("lab_reports").insert({
        user_id: userId,
        raw_input: rawInput,
        analysis,
        metadata: extras.metadata ?? null,
        lab_values: extras.values ?? null,
        lab_source: extras.lab_source ?? null,
      });
      if (error) throw error;
    },
    async countLabReportsSince(userId, sinceIso) {
      const { count, error } = await db
        .from("lab_reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", sinceIso);
      if (error) throw error;
      return count || 0;
    },
    async recentLabReports(userId, limit) {
      const { data, error } = await db
        .from("lab_reports")
        .select("lab_values, metadata, created_at")
        .eq("user_id", userId)
        .not("lab_values", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map((r) => ({ values: r.lab_values, metadata: r.metadata, created_at: r.created_at }));
    },
    async saveCoachMessage(userId, kind, role, content) {
      try {
        await db.from("coach_messages").insert({ user_id: userId, kind, role, content });
      } catch {
        /* best-effort */
      }
    },
    async saveVoiceNote(userId, dataUrl, content = "[voice note]") {
      try {
        await db.from("coach_messages").insert({
          user_id: userId, kind: "voice", role: "user", content,
          media_type: "audio", media_data: dataUrl,
        });
      } catch (e) {
        logError("saveVoiceNote", e?.message);
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
    // --- My Goals (2026-07) ---
    async listActiveGoals(userId) {
      const { data } = await db
        .from("user_goals")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: true });
      return data || [];
    },
    async listAllGoals(userId) {
      const { data } = await db
        .from("user_goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    async getGoal(userId, goalId) {
      const { data } = await db
        .from("user_goals")
        .select("*")
        .eq("user_id", userId)
        .eq("id", goalId)
        .maybeSingle();
      return data || null;
    },
    async addGoal(userId, fields) {
      const { data } = await db
        .from("user_goals")
        .insert({ user_id: userId, status: "active", ...fields })
        .select("*")
        .single();
      return data;
    },
    async updateGoal(userId, goalId, patch) {
      const { data } = await db
        .from("user_goals")
        .update(patch)
        .eq("user_id", userId)
        .eq("id", goalId)
        .select("*")
        .single();
      return data;
    },
    async goalsDueForReview(todayIso) {
      // Active goals whose target_date is on or before today and haven't
      // been reviewed yet. Scheduler tick calls this once per run.
      const { data } = await db
        .from("user_goals")
        .select("*")
        .eq("status", "active")
        .not("target_date", "is", null)
        .lte("target_date", todayIso)
        .is("review_sent_at", null)
        .limit(200);
      return data || [];
    },
    // --- Engagement Engine (Build 1) ---
    async listMessageBlocks({ kind, language, active = true } = {}) {
      let q = db.from("message_blocks").select("*");
      if (kind) q = q.eq("kind", kind);
      if (language) q = q.eq("language", language);
      if (active !== undefined) q = q.eq("active", active);
      const { data } = await q.order("sort_order").order("id");
      return data || [];
    },
    async getEngagementConfig() {
      const { data } = await db.from("engagement_config").select("key, value_num");
      const out = {};
      for (const r of data || []) out[r.key] = Number(r.value_num);
      return out;
    },
    async recentBlockIdsForUser(userId, sinceIso) {
      const { data } = await db
        .from("daily_message_log")
        .select("block_ids, sent_at")
        .eq("user_id", userId)
        .gte("sent_at", sinceIso)
        .order("sent_at", { ascending: false });
      const out = new Map();
      for (const r of data || []) for (const id of r.block_ids || []) if (!out.has(id)) out.set(id, r.sent_at);
      return out;
    },
    async logDailyMessage(row) {
      const { error } = await db.from("daily_message_log").insert(row);
      if (error && error.code !== "23505") throw error;
      return !error;
    },
    async alreadySentToday(userId, date) {
      const { data } = await db
        .from("daily_message_log")
        .select("id")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();
      return !!data;
    },
    async daysActiveInWindow(userId, days) {
      const since = daysAgoISO(days);
      const tables = ["glucose_logs", "medication_logs", "health_logs", "wellbeing_logs"];
      const set = new Set();
      for (const tbl of tables) {
        const { data } = await db.from(tbl).select("created_at").eq("user_id", userId).gte("created_at", since);
        for (const r of data || []) set.add(String(r.created_at).slice(0, 10));
      }
      return set.size;
    },
    async lastInteractionAt(userId) {
      // Take the max of patient_kb.last_seen and every log table's latest row.
      const tables = ["glucose_logs", "medication_logs", "health_logs", "wellbeing_logs", "coach_messages"];
      let best = null;
      const { data: k } = await db.from("patient_kb").select("last_seen").eq("user_id", userId).maybeSingle();
      if (k?.last_seen) best = k.last_seen;
      for (const tbl of tables) {
        const { data } = await db
          .from(tbl)
          .select("created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);
        const ts = data?.[0]?.created_at;
        if (ts && (!best || ts > best)) best = ts;
      }
      return best;
    },
    async userDueReminders(userId, nowIso) {
      const { data } = await db
        .from("reminder_schedules")
        .select("*")
        .eq("active", true)
        .eq("user_id", userId)
        .lte("next_fire_at", nowIso);
      return data || [];
    },
    // ===== My Health (2026-07) =====
    async addConditions(userId, names, source, originalMessage) {
      const rows = (names || [])
        .map((n) => String(n).trim())
        .filter(Boolean)
        .map((condition_name) => ({
          user_id: userId, condition_name, status: "active",
          source: source || null, original_message: originalMessage || null,
        }));
      if (!rows.length) return [];
      const { data, error } = await db.from("user_conditions").insert(rows).select("*");
      if (error) throw error;
      return data || [];
    },
    async listConditions(userId) {
      const { data } = await db
        .from("user_conditions").select("*")
        .eq("user_id", userId).eq("status", "active").order("created_at");
      return data || [];
    },
    async setConditionStatus(userId, name, status) {
      await db.from("user_conditions").update({ status })
        .eq("user_id", userId).eq("status", "active").ilike("condition_name", name);
    },
    async clearConditions(userId) {
      await db.from("user_conditions").update({ status: "resolved" })
        .eq("user_id", userId).eq("status", "active");
    },
    async addHealthMedication(userId, f) {
      const { data, error } = await db.from("medications").insert({
        user_id: userId, name: f.name, generic_name: f.generic_name || null,
        dose: f.dose || null, frequency: f.frequency || null,
        source: f.source || null, original_message: f.original_message || null, active: true,
      }).select("*").single();
      if (error) throw error;
      return data;
    },
    async deactivateMedicationByName(userId, name) {
      const { data } = await db.from("medications").update({ active: false })
        .eq("user_id", userId).eq("active", true).ilike("name", `%${name}%`).select("*");
      return data || [];
    },
    async addHealthMetric(userId, f) {
      const { data, error } = await db.from("health_metrics").insert({
        user_id: userId, metric_type: f.metric_type, value: f.value ?? null,
        secondary_value: f.secondary_value ?? null, unit: f.unit || null,
        reading_context: f.reading_context || null, measurement_date: f.measurement_date || null,
        source: f.source || null, original_message: f.original_message || null,
      }).select("*").single();
      if (error) throw error;
      return data;
    },
    async latestMetrics(userId) {
      // supabase-js has no DISTINCT ON — pull recent rows and reduce client-side.
      const { data } = await db.from("health_metrics").select("*")
        .eq("user_id", userId)
        .order("measurement_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(200);
      const seen = new Map();
      for (const r of data || []) if (!seen.has(r.metric_type)) seen.set(r.metric_type, r);
      return [...seen.values()];
    },
    async upsertLifestyle(userId, f) {
      const existing = await this.getLifestyle(userId);
      const merged = {
        user_id: userId,
        smoking_status: f.smoking_status ?? existing?.smoking_status ?? null,
        smoking_quantity: f.smoking_quantity ?? existing?.smoking_quantity ?? null,
        activity_level: f.activity_level ?? existing?.activity_level ?? null,
        activity_type: f.activity_type ?? existing?.activity_type ?? null,
        original_message: f.original_message ?? existing?.original_message ?? null,
        last_updated_at: new Date().toISOString(),
      };
      const { data, error } = await db.from("user_lifestyle").upsert(merged, { onConflict: "user_id" }).select("*").single();
      if (error) throw error;
      return data;
    },
    async getLifestyle(userId) {
      const { data } = await db.from("user_lifestyle").select("*").eq("user_id", userId).maybeSingle();
      return data || null;
    },
    async addHealthGoal(userId, f) {
      await db.from("user_health_goal").update({ status: "replaced" })
        .eq("user_id", userId).eq("status", "active");
      const { data, error } = await db.from("user_health_goal").insert({
        user_id: userId, goal: f.goal, target_value: f.target_value || null, target_date: f.target_date || null,
      }).select("*").single();
      if (error) throw error;
      return data;
    },
    async getLatestHealthGoal(userId) {
      const { data } = await db.from("user_health_goal").select("*")
        .eq("user_id", userId).eq("status", "active")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data || null;
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
  pool.on("error", (e) => logError("Database pool", e?.message));

  // Fail fast & loud if the DB is unreachable, so it's obvious in the logs
  // (wrong DATABASE_URL, DB down, bad credentials) rather than every feature
  // silently erroring later.
  try {
    const c = await pool.connect();
    await c.query("select 1");
    c.release();
  } catch (e) {
    const why = /password|auth|role/i.test(e?.message)
      ? "authentication failed — check the credentials in DATABASE_URL."
      : /ENOTFOUND|ECONNREFUSED|timeout|EAI_AGAIN/i.test(e?.message)
      ? "cannot reach the database host — check DATABASE_URL and that the DB is running."
      : e?.message;
    throw new Error(why);
  }

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
    async getUserByPhoneNumber(phone) {
      const { rows } = await pool.query("select * from users where phone_number = $1", [phone]);
      return rows[0] || null;
    },
    async createUser(telegramId, source = "telegram") {
      const { rows } = await pool.query(
        "insert into users (telegram_id, tier, source) values ($1, $2, $3) returning *",
        [telegramId, config.defaultTier, source]
      );
      return rows[0];
    },
    // Insert-or-return for WhatsApp. If two webhooks race, one INSERT wins and
    // the loser catches the 23505 and re-reads the winning row. Both callers
    // end up with the same user row — no duplicates, no lost profile.
    async createUserByPhone(phone, source = "whatsapp") {
      try {
        const { rows } = await pool.query(
          "insert into users (phone_number, tier, source) values ($1, $2, $3) returning *",
          [phone, config.defaultTier, source]
        );
        return rows[0];
      } catch (e) {
        if (e?.code === "23505") {
          const existing = await this.getUserByPhoneNumber(phone);
          if (existing) return existing;
        }
        throw e;
      }
    },
    async allActiveUsers() {
      const { rows } = await pool.query(
        `select u.id, u.telegram_id, u.phone_number, u.source, u.language, u.streak,
                u.last_log_date, u.last_reminder_date, u.last_streak_date,
                u.last_winback_date, u.last_summary_date,
                u.name, u.age, u.date_of_birth, u.created_at, u.onboarded,
                coalesce(u.account_status, 'active') as account_status,
                kb.last_seen
         from users u left join patient_kb kb on kb.user_id = u.id
         where u.onboarded
           and coalesce(u.account_status, 'active') = 'active'
           and coalesce(u.source,'telegram') in ('telegram','whatsapp')`
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
    async addLabReport(userId, rawInput, analysis, extras = {}) {
      await insertDynamic("lab_reports", {
        user_id: userId,
        raw_input: rawInput,
        analysis,
        metadata: extras.metadata ?? null,
        lab_values: extras.values ?? null,
        lab_source: extras.lab_source ?? null,
      });
    },
    async countLabReportsSince(userId, sinceIso) {
      const { rows } = await pool.query(
        "select count(*)::int as n from lab_reports where user_id=$1 and created_at>=$2",
        [userId, sinceIso]
      );
      return rows[0]?.n || 0;
    },
    async recentLabReports(userId, limit) {
      const { rows } = await pool.query(
        `select lab_values as values, metadata, created_at
           from lab_reports
          where user_id=$1 and lab_values is not null
          order by created_at desc
          limit $2`,
        [userId, limit]
      );
      return rows;
    },
    async saveCoachMessage(userId, kind, role, content) {
      try {
        await insertDynamic("coach_messages", { user_id: userId, kind, role, content });
      } catch {
        /* best-effort */
      }
    },
    // Persist an inbound media message (e.g. a WhatsApp voice note) as a
    // coach_messages row so it appears in the admin Conversation view.
    // `dataUrl` is a self-contained data: URL (base64) — no file storage needed.
    async saveVoiceNote(userId, dataUrl, content = "[voice note]") {
      try {
        await insertDynamic("coach_messages", {
          user_id: userId, kind: "voice", role: "user", content,
          media_type: "audio", media_data: dataUrl,
        });
      } catch (e) {
        logError("saveVoiceNote", e?.message);
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

    // ---- Check-In v2 helpers (2026-07) ----
    async countGlucose(userId) {
      const { rows } = await pool.query("select count(*)::int as n from glucose_logs where user_id=$1", [userId]);
      return rows[0]?.n || 0;
    },
    async countMedicationLogs(userId) {
      const { rows } = await pool.query("select count(*)::int as n from medication_logs where user_id=$1", [userId]);
      return rows[0]?.n || 0;
    },
    async countWeightEntries(userId) {
      const { rows } = await pool.query(
        "select count(*)::int as n from health_logs where user_id=$1 and weight_kg is not null",
        [userId]
      );
      return rows[0]?.n || 0;
    },
    async countActivityEntries(userId) {
      const { rows } = await pool.query(
        `select count(*)::int as n from health_logs
         where user_id=$1 and (steps is not null or note ilike '%activity%' or note ilike '%walk%' or note ilike '%gym%')`,
        [userId]
      );
      return rows[0]?.n || 0;
    },
    async addGlucoseFull(userId, { value, unit, measure_kind, context, note }) {
      await insertDynamic("glucose_logs", {
        user_id: userId,
        value_mgdl: value,
        context: context || measure_kind || "random",
        unit: unit || "mg_dl",
        measure_kind: measure_kind || null,
        note: note || null,
      });
    },
    async addWellbeingLog(userId, { score, label, note, category }) {
      await insertDynamic("wellbeing_logs", {
        user_id: userId,
        score,
        label: label || null,
        note: note || null,
        category: category || "unclassified",
      });
    },
    async addT1ConfidenceLog(userId, level) {
      await insertDynamic("t1_confidence_logs", { user_id: userId, level });
      const { rows } = await pool.query(
        `update users set t1_confidence = $1, t1_confidence_updated_at = now(), updated_at = now()
           where id = $2 returning *`,
        [level, userId]
      );
      return rows[0];
    },
    // ---- T1 Community content (read-only from the bot; managed via Admin Portal) ----
    async listT1Organizations() {
      const { rows } = await pool.query(
        `select id, name, description, website, contact, logo_url,
                facebook_url, instagram_url, twitter_url, youtube_url
           from t1_organizations
          where active
          order by sort_order, name`
      );
      return rows;
    },
    async listT1Articles(limit = 10) {
      const { rows } = await pool.query(
        `select id, title, summary, url, source, audience
           from t1_articles
          where active
          order by sort_order, title
          limit $1`,
        [limit]
      );
      return rows;
    },
    async listT1Videos(limit = 10) {
      const { rows } = await pool.query(
        `select id, title, description, url, source, audience
           from t1_videos
          where active
          order by sort_order, title
          limit $1`,
        [limit]
      );
      return rows;
    },
    async listT1DailyLifeTopics(category = null) {
      const params = [];
      let where = "active";
      if (category) {
        params.push(category);
        where += ` and category = $${params.length}`;
      }
      const { rows } = await pool.query(
        `select id, category, title, pdf_url
           from t1_daily_life_topics
          where ${where}
          order by category, sort_order, title`,
        params
      );
      return rows;
    },
    async getT1DailyLifeTopic(id) {
      const { rows } = await pool.query(
        `select id, category, title, pdf_url from t1_daily_life_topics where id = $1 and active`,
        [id]
      );
      return rows[0] || null;
    },
    async listT1Events(limit = 20) {
      const { rows } = await pool.query(
        `select id, description, event_date, url
           from t1_events
          where active
          order by event_date nulls last, sort_order, id
          limit $1`,
        [limit]
      );
      return rows;
    },
    async addMedicationMasterFull(userId, fields) {
      const cols = ["user_id", "name", "dose", "frequency", "reminder_enabled", "active", "units", "is_insulin", "preferred_time"];
      const vals = [
        userId,
        fields.name,
        fields.dose || null,
        fields.frequency || null,
        !!fields.reminder_enabled,
        true,
        fields.units || null,
        !!fields.is_insulin,
        fields.preferred_time || null,
      ];
      const { rows } = await pool.query(
        `insert into medications (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")}) returning *`,
        vals
      );
      return rows[0];
    },
    async enrollMedConsistency(userId) {
      await pool.query(
        `insert into med_consistency (user_id, enrolled, phase, yes_streak)
         values ($1, true, 1, 0)
         on conflict (user_id) do update set enrolled = true, phase = 1, yes_streak = 0`,
        [userId]
      );
    },
    async getMedConsistency(userId) {
      const { rows } = await pool.query("select * from med_consistency where user_id=$1", [userId]);
      return rows[0] || null;
    },
    async updateMedConsistency(userId, patch) {
      const keys = Object.keys(patch);
      if (!keys.length) return;
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const vals = keys.map((k) => patch[k]);
      await pool.query(`update med_consistency set ${set} where user_id = $${vals.length + 1}`, [...vals, userId]);
    },
    async logMedConsistencyResponse(userId, taken, reason) {
      await insertDynamic("med_consistency_responses", { user_id: userId, taken: !!taken, reason: reason || null });
    },
    async addMedSatisfaction(userId, response, note) {
      await insertDynamic("med_satisfaction", { user_id: userId, response, note: note || null });
    },

    // --- My Goals (2026-07) ---
    async listActiveGoals(userId) {
      const { rows } = await pool.query(
        "select * from user_goals where user_id=$1 and status='active' order by created_at asc",
        [userId]
      );
      return rows;
    },
    async listAllGoals(userId) {
      const { rows } = await pool.query(
        "select * from user_goals where user_id=$1 order by created_at desc",
        [userId]
      );
      return rows;
    },
    async getGoal(userId, goalId) {
      const { rows } = await pool.query(
        "select * from user_goals where user_id=$1 and id=$2",
        [userId, goalId]
      );
      return rows[0] || null;
    },
    async addGoal(userId, fields) {
      const obj = { user_id: userId, status: "active", ...fields };
      const keys = Object.keys(obj);
      const cols = keys.join(", ");
      const ph = keys.map((_, i) => `$${i + 1}`).join(", ");
      const { rows } = await pool.query(
        `insert into user_goals (${cols}) values (${ph}) returning *`,
        Object.values(obj)
      );
      return rows[0];
    },
    async updateGoal(userId, goalId, patch) {
      const keys = Object.keys(patch);
      if (!keys.length) return this.getGoal(userId, goalId);
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const vals = keys.map((k) => patch[k]);
      const { rows } = await pool.query(
        `update user_goals set ${set} where user_id=$${vals.length + 1} and id=$${vals.length + 2} returning *`,
        [...vals, userId, goalId]
      );
      return rows[0];
    },
    async goalsDueForReview(todayIso) {
      const { rows } = await pool.query(
        `select * from user_goals
         where status='active' and target_date is not null
           and target_date <= $1::date and review_sent_at is null
         order by target_date limit 200`,
        [todayIso]
      );
      return rows;
    },

    // --- Engagement Engine (Build 1) ---
    async listMessageBlocks({ kind, language, active = true } = {}) {
      const clauses = [];
      const vals = [];
      if (kind) { vals.push(kind); clauses.push(`kind = $${vals.length}`); }
      if (language) { vals.push(language); clauses.push(`language = $${vals.length}`); }
      if (active !== undefined) { vals.push(active); clauses.push(`active = $${vals.length}`); }
      const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
      const { rows } = await pool.query(
        `select * from message_blocks ${where} order by sort_order, id`, vals
      );
      return rows;
    },
    async getEngagementConfig() {
      const { rows } = await pool.query("select key, value_num from engagement_config");
      const out = {};
      for (const r of rows) out[r.key] = Number(r.value_num);
      return out;
    },
    async recentBlockIdsForUser(userId, sinceIso) {
      // Map: block_id -> most recent sent_at. Callers filter by cooldown window.
      const { rows } = await pool.query(
        `select block_ids, sent_at from daily_message_log
         where user_id = $1 and sent_at >= $2
         order by sent_at desc`,
        [userId, sinceIso]
      );
      const out = new Map();
      for (const r of rows) for (const id of r.block_ids || []) if (!out.has(id)) out.set(id, r.sent_at);
      return out;
    },
    async logDailyMessage(row) {
      // Unique (user_id, date) makes this the idempotency point. A duplicate
      // insert on the same day is rejected with 23505 — caller reads that as
      // "someone else already sent, don't send again".
      try {
        await insertDynamic("daily_message_log", row);
        return true;
      } catch (e) {
        if (e?.code === "23505") return false;
        throw e;
      }
    },
    async alreadySentToday(userId, date) {
      const { rows } = await pool.query(
        "select 1 from daily_message_log where user_id=$1 and date=$2::date limit 1",
        [userId, date]
      );
      return rows.length > 0;
    },
    async daysActiveInWindow(userId, days) {
      // Distinct calendar days touched by any of the four log tables. UNION
      // ALL + outer distinct so Postgres can plan each source with the user
      // index; count(distinct date_trunc) at the end folds duplicates.
      const { rows } = await pool.query(
        `select count(distinct d)::int as n from (
           select date_trunc('day', created_at) d from glucose_logs   where user_id=$1 and created_at >= now() - ($2 || ' days')::interval
           union all
           select date_trunc('day', created_at) d from medication_logs where user_id=$1 and created_at >= now() - ($2 || ' days')::interval
           union all
           select date_trunc('day', created_at) d from health_logs     where user_id=$1 and created_at >= now() - ($2 || ' days')::interval
           union all
           select date_trunc('day', created_at) d from wellbeing_logs  where user_id=$1 and created_at >= now() - ($2 || ' days')::interval
         ) t`,
        [userId, String(days)]
      );
      return rows[0]?.n || 0;
    },
    async lastInteractionAt(userId) {
      // Greatest of patient_kb.last_seen and the max(created_at) across the
      // user's log tables. Returned as an ISO string (or null).
      const { rows } = await pool.query(
        `select greatest(
           (select last_seen from patient_kb where user_id=$1),
           (select max(created_at) from glucose_logs   where user_id=$1),
           (select max(created_at) from medication_logs where user_id=$1),
           (select max(created_at) from health_logs     where user_id=$1),
           (select max(created_at) from wellbeing_logs  where user_id=$1),
           (select max(created_at) from coach_messages  where user_id=$1)
         ) as last_at`,
        [userId]
      );
      return rows[0]?.last_at || null;
    },
    async userDueReminders(userId, nowIso) {
      const { rows } = await pool.query(
        `select * from reminder_schedules
         where active and user_id = $1 and next_fire_at <= $2
         order by next_fire_at`,
        [userId, nowIso]
      );
      return rows;
    },
    async activityCountsSince(userId, sinceIso) {
      // Cheap counts feeding the engagement score. One query, one round-trip.
      const { rows } = await pool.query(
        `select
           (select count(*)::int from glucose_logs   where user_id=$1 and created_at >= $2) as glucose,
           (select count(*)::int from medication_logs where user_id=$1 and created_at >= $2) as medication,
           (select count(*)::int from health_logs     where user_id=$1 and created_at >= $2) as checkin,
           (select count(*)::int from wellbeing_logs  where user_id=$1 and created_at >= $2) as wellbeing,
           (select count(*)::int from coach_messages  where user_id=$1 and role='user' and created_at >= $2) as coach,
           (select count(*)::int from glucose_logs   where user_id=$1 and created_at >= $2
              and ((context='fasting' and value_mgdl between 70 and 130)
                or (context<>'fasting' and value_mgdl between 70 and 180))) as in_range`,
        [userId, sinceIso]
      );
      return rows[0] || { glucose: 0, medication: 0, checkin: 0, wellbeing: 0, coach: 0, in_range: 0 };
    },
    // ===== My Health (2026-07) =====
    async addConditions(userId, names, source, originalMessage) {
      const list = (names || []).map((n) => String(n).trim()).filter(Boolean);
      if (!list.length) return [];
      const values = list
        .map((_, i) => `($1, $${i + 2}, 'active', $${list.length + 2}, $${list.length + 3})`)
        .join(", ");
      const { rows } = await pool.query(
        `insert into user_conditions (user_id, condition_name, status, source, original_message)
         values ${values} returning *`,
        [userId, ...list, source || null, originalMessage || null]
      );
      return rows;
    },
    async listConditions(userId) {
      const { rows } = await pool.query(
        "select * from user_conditions where user_id=$1 and status='active' order by created_at",
        [userId]
      );
      return rows;
    },
    async setConditionStatus(userId, name, status) {
      await pool.query(
        "update user_conditions set status=$3 where user_id=$1 and lower(condition_name)=lower($2) and status='active'",
        [userId, name, status]
      );
    },
    async clearConditions(userId) {
      await pool.query(
        "update user_conditions set status='resolved' where user_id=$1 and status='active'",
        [userId]
      );
    },
    async addHealthMedication(userId, f) {
      const { rows } = await pool.query(
        `insert into medications (user_id, name, generic_name, dose, frequency, source, original_message, active)
         values ($1,$2,$3,$4,$5,$6,$7,true) returning *`,
        [userId, f.name, f.generic_name || null, f.dose || null, f.frequency || null, f.source || null, f.original_message || null]
      );
      return rows[0];
    },
    async deactivateMedicationByName(userId, name) {
      const { rows } = await pool.query(
        "update medications set active=false where user_id=$1 and active and lower(name) like lower($2) returning *",
        [userId, `%${name}%`]
      );
      return rows;
    },
    async addHealthMetric(userId, f) {
      const { rows } = await pool.query(
        `insert into health_metrics
           (user_id, metric_type, value, secondary_value, unit, reading_context, measurement_date, source, original_message)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
        [
          userId, f.metric_type, f.value ?? null, f.secondary_value ?? null,
          f.unit || null, f.reading_context || null, f.measurement_date || null,
          f.source || null, f.original_message || null,
        ]
      );
      return rows[0];
    },
    async latestMetrics(userId) {
      const { rows } = await pool.query(
        `select distinct on (metric_type) *
           from health_metrics where user_id=$1
          order by metric_type, measurement_date desc nulls last, created_at desc`,
        [userId]
      );
      return rows;
    },
    async upsertLifestyle(userId, f) {
      const { rows } = await pool.query(
        `insert into user_lifestyle
           (user_id, smoking_status, smoking_quantity, activity_level, activity_type, original_message, last_updated_at)
         values ($1,$2,$3,$4,$5,$6, now())
         on conflict (user_id) do update set
           smoking_status   = coalesce(excluded.smoking_status,   user_lifestyle.smoking_status),
           smoking_quantity = coalesce(excluded.smoking_quantity, user_lifestyle.smoking_quantity),
           activity_level   = coalesce(excluded.activity_level,   user_lifestyle.activity_level),
           activity_type    = coalesce(excluded.activity_type,    user_lifestyle.activity_type),
           original_message = coalesce(excluded.original_message, user_lifestyle.original_message),
           last_updated_at  = now()
         returning *`,
        [userId, f.smoking_status || null, f.smoking_quantity || null, f.activity_level || null, f.activity_type || null, f.original_message || null]
      );
      return rows[0];
    },
    async getLifestyle(userId) {
      const { rows } = await pool.query("select * from user_lifestyle where user_id=$1", [userId]);
      return rows[0] || null;
    },
    async addHealthGoal(userId, f) {
      await pool.query(
        "update user_health_goal set status='replaced' where user_id=$1 and status='active'",
        [userId]
      );
      const { rows } = await pool.query(
        `insert into user_health_goal (user_id, goal, target_value, target_date)
         values ($1,$2,$3,$4) returning *`,
        [userId, f.goal, f.target_value || null, f.target_date || null]
      );
      return rows[0];
    },
    async getLatestHealthGoal(userId) {
      const { rows } = await pool.query(
        "select * from user_health_goal where user_id=$1 and status='active' order by created_at desc limit 1",
        [userId]
      );
      return rows[0] || null;
    },
  };
}

// ----------------------------------------------------------------
// In-memory backend
// ----------------------------------------------------------------
function makeMemoryBackend() {
  const usersById = new Map();
  const usersByTg = new Map();
  const usersByPhone = new Map();
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
  const goals = [];
  const conditions = [];
  const healthMetrics = [];
  const lifestyle = new Map();
  const healthGoals = [];
  let condSeq = 1;
  let metricSeq = 1;
  let hgSeq = 1;
  let seq = 1;
  let reqSeq = 1;
  let medSeq = 1;
  let remSeq = 1;
  let goalSeq = 1;

  const blankUser = (overrides) => ({
    id: "u" + seq++,
    telegram_id: null,
    phone_number: null,
    name: null, age: null, gender: null, city: null, language: "en",
    height_cm: null, weight_kg: null, diabetes_status: null, goals: null, medications: null,
    doctor_code: null, challenge_code: null, team_code: null,
    tier: config.defaultTier, streak: 0, last_log_date: null, onboarded: false,
    source: "telegram", created_at: nowISO(),
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
    ...overrides,
  });

  return {
    async getUserByTelegramId(telegramId) {
      const id = usersByTg.get(telegramId);
      return id ? usersById.get(id) : null;
    },
    async getUserByPhoneNumber(phone) {
      const id = usersByPhone.get(phone);
      return id ? usersById.get(id) : null;
    },
    async createUser(telegramId, source = "telegram") {
      const user = blankUser({ telegram_id: telegramId, source });
      usersById.set(user.id, user);
      usersByTg.set(telegramId, user.id);
      return user;
    },
    async createUserByPhone(phone, source = "whatsapp") {
      // Same-tick race protection for the in-memory backend.
      const existingId = usersByPhone.get(phone);
      if (existingId) return usersById.get(existingId);
      const user = blankUser({ phone_number: phone, source });
      usersById.set(user.id, user);
      usersByPhone.set(phone, user.id);
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
      if (user) {
        if (user.telegram_id != null) usersByTg.delete(user.telegram_id);
        if (user.phone_number != null) usersByPhone.delete(user.phone_number);
      }
      usersById.delete(userId);
      kb.delete(userId);
      lifestyle.delete(userId);
      const purge = (arr) => {
        for (let i = arr.length - 1; i >= 0; i--) if (arr[i].user_id === userId) arr.splice(i, 1);
      };
      [glucose, meds, health, labs, challenges, serviceReqs, goals, conditions, healthMetrics, healthGoals, medsMaster].forEach(purge);
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
    async addLabReport(userId, rawInput, analysis, extras = {}) {
      labs.push({
        user_id: userId,
        raw_input: rawInput,
        analysis,
        metadata: extras.metadata ?? null,
        values: extras.values ?? null,
        lab_source: extras.lab_source ?? null,
        created_at: nowISO(),
      });
    },
    async countLabReportsSince(userId, sinceIso) {
      return labs.filter((r) => r.user_id === userId && r.created_at >= sinceIso).length;
    },
    async recentLabReports(userId, limit) {
      return labs
        .filter((r) => r.user_id === userId && r.values != null)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, limit);
    },
    async saveCoachMessage() {
      /* not persisted in memory mode */
    },
    async saveVoiceNote() {
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
    // Check-In v2 helpers — in-memory stubs (used when Postgres is unavailable)
    async countGlucose(userId) { return glucose.filter((r) => r.user_id === userId).length; },
    async countMedicationLogs(userId) { return meds.filter((r) => r.user_id === userId).length; },
    async countWeightEntries(userId) {
      return health.filter((r) => r.user_id === userId && r.weight_kg != null).length;
    },
    async countActivityEntries(userId) {
      return health.filter((r) => r.user_id === userId && r.steps != null).length;
    },
    async addGlucoseFull(userId, { value, context }) {
      glucose.push({ user_id: userId, value_mgdl: value, context: context || "random", created_at: nowISO() });
    },
    async addWellbeingLog() { /* not persisted in memory mode */ },
    async addT1ConfidenceLog(userId, level) {
      const user = usersById.get(userId);
      if (!user) return null;
      user.t1_confidence = level;
      user.t1_confidence_updated_at = nowISO();
      return user;
    },
    async listT1Organizations() { return []; },
    async listT1Articles() { return []; },
    async listT1Videos() { return []; },
    async listT1DailyLifeTopics() { return []; },
    async getT1DailyLifeTopic() { return null; },
    async listT1Events() { return []; },
    async addMedicationMasterFull(userId, fields) {
      const row = { id: "m" + medSeq++, user_id: userId, active: true, created_at: nowISO(), ...fields };
      medsMaster.push(row);
      return row;
    },
    async enrollMedConsistency() { /* stub */ },
    async getMedConsistency() { return null; },
    async updateMedConsistency() { /* stub */ },
    async logMedConsistencyResponse() { /* stub */ },
    async addMedSatisfaction() { /* stub */ },
    // --- My Goals (2026-07) ---
    async listActiveGoals(userId) {
      return goals
        .filter((g) => g.user_id === userId && g.status === "active")
        .sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
    },
    async listAllGoals(userId) {
      return goals
        .filter((g) => g.user_id === userId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
    async getGoal(userId, goalId) {
      return goals.find((g) => g.user_id === userId && g.id === goalId) || null;
    },
    async addGoal(userId, fields) {
      const row = {
        id: "g" + goalSeq++,
        user_id: userId,
        status: "active",
        review_sent_at: null,
        completed_at: null,
        created_at: nowISO(),
        updated_at: nowISO(),
        title: null,
        suggestion_key: null,
        motivation: null,
        target_date: null,
        target_hint: null,
        ...fields,
      };
      goals.push(row);
      return row;
    },
    async updateGoal(userId, goalId, patch) {
      const g = goals.find((x) => x.user_id === userId && x.id === goalId);
      if (!g) return null;
      Object.assign(g, patch, { updated_at: nowISO() });
      return g;
    },
    async goalsDueForReview(todayIso) {
      const today = todayIso.slice(0, 10);
      return goals.filter(
        (g) => g.status === "active" && g.target_date && g.target_date <= today && !g.review_sent_at
      );
    },
    // --- Engagement Engine stubs (memory backend: composer only runs
    //     against a durable DB, so these return empty/no-op) ---
    async listMessageBlocks() { return []; },
    async getEngagementConfig() { return {}; },
    async recentBlockIdsForUser() { return new Map(); },
    async logDailyMessage() { return true; },
    async alreadySentToday() { return false; },
    async daysActiveInWindow() { return 0; },
    async lastInteractionAt() { return null; },
    async userDueReminders() { return []; },
    async activityCountsSince() {
      return { glucose: 0, medication: 0, checkin: 0, wellbeing: 0, coach: 0, in_range: 0 };
    },
    // ===== My Health (2026-07) =====
    async addConditions(userId, names, source, originalMessage) {
      const created = [];
      for (const raw of names || []) {
        const condition_name = String(raw).trim();
        if (!condition_name) continue;
        const row = {
          id: "c" + condSeq++, user_id: userId, condition_name, status: "active",
          source: source || null, original_message: originalMessage || null, created_at: nowISO(),
        };
        conditions.push(row);
        created.push(row);
      }
      return created;
    },
    async listConditions(userId) {
      return conditions.filter((c) => c.user_id === userId && c.status === "active");
    },
    async setConditionStatus(userId, name, status) {
      const needle = String(name).toLowerCase();
      for (const c of conditions) {
        if (c.user_id === userId && c.status === "active" && c.condition_name.toLowerCase().includes(needle)) {
          c.status = status;
        }
      }
    },
    async clearConditions(userId) {
      for (const c of conditions) if (c.user_id === userId && c.status === "active") c.status = "resolved";
    },
    async addHealthMedication(userId, f) {
      const row = {
        id: "m" + medSeq++, user_id: userId, active: true, created_at: nowISO(),
        name: f.name, generic_name: f.generic_name || null, dose: f.dose || null,
        frequency: f.frequency || null, source: f.source || null, original_message: f.original_message || null,
      };
      medsMaster.push(row);
      return row;
    },
    async deactivateMedicationByName(userId, name) {
      const needle = String(name).toLowerCase();
      const hit = [];
      for (const m of medsMaster) {
        if (m.user_id === userId && m.active && String(m.name).toLowerCase().includes(needle)) {
          m.active = false;
          hit.push(m);
        }
      }
      return hit;
    },
    async addHealthMetric(userId, f) {
      const row = {
        id: "hm" + metricSeq++, user_id: userId, metric_type: f.metric_type,
        value: f.value ?? null, secondary_value: f.secondary_value ?? null, unit: f.unit || null,
        reading_context: f.reading_context || null, measurement_date: f.measurement_date || null,
        source: f.source || null, original_message: f.original_message || null, created_at: nowISO(),
      };
      healthMetrics.push(row);
      return row;
    },
    async latestMetrics(userId) {
      const sorted = healthMetrics
        .filter((r) => r.user_id === userId)
        .sort((a, b) => {
          const da = a.measurement_date || a.created_at;
          const dbb = b.measurement_date || b.created_at;
          return da < dbb ? 1 : -1;
        });
      const seen = new Map();
      for (const r of sorted) if (!seen.has(r.metric_type)) seen.set(r.metric_type, r);
      return [...seen.values()];
    },
    async upsertLifestyle(userId, f) {
      const existing = lifestyle.get(userId) || { user_id: userId };
      const merged = {
        ...existing,
        smoking_status: f.smoking_status ?? existing.smoking_status ?? null,
        smoking_quantity: f.smoking_quantity ?? existing.smoking_quantity ?? null,
        activity_level: f.activity_level ?? existing.activity_level ?? null,
        activity_type: f.activity_type ?? existing.activity_type ?? null,
        original_message: f.original_message ?? existing.original_message ?? null,
        last_updated_at: nowISO(),
      };
      lifestyle.set(userId, merged);
      return merged;
    },
    async getLifestyle(userId) {
      return lifestyle.get(userId) || null;
    },
    async addHealthGoal(userId, f) {
      for (const g of healthGoals) if (g.user_id === userId && g.status === "active") g.status = "replaced";
      const row = {
        id: "hg" + hgSeq++, user_id: userId, goal: f.goal, target_value: f.target_value || null,
        target_date: f.target_date || null, status: "active", created_at: nowISO(),
      };
      healthGoals.push(row);
      return row;
    },
    async getLatestHealthGoal(userId) {
      return (
        healthGoals
          .filter((g) => g.user_id === userId && g.status === "active")
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] || null
      );
    },
  };
}

let storeName;
if (config.hasPostgres) {
  try {
    backend = await makePostgresBackend();
    storeName = "Postgres";
  } catch (e) {
    logError("Database", `Postgres unavailable: ${e?.message || e}`);
  }
} else if (config.hasSupabase) {
  try {
    backend = await makeSupabaseBackend();
    storeName = "Supabase";
  } catch (e) {
    logError("Database", `Supabase unavailable: ${e?.message || e}`);
  }
}
if (!backend) {
  backend = makeMemoryBackend();
  storeName = "in-memory (data resets on restart)";
  // Silent fallback to in-memory would make users appear "new" after every
  // restart and lose their profile mid-conversation. Shout about it, especially
  // when WhatsApp is enabled — that's the production channel and it MUST have
  // durable storage. This is only a warning (not fatal) so local demos still
  // work with just an LLM + a channel key.
  logWarn(
    "Store",
    "no DATABASE_URL or SUPABASE_* env vars set — using in-memory storage. Profiles will reset every process restart."
  );
  if (config.whatsapp?.enabled) {
    logWarn(
      "Store",
      "WhatsApp is enabled but the store is in-memory. Set DATABASE_URL (recommended) or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY so returning users are remembered."
    );
  }
}
console.log(`   Store: ${storeName}`);

// ----------------------------------------------------------------
// Public API (same regardless of backend)
// ----------------------------------------------------------------

export const getUserByTelegramId = (tg) => backend.getUserByTelegramId(tg);
export const getUserByPhoneNumber = (phone) => backend.getUserByPhoneNumber(phone);
export const createUser = (tg, source) => backend.createUser(tg, source);
export const updateUser = (id, patch) => backend.updateUser(id, patch);
export const deleteUser = (id) => backend.deleteUser(id);
export const allActiveUsers = () => backend.allActiveUsers();

// Fetch-or-create the user row for whichever channel is contacting us.
// WhatsApp users are keyed by their phone number (E.164 digits, normalised in
// whatsapp.js); Telegram users are keyed by their numeric user id. Keeping the
// two identity columns orthogonal means the same phone number cannot collide
// with a Telegram id, and every future contact from that phone maps to the
// same row — profile + logs stay intact across sessions and restarts.
export async function getOrCreateUser(identifier, source = "telegram") {
  if (source === "whatsapp") {
    const phone = String(identifier);
    return (await backend.getUserByPhoneNumber(phone)) || (await backend.createUserByPhone(phone, "whatsapp"));
  }
  return (await backend.getUserByTelegramId(identifier)) || (await backend.createUser(identifier, source));
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
export const addLabReport = (id, raw, analysis, extras) => backend.addLabReport(id, raw, analysis, extras);
export const countLabReportsSince = (id, sinceIso) => backend.countLabReportsSince(id, sinceIso);
export const recentLabReports = (id, limit = 3) => backend.recentLabReports(id, limit);
export const saveCoachMessage = (id, kind, role, content) => backend.saveCoachMessage(id, kind, role, content);
export const saveVoiceNote = (id, dataUrl, content) => backend.saveVoiceNote(id, dataUrl, content);
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
// Check-In v2 (2026-07)
export const countGlucose = (id) => backend.countGlucose(id);
export const countMedicationLogs = (id) => backend.countMedicationLogs(id);
export const countWeightEntries = (id) => backend.countWeightEntries(id);
export const countActivityEntries = (id) => backend.countActivityEntries(id);
export const addGlucoseFull = (id, fields) => backend.addGlucoseFull(id, fields);
export const addWellbeingLog = (id, fields) => backend.addWellbeingLog(id, fields);
export const addT1ConfidenceLog = (id, level) =>
  backend.addT1ConfidenceLog ? backend.addT1ConfidenceLog(id, level) : Promise.resolve(null);
export const listT1Organizations = () =>
  backend.listT1Organizations ? backend.listT1Organizations() : Promise.resolve([]);
export const listT1Articles = (limit) =>
  backend.listT1Articles ? backend.listT1Articles(limit) : Promise.resolve([]);
export const listT1Videos = (limit) =>
  backend.listT1Videos ? backend.listT1Videos(limit) : Promise.resolve([]);
export const listT1DailyLifeTopics = (category) =>
  backend.listT1DailyLifeTopics ? backend.listT1DailyLifeTopics(category) : Promise.resolve([]);
export const getT1DailyLifeTopic = (id) =>
  backend.getT1DailyLifeTopic ? backend.getT1DailyLifeTopic(id) : Promise.resolve(null);
export const listT1Events = (limit) =>
  backend.listT1Events ? backend.listT1Events(limit) : Promise.resolve([]);
// Pregnancy Support (2026-07): admin-curated tips + checklist PDFs. Backends
// may not implement these yet; the flow keeps a built-in fallback so the
// section is usable before the admin portal ships.
export const listPregnancyTips = () =>
  backend.listPregnancyTips ? backend.listPregnancyTips() : Promise.resolve([]);
export const listPregnancyChecklist = () =>
  backend.listPregnancyChecklist ? backend.listPregnancyChecklist() : Promise.resolve([]);
export const getPregnancyChecklistTopic = (id) =>
  backend.getPregnancyChecklistTopic ? backend.getPregnancyChecklistTopic(id) : Promise.resolve(null);
export const addMedicationMasterFull = (id, fields) => backend.addMedicationMasterFull(id, fields);
export const enrollMedConsistency = (id) => backend.enrollMedConsistency(id);
export const getMedConsistency = (id) => backend.getMedConsistency(id);
export const updateMedConsistency = (id, patch) => backend.updateMedConsistency(id, patch);
export const logMedConsistencyResponse = (id, taken, reason) =>
  backend.logMedConsistencyResponse(id, taken, reason);
export const addMedSatisfaction = (id, response, note) => backend.addMedSatisfaction(id, response, note);

// ===== My Health (2026-07) =====
export const addConditions = (id, names, source, msg) => backend.addConditions(id, names, source, msg);
export const listConditions = (id) => backend.listConditions(id);
export const setConditionStatus = (id, name, status) => backend.setConditionStatus(id, name, status);
export const clearConditions = (id) => backend.clearConditions(id);
export const addHealthMedication = (id, fields) => backend.addHealthMedication(id, fields);
export const deactivateMedicationByName = (id, name) => backend.deactivateMedicationByName(id, name);
export const addHealthMetric = (id, fields) => backend.addHealthMetric(id, fields);
export const latestMetrics = (id) => backend.latestMetrics(id);
export const upsertLifestyle = (id, fields) => backend.upsertLifestyle(id, fields);
export const getLifestyle = (id) => backend.getLifestyle(id);
export const addHealthGoal = (id, fields) => backend.addHealthGoal(id, fields);
export const getLatestHealthGoal = (id) => backend.getLatestHealthGoal(id);

export const dueReminders = (nowIso = new Date().toISOString()) =>
  backend.dueReminders ? backend.dueReminders(nowIso) : Promise.resolve([]);
export const markReminderFired = (rid, nextFireAt) =>
  backend.markReminderFired ? backend.markReminderFired(rid, nextFireAt) : Promise.resolve();

// More → My Account. `deactivated_at` / `closed_at` are stamped as we flip
// so the timeline is auditable even if the user re-activates later.
export async function setAccountStatus(userId, status) {
  const patch = { account_status: status };
  if (status === "inactive") patch.deactivated_at = new Date().toISOString();
  if (status === "closed") patch.closed_at = new Date().toISOString();
  if (status === "active") patch.deactivated_at = null;
  return backend.updateUser(userId, patch);
}

// Also deactivate every active reminder for a user — used when closing an
// account so the scheduler doesn't fire against a closed row after the fact.
export async function deactivateAllReminders(userId) {
  const items = await backend.listReminders(userId).catch(() => []);
  await Promise.all(items.map((r) => backend.deactivateReminder(userId, r.id).catch(() => {})));
}

// --- My Goals (2026-07) ---
export const listActiveGoals = (id) => backend.listActiveGoals(id);
export const listAllGoals = (id) => backend.listAllGoals(id);
export const getGoal = (id, gid) => backend.getGoal(id, gid);
export const addGoal = (id, fields) => backend.addGoal(id, fields);
export const updateGoal = (id, gid, patch) => backend.updateGoal(id, gid, patch);
export const goalsDueForReview = (todayIso = new Date().toISOString().slice(0, 10)) =>
  backend.goalsDueForReview ? backend.goalsDueForReview(todayIso) : Promise.resolve([]);

// --- Engagement Engine (Build 1) ---
export const listMessageBlocks = (filter) => backend.listMessageBlocks(filter);
export const getEngagementConfig = () => backend.getEngagementConfig();
export const recentBlockIdsForUser = (userId, sinceIso) =>
  backend.recentBlockIdsForUser(userId, sinceIso);
export const logDailyMessage = (row) => backend.logDailyMessage(row);
export const alreadySentToday = (userId, date) => backend.alreadySentToday(userId, date);
export const daysActiveInWindow = (userId, days) => backend.daysActiveInWindow(userId, days);
export const lastInteractionAt = (userId) => backend.lastInteractionAt(userId);
export const userDueReminders = (userId, nowIso = new Date().toISOString()) =>
  backend.userDueReminders(userId, nowIso);
export const activityCountsSince = (userId, sinceIso) =>
  backend.activityCountsSince(userId, sinceIso);
