// Reminders management UI — More → Reminders.
//
// Reminders are created opportunistically by other flows (medication, weight,
// glucose, lab) when the user opts in. This module is the central place to
// list and cancel them. The scheduler in scheduler.js fires them.

import { t } from "../i18n.js";
import { send, langOf } from "../utils.js";
import { remindersListKeyboard, backKeyboard } from "../keyboards.js";
import { listReminders, deactivateReminder } from "../supabase.js";

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
  if (!items.length) {
    return send(bot, chatId, t(lang, "reminders_title") + "\n\n" + t(lang, "reminders_none"), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }
  const body = items
    .map((r) =>
      t(lang, "reminder_row", {
        label: r.label || r.category,
        time: r.time_of_day || "—",
        freq: FREQ_LABEL[r.frequency_days] || `every ${r.frequency_days}d`,
      })
    )
    .join("\n");
  await send(bot, chatId, `${t(lang, "reminders_title")}\n\n${body}`, {
    keyboard: remindersListKeyboard(lang, items),
    markdown: true,
  });
}

export async function cancelReminder(bot, chatId, session, id) {
  const lang = langOf(session);
  await deactivateReminder(session.user.id, id).catch(() => {});
  await send(bot, chatId, t(lang, "reminder_cancelled"), { markdown: true });
  return showReminders(bot, chatId, session);
}
