// Reminders management UI — More → Reminders.
//
// Two things live here:
//   1. Master category toggles (Blood Sugar / Medication / Goals / Coaching).
//      These are user-level flags on `users.pref_rem_*`; the scheduler
//      consults them before firing any reminder in that category.
//   2. A list of the user's currently scheduled reminders, each with a
//      Cancel button — created opportunistically by other flows.

import { t } from "../i18n.js";
import { send, langOf } from "../utils.js";
import {
  remindersPrefsKeyboard,
  REMINDER_CATEGORIES,
} from "../keyboards.js";
import { listReminders, deactivateReminder, updateUser } from "../supabase.js";

const FREQ_LABEL = {
  1: "daily",
  2: "3×/week",
  7: "weekly",
  30: "monthly",
  90: "every 3 months",
};

export async function showReminders(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";
  const items = await listReminders(session.user.id).catch(() => []);

  const scheduledBlock = items.length
    ? [
        t(lang, "reminders_scheduled_header"),
        ...items.map((r) =>
          t(lang, "reminder_row", {
            label: r.label || r.category,
            time: r.time_of_day || "—",
            freq: FREQ_LABEL[r.frequency_days] || `every ${r.frequency_days}d`,
          })
        ),
      ].join("\n")
    : `${t(lang, "reminders_scheduled_header")}\n${t(lang, "reminders_scheduled_none")}`;

  const text = [
    t(lang, "reminders_prefs_title"),
    "",
    t(lang, "reminders_prefs_intro"),
    "",
    scheduledBlock,
  ].join("\n");

  // Combined keyboard: category toggles + one Cancel row per scheduled item + Back.
  const kb = remindersPrefsKeyboard(lang, session.user);
  for (const r of items) {
    kb.inline_keyboard.splice(kb.inline_keyboard.length - 1, 0, [
      { text: t(lang, "btn_reminder_cancel", { label: r.label || r.category }).slice(0, 60), callback_data: `remcancel:${r.id}` },
    ]);
  }
  await send(bot, chatId, text, { keyboard: kb, markdown: true });
}

export async function cancelReminder(bot, chatId, session, id) {
  const lang = langOf(session);
  await deactivateReminder(session.user.id, id).catch(() => {});
  await send(bot, chatId, t(lang, "reminder_cancelled"), { markdown: true });
  return showReminders(bot, chatId, session);
}

export async function toggleReminderPref(bot, chatId, session, categoryKey) {
  const lang = langOf(session);
  const cat = REMINDER_CATEGORIES.find((c) => c.key === categoryKey);
  if (!cat) return;
  const current = session.user?.[cat.prefField] !== false; // default on
  const next = !current;
  const updated = await updateUser(session.user.id, { [cat.prefField]: next }).catch((e) => {
    console.error("toggle reminder pref error:", e?.message);
    return null;
  });
  if (updated) session.user = updated;
  await send(
    bot,
    chatId,
    t(lang, "rem_pref_updated", {
      label: t(lang, cat.labelKey).replace(/^\S+\s/, ""),
      state: t(lang, next ? "rem_cat_on" : "rem_cat_off"),
    }),
    { markdown: true }
  );
  return showReminders(bot, chatId, session);
}
