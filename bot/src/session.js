// In-memory per-chat session. Holds the transient conversation state
// (current flow + step + coach history). The persistent profile lives in
// Supabase. On process restart, an in-progress flow simply restarts —
// acceptable for the MVP.

const sessions = new Map();

export function getSession(chatId) {
  let s = sessions.get(chatId);
  if (!s) {
    // `source` is the channel this chat arrived on ("web" | "whatsapp" |
    // "telegram"). Set on every inbound message/callback and deliberately
    // NOT cleared by resetFlow — it describes the transport, not the flow.
    // `userFetchedAt` is when `user` was last read from the database — see
    // ensureSessionUser() in bot.js, which re-reads it when it goes stale so
    // out-of-band changes (an admin plan change) reach a live chat.
    s = { state: "idle", step: null, data: {}, history: [], user: null, source: null, userFetchedAt: 0 };
    sessions.set(chatId, s);
  }
  return s;
}

export function resetFlow(chatId) {
  const s = getSession(chatId);
  s.state = "idle";
  s.step = null;
  s.data = {};
  s.history = [];
}

// Drop the entire in-memory session (used by the DELETE hard-reset, so the
// next message starts a brand-new, freshly created user).
export function clearSession(chatId) {
  sessions.delete(chatId);
}

export function setUser(chatId, user) {
  getSession(chatId).user = user;
}

export function pushHistory(session, role, content) {
  session.history.push({ role, content });
  if (session.history.length > 12) session.history = session.history.slice(-12);
}
