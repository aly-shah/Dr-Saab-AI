import { t } from "../i18n.js";
import { send, langOf, sanitizeMd } from "../utils.js";
import {
  pregnancyMenuKeyboard,
  pgYesNoKeyboard,
  pgYesNoNotSureKeyboard,
  pgSkipKeyboard,
  pgProgressViewKeyboard,
  pgTipFeedbackKeyboard,
  pgChecklistTopicsKeyboard,
  pgBackKeyboard,
  pgBackToChecklistKeyboard,
  backKeyboard,
} from "../keyboards.js";
import {
  saveProfileAnswer,
  listPregnancyTips,
  listPregnancyChecklist,
  getPregnancyChecklistTopic,
} from "../supabase.js";

// Only gestational-diabetes users should reach this flow. Defence-in-depth:
// the profile-menu button is only rendered when diabetes_status=gestational,
// but deep links / stale inline buttons still land here.
function isGestational(session) {
  return session?.user?.diabetes_status === "gestational";
}

// ---- Persistence helpers ----

// Pregnancy Progress lives inside users.profile_answers.preg_progress as a
// JSON blob so we don't need a schema migration. It's read back from the
// user row loaded on every session (Supabase select("*") returns the column).
function loadProgress(session) {
  const raw = session?.user?.profile_answers?.preg_progress;
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

async function persistProgress(session, record) {
  const value = JSON.stringify(record);
  try {
    await saveProfileAnswer(session.user.id, "preg_progress", value);
  } catch (e) {
    console.error("saveProfileAnswer preg_progress:", e?.message);
  }
  // Mirror the write into the in-memory user object so the view screen right
  // after "saved" already reflects the new value without a round trip.
  session.user = session.user || {};
  session.user.profile_answers = { ...(session.user.profile_answers || {}), preg_progress: value };
}

// ---- Menu ----

export async function showPregnancy(bot, chatId, session) {
  const lang = langOf(session);
  if (!isGestational(session)) {
    // User can't actually reach the Pregnancy Support menu, so Back has to
    // return them to the main menu instead of looping to feat:pregnancy.
    return send(bot, chatId, t(lang, "pg_menu_not_gest"), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }
  session.state = "idle";
  session.step = null;
  session.data = {};
  await send(bot, chatId, `${t(lang, "pg_menu_title")}\n\n${t(lang, "pg_menu_intro")}`, {
    keyboard: pregnancyMenuKeyboard(lang),
    markdown: true,
  });
}

// ===================================================================
// Pregnancy Progress — 7-question setup + view/edit
// ===================================================================

const YESNO_LABEL = {
  yes: "btn_pg_yes",
  no: "btn_pg_no",
  notsure: "btn_pg_notsure",
};

// Show the summary view when a record already exists; otherwise start the
// first-time setup.
async function showProgress(bot, chatId, session) {
  const lang = langOf(session);
  const record = loadProgress(session);
  if (!record) return startProgressSetup(bot, chatId, session);
  return renderProgressView(bot, chatId, session, record);
}

async function renderProgressView(bot, chatId, session, record) {
  const lang = langOf(session);
  const empty = t(lang, "pg_prog_field_empty");
  const yn = (v) => (v ? t(lang, YESNO_LABEL[v] || "pg_prog_field_empty") : empty);
  const body = t(lang, "pg_prog_view_body", {
    weeks:    sanitizeMd(record.weeks || empty),
    due:      sanitizeMd(record.due_date || empty),
    first:    yn(record.first_pregnancy),
    prev:     yn(record.prev_gdm),
    insulin:  yn(record.insulin),
    doctor:   sanitizeMd(record.doctor || empty),
    delivery: sanitizeMd(record.delivery_hospital || empty),
  });
  session.state = "idle";
  session.step = null;
  await send(bot, chatId, `${t(lang, "pg_prog_view_title")}\n\n${body}`, {
    keyboard: pgProgressViewKeyboard(lang),
    markdown: true,
  });
}

async function startProgressSetup(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "pregnancy";
  session.step = "preg_weeks";
  // Seed with any existing record so the user can partially update via Edit
  // without wiping fields they don't reanswer.
  session.data = { preg: loadProgress(session) || {} };
  await send(bot, chatId, t(lang, "pg_prog_setup_intro"), { markdown: true });
  await send(bot, chatId, t(lang, "pg_prog_q_weeks"), { markdown: true });
}

// Best-effort "I'm not sure" detection for the two free-text answers.
function isNotSure(val) {
  return /\b(not\s*sure|i'?m\s*not\s*sure|no\s*idea|dunno|don'?t\s*remember|not\s*yet|yaqeen\s*nahi|maloom\s*nahi)\b/i.test(val || "");
}

async function askDue(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "preg_due";
  await send(bot, chatId, t(lang, "pg_prog_q_due"), { markdown: true });
}

async function askFirst(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "preg_first";
  await send(bot, chatId, t(lang, "pg_prog_q_first"), {
    keyboard: pgYesNoKeyboard(lang, "first"),
    markdown: true,
  });
}

async function askPrev(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "preg_prev";
  await send(bot, chatId, t(lang, "pg_prog_q_prev"), {
    keyboard: pgYesNoNotSureKeyboard(lang, "prev"),
    markdown: true,
  });
}

async function askInsulin(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "preg_insulin";
  await send(bot, chatId, t(lang, "pg_prog_q_insulin"), {
    keyboard: pgYesNoKeyboard(lang, "insulin"),
    markdown: true,
  });
}

async function askDoctor(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "preg_doctor";
  await send(bot, chatId, t(lang, "pg_prog_q_doctor"), {
    keyboard: pgSkipKeyboard(lang, "doctor"),
    markdown: true,
  });
}

async function askDelivery(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "preg_delivery";
  await send(bot, chatId, t(lang, "pg_prog_q_delivery"), {
    keyboard: pgSkipKeyboard(lang, "delivery"),
    markdown: true,
  });
}

async function finishProgressSetup(bot, chatId, session) {
  const lang = langOf(session);
  const record = { ...(session.data?.preg || {}), updated_at: new Date().toISOString() };
  await persistProgress(session, record);
  session.state = "idle";
  session.step = null;
  session.data = {};
  await send(bot, chatId, t(lang, "pg_prog_saved"), { markdown: true });
  return renderProgressView(bot, chatId, session, record);
}

// Standalone "Update Pregnancy Week" — asks weeks only and saves back into
// the existing record.
async function startUpdateWeek(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "pregnancy";
  session.step = "preg_update_week";
  session.data = { preg: loadProgress(session) || {} };
  await send(bot, chatId, t(lang, "pg_prog_update_week_q"), { markdown: true });
}

async function finishUpdateWeek(bot, chatId, session, value) {
  const lang = langOf(session);
  const current = loadProgress(session) || {};
  const record = {
    ...current,
    weeks: isNotSure(value) ? null : value.slice(0, 40),
    updated_at: new Date().toISOString(),
  };
  await persistProgress(session, record);
  session.state = "idle";
  session.step = null;
  session.data = {};
  await send(bot, chatId, t(lang, "pg_prog_week_saved"), { markdown: true });
  return renderProgressView(bot, chatId, session, record);
}

// ===================================================================
// Healthy Pregnancy Tips
// ===================================================================

const TIP_FALLBACK_KEYS = [
  "pg_tip_fallback_1",
  "pg_tip_fallback_2",
  "pg_tip_fallback_3",
  "pg_tip_fallback_4",
  "pg_tip_fallback_5",
  "pg_tip_fallback_6",
  "pg_tip_fallback_7",
  "pg_tip_fallback_8",
];

async function fetchTipPool(lang) {
  // Prefer admin-curated tips from the DB. Each row is expected to shape as
  // { id, title, body, active }. If nothing is returned, fall back to the
  // built-in EN/UR tip pool so the section is still useful pre-admin.
  const rows = await listPregnancyTips().catch(() => []);
  const filtered = (Array.isArray(rows) ? rows : []).filter((r) => r && (r.body || r.text));
  if (filtered.length) {
    return filtered.map((r) => ({
      id: r.id ?? null,
      title: r.title || null,
      body: r.body || r.text,
    }));
  }
  return TIP_FALLBACK_KEYS.map((key) => ({ id: key, title: null, body: t(lang, key) }));
}

function pickTip(pool, excludeId = null) {
  if (!pool.length) return null;
  const candidates = excludeId ? pool.filter((tp) => tp.id !== excludeId) : pool;
  const src = candidates.length ? candidates : pool;
  return src[Math.floor(Math.random() * src.length)];
}

async function showTip(bot, chatId, session, excludeId = null) {
  const lang = langOf(session);
  const pool = await fetchTipPool(lang);
  const tip = pickTip(pool, excludeId);
  if (!tip) {
    return send(bot, chatId, t(lang, "pg_tip_placeholder"), {
      keyboard: pgBackKeyboard(lang),
      markdown: true,
    });
  }
  session.state = "idle";
  session.step = null;
  session.data = { ...session.data, lastTipId: tip.id };
  const titleLine = tip.title ? `\n\n*${sanitizeMd(tip.title)}*` : "";
  await send(bot, chatId, `${t(lang, "pg_tip_header")}${titleLine}\n\n${sanitizeMd(tip.body)}`, {
    keyboard: pgTipFeedbackKeyboard(lang),
    markdown: true,
  });
}

async function handleTipFeedback(bot, chatId, session, action) {
  const lang = langOf(session);
  if (action === "tipagain") {
    return showTip(bot, chatId, session, session.data?.lastTipId);
  }
  // tiphelp
  saveProfileAnswer(session.user.id, "pg_last_tip_helpful", String(session.data?.lastTipId || "")).catch(() => {});
  await send(bot, chatId, t(lang, "pg_tip_thanks"), {
    keyboard: pgBackKeyboard(lang),
    markdown: true,
  });
}

// ===================================================================
// Pregnancy Checklist
// ===================================================================

const CHECKLIST_FALLBACK = [
  { id: "hospital_bag",    titleKey: "pg_cl_hospital_bag" },
  { id: "delivery_prep",   titleKey: "pg_cl_delivery_prep" },
  { id: "questions_dr",    titleKey: "pg_cl_questions_dr" },
  { id: "glucose_testing", titleKey: "pg_cl_glucose_testing" },
  { id: "newborn",         titleKey: "pg_cl_newborn" },
  { id: "breastfeeding",   titleKey: "pg_cl_breastfeeding" },
  { id: "snacks",          titleKey: "pg_cl_snacks" },
  { id: "activity",        titleKey: "pg_cl_activity" },
];

async function fetchChecklist(lang) {
  const rows = await listPregnancyChecklist().catch(() => []);
  const filtered = (Array.isArray(rows) ? rows : []).filter((r) => r && r.title);
  if (filtered.length) {
    return filtered.map((r) => ({ id: String(r.id), title: r.title, pdf_url: r.pdf_url || null }));
  }
  // Fallback list carries no PDFs yet — the individual topic view will show
  // the "coming soon" placeholder for each.
  return CHECKLIST_FALLBACK.map((it) => ({ id: it.id, title: t(lang, it.titleKey), pdf_url: null }));
}

async function showChecklist(bot, chatId, session) {
  const lang = langOf(session);
  const topics = await fetchChecklist(lang);
  if (!topics.length) {
    return send(bot, chatId, `${t(lang, "pg_checklist_title")}\n\n${t(lang, "pg_checklist_placeholder")}`, {
      keyboard: pgBackKeyboard(lang),
      markdown: true,
    });
  }
  session.state = "idle";
  session.step = null;
  await send(bot, chatId, `${t(lang, "pg_checklist_title")}\n\n${t(lang, "pg_checklist_intro")}`, {
    keyboard: pgChecklistTopicsKeyboard(lang, topics),
    markdown: true,
  });
}

async function sendChecklistTopic(bot, chatId, session, idStr) {
  const lang = langOf(session);
  // Try DB first (numeric id). If DB miss, fall back to the built-in title
  // list — those don't carry PDFs so they always route to the "coming soon"
  // message.
  let topic = null;
  const numeric = /^\d+$/.test(idStr) ? parseInt(idStr, 10) : null;
  if (numeric !== null) {
    topic = await getPregnancyChecklistTopic(numeric).catch(() => null);
  }
  if (!topic) {
    const fallback = CHECKLIST_FALLBACK.find((it) => it.id === idStr);
    if (fallback) topic = { title: t(lang, fallback.titleKey), pdf_url: null };
  }
  if (!topic) {
    return send(bot, chatId, t(lang, "pg_checklist_topic_missing"), {
      keyboard: pgBackToChecklistKeyboard(lang),
      markdown: true,
    });
  }
  const title = sanitizeMd(topic.title);
  if (!topic.pdf_url) {
    return send(bot, chatId, t(lang, "pg_checklist_topic_no_pdf", { title }), {
      keyboard: pgBackToChecklistKeyboard(lang),
      markdown: true,
    });
  }
  await send(bot, chatId, t(lang, "pg_checklist_topic_open", { title, url: topic.pdf_url }), {
    keyboard: pgBackToChecklistKeyboard(lang),
    markdown: true,
  });
}

// ---- Text handler (called from bot.js state switch) ----

export async function pregnancyText(bot, chatId, session, text) {
  const lang = langOf(session);
  const value = (text || "").trim();
  if (!value) return;

  switch (session.step) {
    case "preg_weeks": {
      if (isNotSure(value)) {
        session.data.preg.weeks = null;
        await send(bot, chatId, t(lang, "pg_prog_weeks_notsure"), { markdown: true });
      } else {
        session.data.preg.weeks = value.slice(0, 40);
      }
      return askDue(bot, chatId, session);
    }
    case "preg_due": {
      if (isNotSure(value)) {
        session.data.preg.due_date = null;
        await send(bot, chatId, t(lang, "pg_prog_due_notsure"), { markdown: true });
      } else {
        session.data.preg.due_date = value.slice(0, 80);
      }
      return askFirst(bot, chatId, session);
    }
    case "preg_doctor":
      session.data.preg.doctor = value.slice(0, 120);
      return askDelivery(bot, chatId, session);
    case "preg_delivery":
      session.data.preg.delivery_hospital = value.slice(0, 120);
      return finishProgressSetup(bot, chatId, session);
    case "preg_update_week":
      return finishUpdateWeek(bot, chatId, session, value);
    // Steps that require button taps — gently nudge back to the menu.
    default:
      return showPregnancy(bot, chatId, session);
  }
}

// ---- Callback dispatcher (called from bot.js `pg:` handler) ----

export async function dispatchPregnancy(bot, chatId, session, action) {
  const lang = langOf(session);
  if (!isGestational(session)) return showPregnancy(bot, chatId, session);

  if (action === "menu") return showPregnancy(bot, chatId, session);

  // Pregnancy Progress
  if (action === "progress") return showProgress(bot, chatId, session);
  if (action === "edit") return startProgressSetup(bot, chatId, session);
  if (action === "updateweek") return startUpdateWeek(bot, chatId, session);

  // Setup Q3 — first pregnancy?
  if (action.startsWith("first:") && session.step === "preg_first") {
    const val = action.slice("first:".length);
    session.data.preg.first_pregnancy = val === "yes" ? "yes" : "no";
    return askPrev(bot, chatId, session);
  }
  // Setup Q4 — previous GDM?
  if (action.startsWith("prev:") && session.step === "preg_prev") {
    const val = action.slice("prev:".length);
    session.data.preg.prev_gdm =
      val === "yes" ? "yes" : val === "no" ? "no" : "notsure";
    return askInsulin(bot, chatId, session);
  }
  // Setup Q5 — insulin?
  if (action.startsWith("insulin:") && session.step === "preg_insulin") {
    const val = action.slice("insulin:".length);
    session.data.preg.insulin = val === "yes" ? "yes" : "no";
    return askDoctor(bot, chatId, session);
  }
  // Optional-field Skip buttons.
  if (action === "skip:doctor" && session.step === "preg_doctor") {
    session.data.preg.doctor = null;
    return askDelivery(bot, chatId, session);
  }
  if (action === "skip:delivery" && session.step === "preg_delivery") {
    session.data.preg.delivery_hospital = null;
    return finishProgressSetup(bot, chatId, session);
  }

  // Healthy Pregnancy tips
  if (action === "tips") return showTip(bot, chatId, session);
  if (action === "tiphelp" || action === "tipagain") {
    return handleTipFeedback(bot, chatId, session, action);
  }

  // Checklist
  if (action === "checklist") return showChecklist(bot, chatId, session);
  if (action.startsWith("cl:")) return sendChecklistTopic(bot, chatId, session, action.slice(3));

  return showPregnancy(bot, chatId, session);
}
