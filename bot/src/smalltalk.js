// Small-talk replies that don't need the AI.
//
// "thanks", "ok", "👍", "hi" … used to cost a full AI call (system prompt +
// chat history) just to get "You're welcome!" back. Only a WHOLE message that
// is small talk matches — anything with a question or extra words still goes
// to the AI.

const PATTERNS = [
  ["thanks", /^(thanks?|thank\s*you|thank\s*u|thx|ty|tysm|thanks\s+a\s+lot|many\s+thanks|shukriya|shukria|shukran|jazak\s*allah(\s*khair)?|jzk|شکریہ|جزاک\s*اللہ)(\s+(dr\.?\s*saab|doctor|sir|so\s+much|a\s+lot|bohat|bht|bhot))?$/i],
  ["bye", /^(bye|goodbye|good\s*bye|see\s*you|see\s*ya|take\s*care|allah\s*hafiz|khuda\s*hafiz|اللہ\s*حافظ|خدا\s*حافظ|good\s*night|gn)$/i],
  ["ack", /^(ok|okay|okk+|k|kk|fine|great|nice|good|cool|alright|all\s*right|sure|done|got\s*it|noted|perfect|acha|achha|accha|theek\s*(hai|he)?|thik\s*(hai|he)?|ji|jee|hmm+|hm|ٹھیک\s*ہے|اچھا|جی)$/i],
  ["hello", /^(hi+|hello+|hey+|helo+|salaam|salam|assalam\s*o?\s*alaikum|aoa|السلام\s*علیکم)$/i],
];

// Strip punctuation and emoji; an emoji-only message ("👍", "🙏", "❤️") is an ack.
export function detectSmallTalk(text) {
  if (!text) return null;
  const raw = String(text).trim();
  if (!raw || raw.length > 40) return null;
  const core = raw
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu, " ")
    .replace(/[.,!?؟۔:;'"()\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!core) return /\p{Extended_Pictographic}/u.test(raw) ? "ack" : null;
  for (const [kind, re] of PATTERNS) if (re.test(core)) return kind;
  return null;
}

// i18n key for a template reply, or null when the AI should answer. Skips
// photos, and skips when DrSaab's last reply asked something — then "ok" /
// "sure" is an answer to that question and needs the AI.
export function smallTalkReplyKey(session, text, hasImage = false) {
  if (hasImage) return null;
  const kind = detectSmallTalk(text);
  if (!kind) return null;
  const last = [...(session?.history || [])].reverse().find((m) => m.role === "assistant");
  if (last && /[?؟]\s*$/.test(String(last.content || ""))) return null;
  return `smalltalk_${kind}`;
}
