// Subscription Module (MVP) — spec §2–§14, added 2026-07-17.
//
// Manual payment approval. The user picks a plan → confirms → picks a
// payment method → reads the payment card → sends a screenshot → we
// snapshot the submission and notify the admin (Yasir Abbasi). The admin
// approves / rejects / requests a better image via typed WhatsApp
// commands (see adminSubscriptionCommand). On approval the user's tier
// flips to `consistency` and the expiry is stamped.
//
// State names owned by this flow:
//   sub_await_proof  — waiting on the user's payment screenshot
//
// Session shape while in the flow (session.data.sub):
//   { planCode, months, amountPkr, planLabel, method, methodLabel }

import { t } from "../i18n.js";
import { send, langOf, photoDataUrl, sanitizeMd } from "../utils.js";
import {
  upsellMenuKeyboard,
  upsellExecUnavailableKeyboard,
  upsellOffersKeyboard,
  upsellConfirmKeyboard,
  payMethodKeyboard,
  payProofKeyboard,
  backKeyboard,
  doctorProBenefitsKeyboard,
  doctorProCapKeyboard,
} from "../keyboards.js";
import {
  createSubscriptionPayment,
  getSubscriptionPayment,
  updateSubscriptionPayment,
  listPendingSubscriptionPayments,
  updateUser,
  getUserById,
  getUserByPhoneNumber,
  listUsersBySubStatus,
} from "../supabase.js";
import { config } from "../config.js";
import { resetFlow } from "../session.js";

// Plan catalogue — the three offers on the Consistency Coach screen (§3),
// plus the Doctor Pro addendum plan for user_type=doctor. `family` marks
// the audience so the approve/notify code can pick the right copy and
// side-effects (patient-tier flip vs doctor-cap lift).
// months is what we add to the current expiry / now on approval.
const PLANS = {
  "1m":  { code: "consistency_1m",  months: 1,  amount: 799,  family: "consistency",
           labelKey: "btn_upsell_1m",  confirmKey: "upsell_confirm_1m"  },
  "6m":  { code: "consistency_6m",  months: 6,  amount: 3995, family: "consistency",
           labelKey: "btn_upsell_6m",  confirmKey: "upsell_confirm_6m"  },
  "12m": { code: "consistency_12m", months: 12, amount: 7990, family: "consistency",
           labelKey: "btn_upsell_12m", confirmKey: "upsell_confirm_12m" },
  "dp":  { code: "doctor_pro_1m",   months: 1,  amount: 4999, family: "doctor_pro",
           labelKey: "btn_dp_month", confirmKey: null /* dp uses its own benefits card */ },
};

// True once a doctor is on an active Doctor Pro subscription.
export function isDoctorPro(user) {
  if (!user || user.user_type !== "doctor") return false;
  if (user.sub_status !== "active") return false;
  const code = String(user.sub_plan_code || "");
  if (!code.startsWith("doctor_pro")) return false;
  if (!user.sub_expires_at) return true;
  return new Date(user.sub_expires_at) > new Date();
}

// Doctor Pro free-plan cap (spec §2). Kept as a named constant so a future
// tier tweak is a one-line change.
export const DOCTOR_FREE_PATIENT_CAP = 10;

const METHODS = {
  bank:     { titleKey: "pay_bank_title",     bodyKey: "pay_bank_body",     labelKey: "btn_pay_bank"     },
  jazzcash: { titleKey: "pay_jazzcash_title", bodyKey: "pay_jazzcash_body", labelKey: "btn_pay_jazzcash" },
};

// ------------------------------------------------------------------
// User-facing flow
// ------------------------------------------------------------------

// §2 — the Upgrade menu (Consistency / Executive / Back). Doctors go
// straight to the Doctor Pro benefits card since Consistency Coach is
// patient-facing.
export async function startUpgrade(bot, chatId, session) {
  resetFlow(chatId);
  const lang = langOf(session);
  session.data.sub = {}; // fresh selection each entry
  if (session.user?.user_type === "doctor" && !session.patientMode) {
    return showDoctorProBenefits(bot, chatId, session);
  }
  return send(bot, chatId, t(lang, "upsell_menu_title"), {
    keyboard: upsellMenuKeyboard(lang),
    markdown: true,
  });
}

// Doctor Pro benefits card (Addendum §5). Continue → payment method.
async function showDoctorProBenefits(bot, chatId, session) {
  const lang = langOf(session);
  const plan = PLANS.dp;
  session.data.sub = {
    ...(session.data.sub || {}),
    planKey: "dp",
    planCode: plan.code,
    months: plan.months,
    amountPkr: plan.amount,
    planLabel: t(lang, "dp_plan_label"),
  };
  const body = [
    t(lang, "dp_title"),
    "",
    t(lang, "dp_price"),
    "",
    t(lang, "dp_benefits"),
  ].join("\n");
  return send(bot, chatId, body, {
    keyboard: doctorProBenefitsKeyboard(lang, { showTest: config.testActivationEnabled }),
    markdown: true,
  });
}

// Sent to a doctor when a patient tried to link while they were at the
// 10-patient cap (Addendum §4). Fired from within the doctor-linking
// path — not from a user-invoked callback.
export async function notifyDoctorCapReached(doctor, patientName) {
  const lang = doctor?.language || "en";
  const patient = patientName ? sanitizeMd(patientName) : t(lang, "dp_cap_a_patient");
  return notifyUser(doctor, "dp_cap_reached", { patient }, {
    keyboard: doctorProCapKeyboard(lang),
  }).catch((e) => console.error("dp cap notify:", e?.message));
}

async function showExecutiveUnavailable(bot, chatId, session) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "upsell_executive_unavailable"), {
    keyboard: upsellExecUnavailableKeyboard(lang),
    markdown: true,
  });
}

// §3 — Consistency Coach: title, features, offers, plan picker.
async function showConsistency(bot, chatId, session) {
  const lang = langOf(session);
  const body = [
    t(lang, "upsell_consistency_title"),
    "",
    t(lang, "upsell_consistency_features"),
    "",
    t(lang, "upsell_consistency_offers"),
  ].join("\n");
  return send(bot, chatId, body, {
    keyboard: upsellOffersKeyboard(lang),
    markdown: true,
  });
}

// §4 — Plan confirmation card.
async function showPlanConfirm(bot, chatId, session, planKey) {
  const lang = langOf(session);
  const plan = PLANS[planKey];
  if (!plan) return showConsistency(bot, chatId, session);
  session.data.sub = {
    ...(session.data.sub || {}),
    planKey,
    planCode: plan.code,
    months: plan.months,
    amountPkr: plan.amount,
    planLabel: t(lang, plan.labelKey),
  };
  return send(bot, chatId, t(lang, plan.confirmKey), {
    keyboard: upsellConfirmKeyboard(lang, { showTest: config.testActivationEnabled }),
    markdown: true,
  });
}

// §5 — Payment method picker.
async function showPayMethod(bot, chatId, session) {
  const lang = langOf(session);
  if (!session.data.sub?.planCode) return showConsistency(bot, chatId, session);
  return send(bot, chatId, t(lang, "pay_method_title"), {
    keyboard: payMethodKeyboard(lang),
    markdown: true,
  });
}

// §6 / §7 — payment card with account details + "I've Paid" / Cancel.
async function showPayCard(bot, chatId, session, method) {
  const lang = langOf(session);
  const sub = session.data.sub || {};
  if (!sub.planCode) return showConsistency(bot, chatId, session);
  const cfg = METHODS[method];
  if (!cfg) return showPayMethod(bot, chatId, session);
  session.data.sub = { ...sub, method, methodLabel: t(lang, cfg.labelKey) };
  const body = `${t(lang, cfg.titleKey)}\n\n${t(lang, cfg.bodyKey, { amount: sub.amountPkr })}`;
  return send(bot, chatId, body, {
    keyboard: payProofKeyboard(lang),
    markdown: true,
  });
}

// §8 — after "I've Paid": enter await-proof state. The next photo message
// received in this state is captured by handleSubscriptionMessage below.
async function beginProofCapture(bot, chatId, session) {
  const lang = langOf(session);
  if (!session.data.sub?.method) return showPayMethod(bot, chatId, session);
  session.state = "sub_await_proof";
  session.step = null;
  return send(bot, chatId, t(lang, "pay_awaiting_proof"), {
    keyboard: payProofKeyboard(lang),
    markdown: true,
  });
}

// QA affordance — activate the currently-selected plan immediately, bypassing
// payment collection and admin approval. Fires the same activation code path
// the admin approve command uses, so the user sees the exact "🎉 you're now a
// member" experience. Gated by config.testActivationEnabled; the button is
// only rendered when that flag is true.
async function testActivate(bot, chatId, session) {
  const lang = langOf(session);
  if (!config.testActivationEnabled) {
    return send(bot, chatId, t(lang, "test_activation_disabled"), {
      keyboard: backKeyboard(lang, "feat:subscription"),
      markdown: true,
    });
  }
  const sub = session.data.sub || {};
  if (!sub.planCode) return startUpgrade(bot, chatId, session);

  const plan = PLANS[sub.planKey];
  const nowIso = new Date().toISOString();

  // Record a synthetic payment so the flow is discoverable in the DB / admin
  // panel later. Marked method='test' + status='approved' so it can't be
  // confused with a real submission.
  let paymentId = null;
  try {
    const row = await createSubscriptionPayment({
      user_id: session.user.id,
      plan_code: sub.planCode,
      plan_label: sub.planLabel || sub.planCode,
      months: sub.months,
      amount_pkr: sub.amountPkr,
      method: "test",
      payment_status: "approved",
      submitted_at: nowIso,
      reviewed_at: nowIso,
      reviewed_by: "test-activate",
      activation_at: nowIso,
    });
    paymentId = row?.id;
  } catch (e) {
    console.error("test activate: createSubscriptionPayment failed:", e?.message);
  }

  // Extend from the current expiry (if any) or from now.
  const currentExpiry = session.user?.sub_expires_at
    ? new Date(session.user.sub_expires_at) : null;
  const base = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
  const expiry = addMonths(base, sub.months);

  const isDoctorProPlan = plan?.family === "doctor_pro";
  const userPatch = {
    sub_status: "active",
    sub_plan_code: sub.planCode,
    sub_activated_at: nowIso,
    sub_expires_at: expiry.toISOString(),
    sub_last_reminder: null,
  };
  if (!isDoctorProPlan) userPatch.tier = "consistency";
  session.user = await updateUser(session.user.id, userPatch)
    .catch((e) => { console.error("test activate: updateUser:", e?.message); return session.user; });

  if (paymentId) {
    await updateSubscriptionPayment(paymentId, {
      expiry_at: expiry.toISOString(),
    }).catch(() => {});
  }

  resetFlow(chatId);
  const key = isDoctorProPlan ? "dp_activated" : "pay_activated";
  return send(bot, chatId, t(lang, key, { expiry: formatExpiry(expiry) }), {
    keyboard: { inline_keyboard: [[{ text: t(lang, "btn_sub_main_menu"), callback_data: "menu" }]] },
    markdown: true,
  });
}

async function cancelPayment(bot, chatId, session) {
  const lang = langOf(session);
  resetFlow(chatId);
  return send(bot, chatId, t(lang, "pay_cancelled"), {
    keyboard: backKeyboard(lang, "feat:subscription"),
    markdown: true,
  });
}

// Callback dispatcher for every `sub:*` action shown to the user.
// Returns true if the callback was handled here, so bot.js can bail out.
export async function subscriptionCallback(bot, chatId, session, data) {
  const parts = data.split(":");
  const action = parts[1];

  // Admin buttons on the payment notification (sub:adm:apr|rej|btr:<id>).
  // Only the configured admin chat can trigger these — a stray tap from a
  // regular user (e.g. someone forwarded the message) is silently ignored.
  if (action === "adm") {
    if (!isAdminChat(chatId)) return;
    return adminButtonCallback(bot, chatId, session, parts[2], parts[3]);
  }

  switch (action) {
    case "upgrade":
      return startUpgrade(bot, chatId, session);
    case "pick": {
      const which = parts[2];
      if (which === "consistency") return showConsistency(bot, chatId, session);
      if (which === "executive")   return showExecutiveUnavailable(bot, chatId, session);
      if (which === "doctor_pro")  return showDoctorProBenefits(bot, chatId, session);
      return startUpgrade(bot, chatId, session);
    }
    case "plan": {
      return showPlanConfirm(bot, chatId, session, parts[2]);
    }
    case "continue":
      return showPayMethod(bot, chatId, session);
    case "pay":
      return showPayCard(bot, chatId, session, parts[2]);
    case "paid":
      return beginProofCapture(bot, chatId, session);
    case "test":
      return testActivate(bot, chatId, session);
    case "cancel":
      return cancelPayment(bot, chatId, session);
    case "upload_again":
      return beginProofCapture(bot, chatId, session);
    case "renew":
      return startUpgrade(bot, chatId, session);
    case "later":
      // No-op ack, just drop back to the subscription screen.
      return send(bot, chatId, t(langOf(session), "pay_cancelled"), {
        keyboard: backKeyboard(langOf(session), "feat:subscription"),
        markdown: true,
      });
    default:
      // Unknown sub action — fall back to the upgrade landing screen.
      return startUpgrade(bot, chatId, session);
  }
}

// Text-handler entry point for the sub_await_proof state. Called from
// bot.js when the user's active session state matches. Accepts a photo
// (Telegram) or an inbound image data URL (WhatsApp), stores the row,
// updates the user's sub_status, and pings the admin.
export async function subscriptionText(bot, chatId, session, text, msg) {
  const lang = langOf(session);
  const sub = session.data.sub || {};
  if (!sub.planCode || !sub.method) {
    // Session lost its plan context (process restart mid-flow, or the
    // user typed rather than tapped and slipped past our state). Ask them
    // to re-open Upgrade rather than dropping them into onboarding, and
    // keep them in-state so they can retry.
    return send(bot, chatId, t(lang, "pay_session_lost"), {
      keyboard: {
        inline_keyboard: [[
          { text: t(lang, "btn_sub_upgrade"), callback_data: "sub:upgrade" },
          { text: t(lang, "btn_back"),        callback_data: "feat:subscription" },
        ]],
      },
      markdown: true,
    });
  }

  const imageDataUrl = msg ? await photoDataUrl(bot, msg).catch(() => null) : null;
  if (!imageDataUrl) {
    return send(bot, chatId, t(lang, "pay_proof_not_image"), {
      keyboard: payProofKeyboard(lang),
      markdown: true,
    });
  }

  const mime = imageDataUrl.match(/^data:([^;]+);/)?.[1] || "image/jpeg";
  const submittedAt = new Date().toISOString();

  let payment;
  try {
    payment = await createSubscriptionPayment({
      user_id: session.user.id,
      plan_code: sub.planCode,
      plan_label: sub.planLabel || sub.planCode,
      months: sub.months,
      amount_pkr: sub.amountPkr,
      method: sub.method,
      payment_status: "proof_submitted",
      proof_image_url: imageDataUrl,
      proof_image_mime: mime,
      submitted_at: submittedAt,
    });
  } catch (e) {
    console.error("subscription: createSubscriptionPayment failed:", e?.message);
    // Fail loud — don't tell the user "received" when it wasn't.
    return send(bot, chatId, t(lang, "error_generic"), {
      keyboard: payProofKeyboard(lang),
      markdown: true,
    });
  }

  // Flip the user's subscription state so downstream flows / the admin
  // panel can see the pending review.
  await updateUser(session.user.id, {
    sub_status: "pending_approval",
    sub_plan_code: sub.planCode,
  }).catch((e) => console.error("subscription: updateUser sub_status failed:", e?.message));

  resetFlow(chatId);
  await send(bot, chatId, t(lang, "pay_proof_received"), {
    keyboard: backKeyboard(lang, "feat:subscription"),
    markdown: true,
  });

  // Best-effort admin notification. A failure here shouldn't block the
  // user's confirmation — the payment row is already persisted.
  notifyAdminOfSubmission(session.user, payment).catch((e) =>
    console.error("subscription: admin notify failed:", e?.message)
  );
}

// ------------------------------------------------------------------
// Admin notification & typed commands
// ------------------------------------------------------------------

function whatsappNumberFor(user) {
  // WhatsApp users store their E.164 digits in phone_number (or the legacy
  // telegram_id column for older rows).
  return user?.phone_number || user?.telegram_id || "";
}

function planMonthsLabel(months) {
  if (months === 1) return "1 Month";
  if (months === 6) return "6 Months";
  if (months === 12) return "12 Months";
  return `${months} Months`;
}

async function notifyAdminOfSubmission(user, payment) {
  const adminPhone = config.adminNotifyWhatsapp;
  if (!adminPhone) return;
  // Admin lang defaults to en; if the admin has a row we honour their choice.
  const admin = await getUserByPhoneNumber(adminPhone).catch(() => null);
  const lang = admin?.language || "en";

  const wa = whatsappNumberFor(user);
  const caption = t(lang, "admin_new_payment", {
    name: sanitizeMd(user.name || "—"),
    whatsapp: wa ? `+${wa}` : "—",
    plan: planMonthsLabel(payment.months),
    amount: payment.amount_pkr,
    method: payment.method === "bank" ? "Bank Transfer" : "JazzCash",
    when: new Date(payment.submitted_at || Date.now()).toISOString().replace("T", " ").slice(0, 16),
    id: payment.id,
  });

  const adminBot = await getBotForSource("whatsapp");
  if (!adminBot) return;

  // Approve / Reject / Better — three-button max, exactly what an interactive
  // image-header message supports. Callback IDs stay short so they fit under
  // WhatsApp's 256-char reply-id cap.
  const buttonsKb = {
    inline_keyboard: [[
      { text: t(lang, "btn_admin_approve"), callback_data: `sub:adm:apr:${payment.id}` },
      { text: t(lang, "btn_admin_reject"),  callback_data: `sub:adm:rej:${payment.id}` },
      { text: t(lang, "btn_admin_better"),  callback_data: `sub:adm:btr:${payment.id}` },
    ]],
  };

  // Preferred: image + caption + buttons in a single interactive message so
  // Yasir can eyeball the screenshot and tap Approve without leaving WhatsApp.
  // If the media upload fails (rare — bad token, WA outage), fall back to a
  // text-only interactive message with the same buttons so the flow still
  // works.
  const sent = payment.proof_image_url
    ? await adminBot.sendPhoto(adminPhone, payment.proof_image_url, caption, { reply_markup: buttonsKb })
        .catch((e) => { console.error("admin sendPhoto failed:", e?.message); return { ok: false }; })
    : { ok: false, reason: "no-proof-url" };

  if (!sent?.ok) {
    await send(adminBot, adminPhone, caption, { keyboard: buttonsKb, markdown: true })
      .catch((e) => console.error("admin fallback text notify failed:", e?.message));
  }
}

function normalizeAdminIdentifier(id) {
  return String(id ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

// True when the inbound message is from the configured admin phone.
export function isAdminChat(chatId) {
  const admin = config.adminNotifyWhatsapp;
  if (!admin) return false;
  return normalizeAdminIdentifier(chatId) === normalizeAdminIdentifier(admin);
}

// Handle `/sub …` typed by the admin. Returns true if the command was
// consumed. Anything else falls through to the normal handler.
export async function adminSubscriptionCommand(bot, chatId, session, text) {
  const lang = langOf(session);
  const parts = String(text || "").trim().split(/\s+/);
  // parts[0] is "/sub", parts[1] is the action.
  const action = (parts[1] || "").toLowerCase();

  if (!action || action === "help") {
    return send(bot, chatId, t(lang, "admin_help"), { markdown: true });
  }
  if (action === "pending") {
    return adminPendingList(bot, chatId, lang);
  }
  if (action === "approve") {
    return adminApprovePayment(bot, chatId, lang, parts[2]);
  }
  if (action === "reject") {
    const reason = parts.slice(3).join(" ").trim();
    return adminRejectPayment(bot, chatId, lang, parts[2], reason);
  }
  if (action === "better") {
    return adminRequestBetterProof(bot, chatId, lang, parts[2]);
  }
  return send(bot, chatId, t(lang, "admin_help"), { markdown: true });
}

// Route a `sub:adm:<action>:<id>` button tap to the same handler the typed
// `/sub <action> <id>` command uses. Keeps a single source of truth for
// activation, rejection, and "better proof" side-effects.
async function adminButtonCallback(bot, chatId, session, action, idStr) {
  const lang = langOf(session);
  if (action === "apr") return adminApprovePayment(bot, chatId, lang, idStr);
  if (action === "rej") return adminRejectPayment(bot, chatId, lang, idStr, "");
  if (action === "btr") return adminRequestBetterProof(bot, chatId, lang, idStr);
  return send(bot, chatId, t(lang, "admin_help"), { markdown: true });
}

async function adminPendingList(bot, chatId, lang) {
  const rows = await listPendingSubscriptionPayments(25).catch((e) => {
    console.error("admin list pending:", e?.message);
    return [];
  });
  if (!rows.length) return send(bot, chatId, t(lang, "admin_pending_empty"));
  const lines = [];
  for (const p of rows) {
    const u = await loadUserById(p.user_id);
    lines.push(t(lang, "admin_pending_row", {
      id: p.id,
      name: sanitizeMd(u?.name || "—"),
      whatsapp: whatsappNumberFor(u) || "—",
      plan: planMonthsLabel(p.months),
      amount: p.amount_pkr,
      method: p.method === "bank" ? "Bank" : "JazzCash",
      when: new Date(p.submitted_at || Date.now()).toISOString().replace("T", " ").slice(0, 16),
    }));
  }
  return send(bot, chatId, lines.join("\n\n"), { markdown: true });
}

async function loadUserById(userId) {
  try {
    return await getUserById(userId);
  } catch {
    return null;
  }
}

// Shared preflight: parse the id, fetch the payment, and short-circuit when
// the payment is already in a terminal state. Returns { payment } on success
// or null when we've already sent the caller a response.
async function preflightAdminAction(bot, chatId, lang, idStr, allow = new Set()) {
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    await send(bot, chatId, t(lang, "admin_help"), { markdown: true });
    return null;
  }
  const payment = await getSubscriptionPayment(id).catch(() => null);
  if (!payment) {
    await send(bot, chatId, t(lang, "admin_action_not_found"));
    return null;
  }
  // Terminal statuses this action isn't willing to overwrite.
  const terminals = new Set(["approved", "rejected"]);
  for (const s of allow) terminals.delete(s);
  if (terminals.has(payment.payment_status)) {
    await send(bot, chatId, t(lang, "admin_action_already_reviewed", {
      id,
      status: payment.payment_status,
      when: (payment.reviewed_at || "").replace("T", " ").slice(0, 16),
    }));
    return null;
  }
  return { payment, id };
}

// Wrap notifyUser so failures (WA session expired etc.) surface to the admin
// via a small marker line rather than being silently swallowed.
async function notifyUserAndTag(user, key, args, opts, lang) {
  try {
    await notifyUser(user, key, args, opts);
    return t(lang, "admin_user_notified");
  } catch (e) {
    console.error("admin notify user failed:", key, e?.message);
    return t(lang, "admin_user_notify_failed");
  }
}

async function adminApprovePayment(bot, chatId, lang, idStr) {
  const pf = await preflightAdminAction(bot, chatId, lang, idStr);
  if (!pf) return;
  const { payment, id } = pf;

  const user = await loadUserById(payment.user_id);
  const nowIso = new Date().toISOString();

  // §15 — renew before expiry extends from current expiry; renew after
  // expiry starts from the approval date.
  const currentExpiry = user?.sub_expires_at ? new Date(user.sub_expires_at) : null;
  const base = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
  const expiry = addMonths(base, payment.months);

  // Doctor Pro (Addendum §7) keeps the doctor's `tier` untouched — the
  // consistency tier is a patient-tier concept. Only the sub_* fields flip.
  const isDoctorProPlan = String(payment.plan_code || "").startsWith("doctor_pro");

  // Update payment + user atomically-ish: if either DB write fails, tell
  // the admin loudly so they know to retry, rather than showing a fake
  // "approved!" while the row stayed pending.
  try {
    await updateSubscriptionPayment(id, {
      payment_status: "approved",
      reviewed_at: nowIso,
      reviewed_by: `admin:${config.adminNotifyWhatsapp}`,
      activation_at: nowIso,
      expiry_at: expiry.toISOString(),
    });
    const userPatch = {
      sub_status: "active",
      sub_plan_code: payment.plan_code,
      sub_activated_at: nowIso,
      sub_expires_at: expiry.toISOString(),
      sub_last_reminder: null,
    };
    if (!isDoctorProPlan) userPatch.tier = "consistency";
    await updateUser(payment.user_id, userPatch);
  } catch (e) {
    console.error("admin approve DB write failed:", e?.message);
    return send(bot, chatId, t(lang, "admin_db_error", { id, err: e?.message || "unknown" }), {
      markdown: true,
    });
  }

  // Notify the user — flag success/failure back to the admin.
  const activationKey = isDoctorProPlan ? "dp_activated" : "pay_activated";
  const notify = await notifyUserAndTag(user, activationKey, { expiry: formatExpiry(expiry) }, {
    keyboard: { inline_keyboard: [[{ text: "Menu", callback_data: "menu" }]] },
  }, lang);

  return send(bot, chatId, t(lang, "admin_approved_ack", {
    id, name: sanitizeMd(user?.name || "—"), expiry: formatExpiry(expiry), notify,
  }), { markdown: true });
}

async function adminRejectPayment(bot, chatId, lang, idStr, reason) {
  const pf = await preflightAdminAction(bot, chatId, lang, idStr);
  if (!pf) return;
  const { payment, id } = pf;

  const nowIso = new Date().toISOString();
  try {
    await updateSubscriptionPayment(id, {
      payment_status: "rejected",
      reviewed_at: nowIso,
      reviewed_by: `admin:${config.adminNotifyWhatsapp}`,
      reject_reason: reason || null,
    });
    await updateUser(payment.user_id, { sub_status: "payment_rejected" });
  } catch (e) {
    console.error("admin reject DB write failed:", e?.message);
    return send(bot, chatId, t(lang, "admin_db_error", { id, err: e?.message || "unknown" }), {
      markdown: true,
    });
  }

  const user = await loadUserById(payment.user_id);
  const userLang = user?.language || "en";
  const notify = await notifyUserAndTag(user, "pay_rejected", {}, {
    keyboard: {
      inline_keyboard: [[
        { text: t(userLang, "btn_pay_upload_again"), callback_data: "sub:upload_again" },
      ]],
    },
  }, lang);

  return send(bot, chatId, t(lang, "admin_rejected_ack", { id, notify }), { markdown: true });
}

async function adminRequestBetterProof(bot, chatId, lang, idStr) {
  const pf = await preflightAdminAction(bot, chatId, lang, idStr);
  if (!pf) return;
  const { payment, id } = pf;

  const nowIso = new Date().toISOString();
  try {
    await updateSubscriptionPayment(id, {
      payment_status: "better_proof_requested",
      reviewed_at: nowIso,
      reviewed_by: `admin:${config.adminNotifyWhatsapp}`,
    });
    await updateUser(payment.user_id, { sub_status: "awaiting_payment_proof" });
  } catch (e) {
    console.error("admin better DB write failed:", e?.message);
    return send(bot, chatId, t(lang, "admin_db_error", { id, err: e?.message || "unknown" }), {
      markdown: true,
    });
  }

  const user = await loadUserById(payment.user_id);
  const userLang = user?.language || "en";
  const notify = await notifyUserAndTag(user, "pay_better_proof", {}, {
    keyboard: {
      inline_keyboard: [[
        { text: t(userLang, "btn_pay_upload_again"), callback_data: "sub:upload_again" },
      ]],
    },
  }, lang);

  return send(bot, chatId, t(lang, "admin_better_ack", { id, notify }), { markdown: true });
}

// Send a localised message to `user` on whichever channel they're on. We
// import the WhatsApp adapter lazily so tests / Telegram-only setups don't
// have to load it. Returns a promise for the send.
async function notifyUser(user, key, args, opts = {}) {
  if (!user) return;
  const lang = user.language || "en";
  const body = t(lang, key, args || {});
  const chatId = user.phone_number || user.telegram_id;
  if (!chatId) return;
  const source = user.source || (user.phone_number ? "whatsapp" : "telegram");
  const bot = await getBotForSource(source);
  if (!bot) return;
  return send(bot, chatId, body, { markdown: true, ...opts });
}

// Lazy singleton per source. We only need WhatsApp today; add Telegram
// here if it's re-enabled later.
let cachedWhatsappBot = null;
async function getBotForSource(source) {
  if (source === "whatsapp") {
    if (!cachedWhatsappBot) {
      const { whatsappBot } = await import("../whatsapp.js");
      cachedWhatsappBot = whatsappBot();
    }
    return cachedWhatsappBot;
  }
  return null;
}

function addMonths(date, months) {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  // Guard the JS "March 31 + 1 month = May 1" quirk — clamp to the last day
  // of the target month instead so a monthly plan feels intuitive.
  if (d.getUTCDate() < day) d.setUTCDate(0);
  return d;
}

export function formatExpiry(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

// ------------------------------------------------------------------
// Renewal reminders + auto-downgrade (spec §13, §14)
// ------------------------------------------------------------------

// Compute days-until-expiry (integer, positive = future, 0 = today, negative
// = past). Uses whole calendar days so a 23:59 vs 00:01 tick lands in the
// same bucket.
function daysUntilExpiry(expiresAt) {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return null;
  const now = new Date();
  const msPerDay = 86400 * 1000;
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const end = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
  return Math.round((end - start) / msPerDay);
}

// One scheduler tick pass for subscription lifecycle. Cheap enough to run
// every 15 minutes — dedupes via `sub_last_reminder` and only touches users
// whose sub_status is Active or already Expiring Soon.
export async function runSubscriptionLifecycleTick() {
  const active = await listUsersBySubStatus(["active", "expiring_soon"])
    .catch((e) => { console.error("sub lifecycle: list active:", e?.message); return []; });
  for (const u of active) {
    try {
      const days = daysUntilExpiry(u.sub_expires_at);
      if (days == null) continue;

      // §14 — expired: downgrade to Free.
      if (days < 0) {
        await autoDowngrade(u);
        continue;
      }

      // §13 — 7-day / 1-day / today reminders. Each is sent at most once.
      let reminderKey = null;
      if (days === 0)      reminderKey = "sub_reminder_today";
      else if (days === 1) reminderKey = "sub_reminder_1d";
      else if (days === 7) reminderKey = "sub_reminder_7d";
      if (!reminderKey) continue;
      if (u.sub_last_reminder === reminderKey) continue;

      const lang = u.language || "en";
      const kb = {
        inline_keyboard: [[
          { text: t(lang, "btn_sub_renew"), callback_data: "sub:renew" },
          { text: t(lang, "btn_sub_later"), callback_data: "sub:later" },
        ]],
      };
      await notifyUser(u, reminderKey, {}, { keyboard: kb }).catch((e) =>
        console.error("sub lifecycle: reminder send:", e?.message)
      );

      const patch = { sub_last_reminder: reminderKey };
      if (days <= 7 && u.sub_status !== "expiring_soon") patch.sub_status = "expiring_soon";
      await updateUser(u.id, patch).catch((e) =>
        console.error("sub lifecycle: mark reminder:", e?.message)
      );
    } catch (e) {
      console.error("sub lifecycle tick:", u.id, e?.message);
    }
  }
}

async function autoDowngrade(user) {
  const lang = user.language || "en";
  const isDoctorProPlan = String(user.sub_plan_code || "").startsWith("doctor_pro");

  // Doctor Pro expiry (Addendum §7): existing patients stay connected
  // (already true — we don't touch the link rows). We only flip the sub_*
  // fields so isDoctorPro() returns false and the 10-cap comes back into
  // effect for new links. `tier` stays as it was.
  const patch = {
    sub_status: "expired",
    sub_last_reminder: null,
  };
  if (!isDoctorProPlan) patch.tier = "free";
  await updateUser(user.id, patch)
    .catch((e) => console.error("sub lifecycle: downgrade user:", e?.message));

  const kb = {
    inline_keyboard: [[
      { text: t(lang, "btn_sub_renew"),     callback_data: "sub:renew" },
      { text: t(lang, "btn_sub_main_menu"), callback_data: "menu" },
    ]],
  };
  const key = isDoctorProPlan ? "dp_expired_downgrade" : "sub_expired_downgrade";
  await notifyUser({ ...user, sub_status: "expired" }, key, {}, { keyboard: kb })
    .catch((e) => console.error("sub lifecycle: downgrade notify:", e?.message));
}
