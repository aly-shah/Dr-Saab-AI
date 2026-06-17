import { t } from "../i18n.js";
import { send, langOf } from "../utils.js";
import { isExecutive } from "../tiers.js";
import { executiveKeyboard, upgradeKeyboard, backKeyboard } from "../keyboards.js";
import { addServiceRequest } from "../supabase.js";

// Executive service type → button/label i18n key.
const SERVICE_LABEL = {
  doctor_review: "btn_exec_doctor",
  live_session: "btn_exec_session",
  progress_review: "btn_exec_review",
  priority_help: "btn_exec_priority",
  premium_content: "btn_exec_content",
};

export async function showExecutive(bot, chatId, session) {
  session.state = "idle";
  const lang = langOf(session);
  if (!isExecutive(session.user)) {
    return send(bot, chatId, t(lang, "executive_required"), { keyboard: upgradeKeyboard(lang), markdown: true });
  }
  await send(bot, chatId, `${t(lang, "exec_title")}\n\n${t(lang, "exec_intro")}`, {
    keyboard: executiveKeyboard(lang),
    markdown: true,
  });
}

// Capture a service request — the team follows up out-of-band (human ops).
export async function requestService(bot, chatId, session, serviceType) {
  const lang = langOf(session);
  if (!isExecutive(session.user)) {
    return send(bot, chatId, t(lang, "executive_required"), { keyboard: upgradeKeyboard(lang), markdown: true });
  }
  if (!SERVICE_LABEL[serviceType]) return showExecutive(bot, chatId, session);

  let ref = "—";
  try {
    ref = await addServiceRequest(session.user.id, serviceType);
  } catch (e) {
    console.error("service request failed:", e?.message);
  }
  const service = t(lang, SERVICE_LABEL[serviceType]);
  await send(bot, chatId, t(lang, "exec_requested", { service, ref }), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}
