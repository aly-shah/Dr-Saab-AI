import { t } from "../i18n.js";
import { send, sanitizeMd, langOf, isPremium } from "../utils.js";
import { reportsKeyboard, backKeyboard, upgradeKeyboard } from "../keyboards.js";
import { periodStats } from "../supabase.js";
import { estHbA1c, bmi, bmiCategory } from "../clinic.js";
import { showSummary } from "./progress.js";

// Reports are a paid feature (Consistency Coach and above).
export async function showReports(bot, chatId, session) {
  session.state = "idle";
  const lang = langOf(session);
  if (!isPremium(session.user)) {
    return send(bot, chatId, t(lang, "premium_required"), { keyboard: upgradeKeyboard(lang), markdown: true });
  }
  await send(bot, chatId, `${t(lang, "reports_title")}\n\n${t(lang, "reports_intro")}`, {
    keyboard: reportsKeyboard(lang),
    markdown: true,
  });
}

// Weekly summary reuses the existing AI summary flow.
export async function showWeeklyReport(bot, chatId, session) {
  return showSummary(bot, chatId, session);
}

export async function showMonthlyReport(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";
  await send(bot, chatId, t(lang, "report_monthly_generating"), { markdown: true });

  const s = await periodStats(session.user.id, 30);
  if (s.glucoseCount === 0 && s.healthCount === 0 && s.medicationCount === 0) {
    return send(bot, chatId, t(lang, "no_data_month"), { keyboard: backKeyboard(lang), markdown: true });
  }
  await send(bot, chatId, buildDoctorReport(lang, session.user, s), { keyboard: backKeyboard(lang), markdown: true });
}

export async function showDoctorReport(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";
  const s = await periodStats(session.user.id, 30);
  await send(bot, chatId, buildDoctorReport(lang, session.user, s), { keyboard: backKeyboard(lang), markdown: true });
}

function buildDoctorReport(lang, user, s) {
  const weightKg = user.weight_kg;
  const bmiVal = bmi(weightKg, user.height_cm);
  const est = estHbA1c(s.glucoseAvg);
  const title = t(lang, "doctor_report_title", { name: sanitizeMd(user.name || "—") });
  const body = t(lang, "doctor_report_body", {
    diabetes: user.diabetes_status || "—",
    hba1c: user.latest_hba1c != null ? `${user.latest_hba1c}%` : "—",
    est_hba1c: est != null ? `${est}%` : "—",
    bmi: bmiVal != null ? `${bmiVal} (${bmiCategory(bmiVal)})` : "—",
    gcount: s.glucoseCount,
    gavg: s.glucoseAvg ?? "—",
    gmin: s.glucoseMin ?? "—",
    gmax: s.glucoseMax ?? "—",
    ginrange: s.inRangePct ?? "—",
    mcount: s.medicationCount,
    hcount: s.healthCount,
    streak: user.streak || 0,
  });
  return `${title}\n\n${body}`;
}
