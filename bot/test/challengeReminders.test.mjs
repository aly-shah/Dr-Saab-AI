// Challenge reminders: switched off when the challenge is over.
//
// The scheduler used to fall back to a generic "Keep your challenge moving"
// text forever once a challenge row was no longer active. Now the reminder
// is retired instead, and terminal status changes (completed / withdrawn /
// expired) deactivate the reminders attached to that challenge.
//
// Run: node --test test/challengeReminders.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.REMINDER_TZ_OFFSET = "5";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { fireDueReminders } = await import("../src/scheduler.js");
const supabase = await import("../src/supabase.js");

function makeFakeBot() {
  const sent = [];
  return {
    sent,
    sendMessage: async (chatId, text, opts) => {
      sent.push({ chatId, text, opts });
      return { message_id: sent.length };
    },
    sendChatAction: async () => {},
  };
}

async function seedUser() {
  const base = await supabase.getOrCreateUser(`tg-chalrem-${Math.random().toString(36).slice(2)}`, "telegram");
  return await supabase.updateUser(base.id, { onboarded: true, language: "en", tier: "free" });
}
const pastIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();

test("deactivateRemindersByTarget switches off every reminder attached to a challenge and nothing else", async () => {
  const user = await seedUser();
  await supabase.addReminderSchedule(user.id, { category: "challenge_checkin", target_id: "uc-A", label: "activity", time_of_day: "09:00", frequency_days: 3, next_fire_at: pastIso });
  await supabase.addReminderSchedule(user.id, { category: "challenge_final_result_prompt", target_id: "uc-A", label: "hba1c_final", time_of_day: "10:00", frequency_days: 3, next_fire_at: pastIso });
  const keep = await supabase.addReminderSchedule(user.id, { category: "glucose", label: "Blood sugar check-in", time_of_day: "08:00", frequency_days: 1, next_fire_at: new Date(Date.now() + 86400000).toISOString() });

  await supabase.deactivateRemindersByTarget("uc-A");

  const left = await supabase.listReminders(user.id);
  assert.deepEqual(left.map((r) => r.id), [keep.id]);
});

test("scheduler: a reminder whose challenge is gone is retired, not sent as the generic text", async () => {
  const user = await seedUser();
  const bot = makeFakeBot();
  // In memory mode getUserChallengeById returns null — exactly the
  // "challenge row no longer there" case the scheduler must retire.
  await supabase.addReminderSchedule(user.id, { category: "challenge_checkin", target_id: "uc-gone", label: "activity", time_of_day: "09:00", frequency_days: 3, next_fire_at: pastIso });
  await supabase.addReminderSchedule(user.id, { category: "challenge_final_result_prompt", target_id: "uc-gone", label: "hba1c_final", time_of_day: "10:00", frequency_days: 3, next_fire_at: pastIso });
  // A normal reminder due at the same time must still go out.
  const glucose = await supabase.addReminderSchedule(user.id, { category: "glucose", label: "Blood sugar check-in", time_of_day: "08:00", frequency_days: 1, next_fire_at: pastIso });

  await fireDueReminders({ telegram: bot }, new Map([[user.id, user]]));

  const mine = bot.sent.filter((s) => String(s.chatId) === String(user.telegram_id));
  const texts = mine.map((s) => s.text).join("\n");
  assert.ok(!/keep your challenge moving/i.test(texts), `generic challenge text must not be sent: ${texts}`);
  assert.ok(!/nearing the finish line/i.test(texts), `generic final-prompt text must not be sent: ${texts}`);
  assert.ok(/log your blood sugar/i.test(texts), `the glucose reminder still fires: ${texts}`);

  const active = await supabase.listReminders(user.id);
  assert.deepEqual(active.map((r) => r.id), [glucose.id], "both challenge reminders retired; glucose reminder kept");
  assert.ok(new Date(active[0].next_fire_at).getTime() > Date.now(), "glucose reminder bumped to its next slot");
});
