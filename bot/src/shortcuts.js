// Universal shortcut / smart-alias engine.
//
// Ten canonical shortcuts are advertised to users; behind them sits an
// alias table covering English, WhatsApp-wali Roman Urdu and Urdu script.
// This file is pure logic: it recognises intent, detects structured
// health readings, and answers "is this a question?" — the router in
// bot.js maps each intent to the corresponding flow handler.
//
// Design rules from the spec:
//   • Global commands (menu, help, health, food, report, progress,
//     challenge, doctor) may override the current flow.
//   • sugar / meds may replace the current flow immediately (they start
//     another explicit check-in).
//   • A bare word like "sugar" must NEVER be triggered by substring
//     matching inside an unrelated clinical question; matching is done
//     against normalized tokens, and clinical-question phrasing wins.
//   • Structured readings ("sugar 145", "weight 67 kg") are treated as
//     a data-entry intent — but never for plain questions ("is sugar
//     145 bad?"), which route to Ask DrSaab.

export const INTENT = {
  MENU: "MENU",
  HELP: "HELP",
  HEALTH: "HEALTH",
  SUGAR_LOG: "SUGAR_LOG",
  MEDICATION: "MEDICATION",
  FOOD_HELP: "FOOD_HELP",
  REPORT: "REPORT",
  PROGRESS: "PROGRESS",
  CHALLENGE: "CHALLENGE",
  DOCTOR: "DOCTOR",
  HBA1C_SHOW: "HBA1C_SHOW",
  CANCEL: "CANCEL",
  RESUME: "RESUME",
};

// Global commands may replace the currently active flow. `sugar` and
// `meds` are included per §7 — they explicitly start another check-in.
export const GLOBAL_INTENTS = new Set([
  INTENT.MENU,
  INTENT.HELP,
  INTENT.HEALTH,
  INTENT.SUGAR_LOG,
  INTENT.MEDICATION,
  INTENT.FOOD_HELP,
  INTENT.REPORT,
  INTENT.PROGRESS,
  INTENT.CHALLENGE,
  INTENT.DOCTOR,
  INTENT.HBA1C_SHOW,
  INTENT.CANCEL,
  INTENT.RESUME,
]);

// Advertised top-10 shortcut words (English canonical form). Displayed
// in the Quick Shortcuts help card and treated as the highest-priority
// exact match.
export const PRIMARY_COMMANDS = {
  menu: INTENT.MENU,
  help: INTENT.HELP,
  health: INTENT.HEALTH,
  sugar: INTENT.SUGAR_LOG,
  meds: INTENT.MEDICATION,
  food: INTENT.FOOD_HELP,
  report: INTENT.REPORT,
  progress: INTENT.PROGRESS,
  challenge: INTENT.CHALLENGE,
  doctor: INTENT.DOCTOR,
};

// Per-intent aliases across English, WhatsApp-wali Roman Urdu and Urdu
// script. Entries are lowercased and normalised the same way input is,
// so matching is a plain equality check.
const ALIASES = {
  [INTENT.MENU]: [
    "menu", "home", "start", "main menu", "options", "show menu", "back to menu",
    "menu dikhao", "menu kholo", "options dikhao", "wapas menu", "main menu dikhao",
    "مینو", "مینو دکھاؤ", "مینو کھولو",
  ],
  [INTENT.HELP]: [
    "help", "commands", "shortcuts", "what can you do", "how does this work",
    "how do i use this", "how to use", "?", "/?",
    "madad", "madat", "help karo", "kya kar sakte ho", "kaise use karoon", "kaise use karun",
    "مدد", "کیا کر سکتے ہو",
  ],
  [INTENT.HEALTH]: [
    "health", "my health", "summary", "profile", "my data", "my stats", "history",
    "my profile", "health summary",
    "meri health", "mera data", "health summary", "record dikhao", "meri sehat",
    "meri sehat dikhao",
    "میری صحت", "میرا ڈیٹا", "ہیلتھ",
  ],
  [INTENT.SUGAR_LOG]: [
    "sugar", "glucose", "blood sugar", "bs", "reading", "log sugar", "check sugar",
    "log my sugar", "add sugar",
    "sugar note karo", "sugar likho", "glucose likho", "sugar check karo", "shakar",
    "شوگر", "گلوکوز", "شوگر لکھو", "شوگر نوٹ کرو",
  ],
  [INTENT.MEDICATION]: [
    "meds", "medicine", "medication", "medications", "tablet", "tablets", "pill",
    "pills", "insulin", "dose", "medicines", "log meds", "took my medicine",
    "i took my medicine", "i took my meds", "took my meds", "took medicine",
    "dawai", "dawa", "dawai li", "medicine log karo", "tablet le li", "dawa le li",
    "maine dawa li", "dawa le li hai",
    "دوا", "دوائی", "میڈیسن",
  ],
  [INTENT.FOOD_HELP]: [
    "food", "meal", "khana", "breakfast", "lunch", "dinner", "snack", "snacks",
    "restaurant", "what can i eat", "food help", "food coach",
    "kya khaun", "kya khaoon", "kya khaana hai", "khana check karo", "biryani",
    "کھانا", "کیا کھاؤں",
  ],
  [INTENT.REPORT]: [
    "report", "lab", "labs", "results", "blood test", "upload report", "hba1c report",
    "lab report", "test report",
    "report check karo", "lab result", "test upload karna hai", "report upload",
    "لیب", "رپورٹ", "رپورٹ چیک کرو",
  ],
  [INTENT.PROGRESS]: [
    "progress", "goal", "goals", "score", "streak", "how am i doing", "my progress",
    "goals and progress",
    "meri progress", "goal dikhao", "goals dikhao", "main kaisa kar raha hoon",
    "kaisa kar raha hoon", "score dikhao",
    "میری پروگریس", "میرا گول", "اسکور",
  ],
  [INTENT.CHALLENGE]: [
    "challenge", "challenges", "rank", "ranking", "leaderboard", "competition",
    "chal", "join challenge",
    "challenge join karna hai", "mera rank", "leaderboard dikhao", "challenge dikhao",
    "چیلنج", "لیڈر بورڈ",
  ],
  [INTENT.DOCTOR]: [
    "doctor", "my doctor", "referral", "referral code", "connect doctor", "patients",
    "my patients", "docs", "doc",
    "doctor se connect", "referral code", "mera doctor", "doctor dikhao",
    "ڈاکٹر", "میرا ڈاکٹر", "ریفرل کوڈ",
  ],
  [INTENT.CANCEL]: [
    "cancel", "stop", "quit", "exit",
    "band karo", "rehne do", "cancel karo", "ruk jao",
    "چھوڑو", "بند کرو", "روکو",
  ],
  [INTENT.RESUME]: [
    "resume", "continue", "wapas", "wapas jao",
    "پھر سے شروع کرو", "دوبارہ",
  ],
};

// HbA1c retrieval — separate from REPORT (upload) so "show my hba1c"
// pulls the stored value instead of starting an upload. Detected in
// resolveIntent() with a specific phrase check because the words
// "hba1c" alone shouldn't override REPORT.
const HBA1C_SHOW_PATTERNS = [
  /^\s*(show|what(?:'|)s|whats|what\s+is|tell me|display|get|latest|my|current)\b.*\bhba1c\b/i,
  /^\s*hba1c\s*(kya|kitna|kitni)\b/i,
  /^\s*mera\s+hba1c\b/i,
  /^\s*meri\s+hba1c\b/i,
];

// Word starters that mark a message as a question — used to keep
// clinical questions from being misrouted into data-entry flows.
const QUESTION_STARTERS_EN = [
  "is", "are", "am", "can", "could", "should", "shall", "will", "would", "may",
  "might", "do", "does", "did", "has", "have", "had", "what", "how", "why",
  "when", "where", "who", "which", "whose", "whom",
];
const QUESTION_STARTERS_UR = [
  "kya", "kaisa", "kaise", "kaisi", "kyun", "kyoon", "kahan", "kab", "kaun",
  "kis", "kitna", "kitni", "kitne",
];

// Normalise a message for matching: lowercase, strip decorative
// punctuation but keep '?' (question detection) and digits/units.
// Collapse repeated characters ("meeeeenu" → "meenu"), collapse spaces.
export function normalize(text) {
  if (text == null) return "";
  let s = String(text).toLowerCase();
  // Fold WhatsApp emoji separators to plain space.
  s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, " ");
  s = s.replace(/[.,!;:'"()\[\]{}<>]/g, " ");
  s = s.replace(/[\/\\|]/g, " ");
  s = s.replace(/(.)\1{2,}/g, "$1$1");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

// Does the message look like a question?  We keep this permissive: a
// trailing '?' or a question-word start counts. Used to steer clinical
// questions ("is sugar 145 bad?") away from data-entry intents.
export function isQuestion(rawText) {
  if (!rawText) return false;
  const raw = String(rawText).trim();
  if (raw.endsWith("?") || raw.endsWith("؟")) return true;
  const lower = raw.toLowerCase().replace(/[^\w\s]/g, " ").trim();
  const first = lower.split(/\s+/)[0] || "";
  if (QUESTION_STARTERS_EN.includes(first)) return true;
  if (QUESTION_STARTERS_UR.includes(first)) return true;
  return false;
}

// Same regex work as detectStructuredData, but WITHOUT the isQuestion
// guard — used by the "clinical question with reading" case so the
// router can offer to save the value after Ask DrSaab replies.
export function detectReadingInQuestion(rawText) {
  if (!rawText) return null;
  return detectStructuredDataInternal(rawText);
}

// Structured health-data detection. Returns the sub-intent + any
// extracted number so the caller can pre-seed the corresponding flow.
// Only fires when the message actually carries a numeric value AND is
// not phrased as a question — the two rules together satisfy AC-04/05.
export function detectStructuredData(rawText) {
  if (!rawText) return null;
  if (isQuestion(rawText)) return null;
  return detectStructuredDataInternal(rawText);
}

function detectStructuredDataInternal(rawText) {
  const lower = String(rawText).toLowerCase();

  // HbA1c reading (a percentage between 4 and 20 with hba1c/a1c word).
  const a1cM = lower.match(/(?:hba1c|a1c)[^0-9]{0,10}(\d+(?:\.\d+)?)/);
  if (a1cM) {
    const v = parseFloat(a1cM[1]);
    if (Number.isFinite(v) && v >= 4 && v <= 20) {
      return { intent: INTENT.SUGAR_LOG, kind: "hba1c", value: v, raw: rawText };
    }
  }

  // Glucose reading: sugar / glucose / bs / shakar plus a number.
  // Number range guards against e.g. "sugar in 2 cups" being misread.
  const sugarM = lower.match(
    /\b(?:sugar|glucose|blood sugar|bs|shakar|شوگر)\b[^0-9]{0,20}(\d+(?:\.\d+)?)/,
  );
  if (sugarM) {
    const v = parseFloat(sugarM[1]);
    if (Number.isFinite(v) && ((v >= 30 && v <= 700) || (v >= 3 && v < 30))) {
      return { intent: INTENT.SUGAR_LOG, kind: "glucose", value: v, raw: rawText };
    }
  }

  // Weight — "weight 67", "weight 67 kg", "wazan 68". Doesn't currently
  // start a check-in for the user, but flagged for the caller so the
  // My Health / weight flow can handle it in future.
  const weightM = lower.match(
    /\b(?:weight|wazan|وزن)\b[^0-9]{0,20}(\d+(?:\.\d+)?)\s*(kg|kgs|pounds?|lbs?)?/,
  );
  if (weightM) {
    const v = parseFloat(weightM[1]);
    if (Number.isFinite(v) && v >= 20 && v <= 400) {
      return { intent: "WEIGHT_LOG", kind: "weight", value: v, unit: weightM[2] || "kg", raw: rawText };
    }
  }

  // Steps — "walked 5000 steps", "5000 steps"
  const stepsM = lower.match(/\b(?:walked|steps?)\b[^0-9]{0,20}(\d{3,6})/) ||
                 lower.match(/(\d{3,6})\s*(?:steps?|qadam)/);
  if (stepsM) {
    const v = parseInt(stepsM[1], 10);
    if (Number.isFinite(v) && v >= 100 && v <= 100000) {
      return { intent: "STEPS_LOG", kind: "steps", value: v, raw: rawText };
    }
  }

  return null;
}

// Build a lookup: normalized alias → intent. Longer aliases first so
// "main menu" beats "menu" for the whole-message equality check.
const ALIAS_LOOKUP = (() => {
  const entries = [];
  for (const [intent, list] of Object.entries(ALIASES)) {
    for (const alias of list) {
      const key = normalize(alias);
      if (!key) continue;
      entries.push({ key, intent, len: key.length });
    }
  }
  entries.sort((a, b) => b.len - a.len);
  return entries;
})();

const EXACT_MAP = (() => {
  const m = new Map();
  for (const e of ALIAS_LOOKUP) {
    if (!m.has(e.key)) m.set(e.key, e.intent);
  }
  return m;
})();

// Public: resolve a user's message to a canonical intent.
//
// Return shape: { intent, matchType, confidence, extracted, structured } or null.
//   matchType is one of: exact, alias, structured, hba1c_show.
//   confidence is a coarse tag ('high' | 'medium'); the router treats
//   'high' as directly-actionable and 'medium' as needing confirmation.
//
// The `opts` object lets the caller nudge behaviour:
//   { inFlow: bool }  — if in an active flow, a short natural response
//                       ("yes", "145", "after dinner") should stay in
//                       the flow. We only intercept when the message
//                       clearly matches an advertised shortcut.
//   { role: "doctor" | "patient" }  — reserved for future role-aware routing.
export function resolveIntent(rawText, opts = {}) {
  if (!rawText || typeof rawText !== "string") return null;
  const norm = normalize(rawText);
  if (!norm) return null;

  // 1. HbA1c retrieval phrases outrank generic REPORT.
  for (const re of HBA1C_SHOW_PATTERNS) {
    if (re.test(rawText)) {
      return {
        intent: INTENT.HBA1C_SHOW,
        matchType: "hba1c_show",
        confidence: "high",
      };
    }
  }

  // 2. Exact whole-message match against advertised shortcut or alias.
  //    Both single-token ("menu") and multi-word aliases ("how am i
  //    doing", "meri health") land here. Whole-message matches are
  //    unambiguous — the router can trust them without a question
  //    guard, since the user typed the alias verbatim.
  const exact = EXACT_MAP.get(norm);
  if (exact) {
    return {
      intent: exact,
      matchType: PRIMARY_COMMANDS[norm] ? "exact" : "alias_full",
      confidence: "high",
    };
  }

  // 3. Slash-prefixed variant of any primary command (`/sugar`, `/food`).
  if (norm.startsWith("/")) {
    const stripped = norm.slice(1).trim();
    const p = PRIMARY_COMMANDS[stripped];
    if (p) return { intent: p, matchType: "exact", confidence: "high" };
    const aliased = EXACT_MAP.get(stripped);
    if (aliased) return { intent: aliased, matchType: "alias_full", confidence: "high" };
  }

  // 4. Structured health-data messages (only when not phrased as a
  //    question). "My sugar is 145" starts a glucose entry with the
  //    value pre-parsed.
  const structured = detectStructuredData(rawText);
  if (structured) {
    return {
      intent: structured.intent,
      matchType: "structured",
      confidence: "high",
      structured,
    };
  }

  // 5. Multi-token starts-with match: bounded to short messages that
  //    aren't questions, e.g. "menu please" or "food coach". Marked
  //    "partial" so the router can apply an extra safety check —
  //    long clinical sentences won't reach here anyway (token cap +
  //    question guard).
  const tokens = norm.split(/\s+/);
  if (tokens.length <= 3 && !isQuestion(rawText)) {
    const first = tokens[0];
    if (PRIMARY_COMMANDS[first]) {
      return {
        intent: PRIMARY_COMMANDS[first],
        matchType: "partial",
        confidence: opts.inFlow ? "medium" : "high",
      };
    }
    if (tokens.length >= 2) {
      const twoTok = tokens.slice(0, 2).join(" ");
      const aliasHit = EXACT_MAP.get(twoTok);
      if (aliasHit) {
        return {
          intent: aliasHit,
          matchType: "partial",
          confidence: opts.inFlow ? "medium" : "high",
        };
      }
    }
  }

  return null;
}

// Convenience: is this intent one that may replace an active flow?
export function isGlobalIntent(intent) {
  return GLOBAL_INTENTS.has(intent);
}

// §6 disambiguation rule 4: "Can I eat biryani?" and its many
// phrasings should land in the Food Help coach conversationally,
// not in Ask DrSaab. Returns true for the shapes we recognise.
const FOOD_QUESTION_PATTERNS = [
  /\b(can|could|may|should)\s+i\s+(eat|have|drink|take|order)\b/i,
  /\bis\s+.{1,40}\s+(ok|okay|fine|safe|allowed|bad|good)\s+(to\s+eat|for\s+me|for\s+diabetes|for\s+sugar)\b/i,
  /\bwhat\s+(can|should)\s+i\s+eat\b/i,
  /\bkha\s+(sakta|sakti|sakte)\s+(hoon|hun|hain|ho)\b/i,
  /\bkya\s+khaun\b/i,
  /\bkya\s+khaana\b/i,
  /کھا\s+سکت/,
];
export function isFoodQuestion(rawText) {
  if (!rawText) return false;
  const s = String(rawText);
  return FOOD_QUESTION_PATTERNS.some((re) => re.test(s));
}

// §10 event logging. Structured console output — swap for a real
// analytics sink later without changing the call sites.
//
// Per the privacy note in §10, we do NOT persist raw message text
// indefinitely. Call sites pass only what the schema needs; text is
// truncated to a short prefix (for debugging) and never stored to DB.
export function logShortcutEvent(name, payload = {}) {
  const safe = { ...payload };
  if (typeof safe.message_text === "string") {
    safe.message_text = safe.message_text.slice(0, 60);
  }
  try {
    console.log(`[shortcut] ${name} ${JSON.stringify(safe)}`);
  } catch {
    /* ignore log formatting issues */
  }
}
