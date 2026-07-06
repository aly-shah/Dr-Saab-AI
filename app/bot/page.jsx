"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SparkleIcon } from "@/components/icons";

// Light Markdown → HTML (bot replies use *bold* _italic_ `code`).
function mdToHtml(s = "") {
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/\*(.+?)\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code class='rounded bg-black/5 px-1 py-0.5 text-[0.85em]'>$1</code>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function makeSessionId() {
  return Math.floor(Math.random() * 9e11) + 1e11;
}

// ---- quick-reply icons mapped from the bot's callback_data ----
function chipKey(data = "") {
  if (data.startsWith("feat:")) return data.slice(5);
  if (data.startsWith("lang:")) return "language";
  if (data.startsWith("gender:")) return "gender";
  if (data.startsWith("ds:")) return "diabetes";
  return data;
}

const I = (paths) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

function ChipIcon({ data }) {
  switch (chipKey(data)) {
    case "glucose": return I(<path d="M12 3.5l5 5a7 7 0 1 1-10 0l5-5z" />);
    case "medication": return I(<><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(45 12 12)" /><path d="M8.5 8.5l7 7" /></>);
    case "health": return I(<><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M9 8h6M9 12l1.5 1.5L14 10" /></>);
    case "progress": return I(<path d="M3 17l5-5 3 3 7-7M21 8V5h-3" />);
    case "coach": return I(<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.7A8.4 8.4 0 1 1 21 11.5z" />);
    case "food": return I(<><path d="M4 11h16a8 8 0 0 1-16 0z" /><path d="M7 21h10M12 11V3" /></>);
    case "fitness": return I(<><path d="M6.5 6.5l11 11M4 9l2-2M20 15l-2 2M2.5 11.5l3 3M21.5 12.5l-3-3" /></>);
    case "lab": return I(<><path d="M9 3h6M10 3v6l-5 8a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-8V3" /></>);
    case "summary": return I(<><rect x="3.5" y="4.5" width="17" height="16" rx="2.5" /><path d="M3.5 9h17M8 3v3M16 3v3" /></>);
    case "learn": return I(<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" />);
    case "profile": return I(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>);
    case "subscription": return I(<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" />);
    case "language": return I(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>);
    case "gender": return I(<><circle cx="12" cy="8" r="3.5" /><path d="M6 20a6 6 0 0 1 12 0" /></>);
    case "diabetes": return I(<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5 5.5 5.5 0 0 0 2 8.5C2 12 5 14 12 21c2-2 4-3.8 5.5-5.3" />);
    case "skip": return I(<path d="M5 5l7 7-7 7M13 5l7 7-7 7" />);
    case "menu": return I(<path d="M4 6h16M4 12h16M4 18h16" />);
    default: return I(<circle cx="12" cy="12" r="3" />);
  }
}

function Avatar() {
  return (
    <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-soft">
      <SparkleIcon className="h-4 w-4" />
    </span>
  );
}

export default function BotChatPage() {
  const [messages, setMessages] = useState([]); // {from, text, rows?}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState({ idx: -1, n: 0 }); // typewriter state
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const startedRef = useRef(false);
  const fileRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const callBot = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const res = await fetch("/api/bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionRef.current, ...payload }),
        });
        const data = await res.json();
        const bots = (data.messages || []).map((m) => ({ from: "bot", text: m.text, rows: m.rows || [] }));
        setMessages((prev) => [...prev, ...bots]);
      } catch {
        setMessages((prev) => [...prev, { from: "bot", text: "Couldn't reach the server. Is the bot running?", rows: [] }]);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    },
    [scrollToBottom]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let id = null;
    try {
      id = localStorage.getItem("drsaab_session");
    } catch {}
    if (!id) {
      id = String(makeSessionId());
      try {
        localStorage.setItem("drsaab_session", id);
      } catch {}
    }
    sessionRef.current = Number(id);
    callBot({ type: "text", text: "/start" });
  }, [callBot]);

  // start streaming the newest bot message
  useEffect(() => {
    const last = messages.length - 1;
    if (last < 0 || messages[last].from !== "bot") return;
    setReveal((r) => (r.idx === last ? r : { idx: last, n: 0 }));
  }, [messages]);

  // typewriter tick
  useEffect(() => {
    if (reveal.idx < 0) return;
    const m = messages[reveal.idx];
    if (!m || m.from !== "bot") return;
    const full = m.text.length;
    if (reveal.n >= full) return;
    const step = Math.max(2, Math.round(full / 55)); // ~55 ticks regardless of length
    const t = setTimeout(() => {
      setReveal((r) => ({ idx: r.idx, n: Math.min(full, r.n + step) }));
      scrollToBottom();
    }, 18);
    return () => clearTimeout(t);
  }, [reveal, messages, scrollToBottom]);

  const autoGrow = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  };

  const sendText = (text) => {
    const t = text.trim();
    if (!t || loading) return;
    setMessages((prev) => [...prev, { from: "user", text: t }]);
    setInput("");
    requestAnimationFrame(() => taRef.current && (taRef.current.style.height = "auto"));
    callBot({ type: "text", text: t });
  };

  const sendCallback = (btn) => {
    if (loading) return;
    // Special-case: the "Upload Image" chip on the Explain My Report screen
    // opens the browser file picker instead of firing the bot callback.
    if (btn.data === "feat:upload_lab") {
      fileRef.current?.click();
      return;
    }
    setMessages((prev) => [...prev, { from: "user", text: btn.label }]);
    callBot({ type: "callback", data: btn.data });
  };

  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || loading) return;
    if (!file.type?.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      const caption = input.trim();
      setMessages((prev) => [...prev, { from: "user", image: dataUrl, text: caption }]);
      setInput("");
      requestAnimationFrame(() => taRef.current && (taRef.current.style.height = "auto"));
      callBot({ type: "image", dataUrl, caption });
    };
    reader.readAsDataURL(file);
  };

  const resetChat = () => {
    const id = String(makeSessionId());
    try {
      localStorage.setItem("drsaab_session", id);
    } catch {}
    sessionRef.current = Number(id);
    setMessages([]);
    setReveal({ idx: -1, n: 0 });
    callBot({ type: "text", text: "/start" });
  };

  const lastBotIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].from === "bot") return i;
    return -1;
  })();

  const empty = messages.length === 0;

  return (
    <div className="flex h-dvh flex-col bg-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-primary-light/15 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* top bar */}
      <header className="flex items-center justify-between border-b border-line/50 px-3 py-3 sm:px-6">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <a href="/" title="Back to website" className="flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-ink/60 transition hover:bg-muted hover:text-ink">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">Website</span>
          </a>
          <span className="h-5 w-px bg-line/70" />
          <div className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="" className="h-8 w-8 object-contain" />
            <span className="text-[15px] font-bold tracking-tight text-ink">
              DrSaab <span className="text-primary">AI</span>
            </span>
            <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-accent sm:inline">online</span>
          </div>
        </div>
        <button onClick={resetChat} className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink/60 transition hover:bg-muted hover:text-ink">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12a7 7 0 1 1 2 5M5 12V7m0 5h5" />
          </svg>
          New chat
        </button>
      </header>

      {/* conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-6 sm:px-6">
          {empty && (
            <div className="grid min-h-[55vh] place-items-center text-center">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-card">
                  <SparkleIcon className="h-8 w-8" />
                </span>
                <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Hi, I&apos;m DrSaab</h1>
                <p className="mx-auto mt-2 max-w-md text-ink/55">Your personal diabetes coach. Let&apos;s get you set up…</p>
                <div className="mt-6 flex items-center justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-primary/50 animate-typing" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((m, i) => {
              const streaming = i === reveal.idx && reveal.n < m.text.length;
              const shown = i === reveal.idx ? m.text.slice(0, reveal.n) : m.text;

              if (m.from === "user") {
                if (m.image) {
                  return (
                    <div key={i} className="message-in flex justify-end">
                      <div className="max-w-[75%] overflow-hidden rounded-3xl rounded-br-lg bg-primary p-1 shadow-soft">
                        <img src={m.image} alt="Uploaded report" className="block max-h-72 w-full rounded-2xl object-cover" />
                        {m.text ? (
                          <div className="px-3 py-1.5 text-[15px] leading-relaxed text-white">{m.text}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="message-in flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-soft">
                      {m.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} className="message-in flex gap-3">
                  <Avatar />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div
                      className={`prose-chat whitespace-pre-wrap text-[15px] leading-relaxed text-ink ${streaming ? "stream-caret" : ""}`}
                      dangerouslySetInnerHTML={{ __html: mdToHtml(shown) }}
                    />
                    {!streaming && i === lastBotIdx && m.rows?.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        {m.rows.map((row, r) => (
                          <div key={r} className="flex flex-wrap gap-1.5">
                            {row.map((btn, c) => (
                              <button
                                key={c}
                                onClick={() => sendCallback(btn)}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-ink/80 transition hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                              >
                                <span className="text-primary/80"><ChipIcon data={btn.data} /></span>
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && !empty && (
              <div className="message-in flex gap-3">
                <Avatar />
                <div className="flex items-center gap-1 pt-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-ink/30 animate-typing" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* composer */}
      <div className="border-t border-line/40 bg-white/80 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
          <form
            onSubmit={(e) => { e.preventDefault(); sendText(input); }}
            className="flex items-end gap-1 rounded-3xl border border-line bg-white p-1.5 pl-2 shadow-soft focus-within:border-primary focus-within:shadow-card"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFilePicked}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              aria-label="Attach image"
              title="Attach report image"
              className="grid h-10 w-10 flex-none place-items-center rounded-full text-ink/55 transition hover:bg-muted hover:text-primary disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.4 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 1 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
              </svg>
            </button>
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoGrow(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(input); } }}
              placeholder="Message DrSaab…"
              className="max-h-44 flex-1 resize-none bg-transparent py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/35"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary text-white shadow-soft transition hover:bg-primary-dark disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-ink/40">
            DrSaab gives general guidance, not medical advice. In an emergency, contact a doctor.
          </p>
        </div>
      </div>
    </div>
  );
}
