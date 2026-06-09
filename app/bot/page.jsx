"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { HeartPulseIcon, SparkleIcon } from "@/components/icons";

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
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const startedRef = useRef(false);

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
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "⚠️ Couldn't reach the server. Is the bot running?", rows: [] },
        ]);
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

  useEffect(scrollToBottom, [messages, loading, scrollToBottom]);

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
    setMessages((prev) => [...prev, { from: "user", text: btn.label }]);
    callBot({ type: "callback", data: btn.data });
  };

  const resetChat = () => {
    const id = String(makeSessionId());
    try {
      localStorage.setItem("drsaab_session", id);
    } catch {}
    sessionRef.current = Number(id);
    setMessages([]);
    callBot({ type: "text", text: "/start" });
  };

  const lastBotIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].from === "bot") return i;
    return -1;
  })();

  const empty = messages.length === 0;

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-primary-light/15 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* top bar */}
      <header className="flex items-center justify-between border-b border-line/50 px-4 py-3 sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-soft">
            <HeartPulseIcon className="h-5 w-5" />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink">
            Dr Saab <span className="text-primary">AI</span>
          </span>
          <span className="ml-1 hidden rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-accent sm:inline">
            ● online
          </span>
        </a>
        <button
          onClick={resetChat}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink/60 transition hover:bg-muted hover:text-ink"
        >
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
                <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  Hi, I&apos;m Dr Saab AI
                </h1>
                <p className="mx-auto mt-2 max-w-md text-ink/55">
                  Your personal diabetes coach. Let&apos;s get you set up…
                </p>
                <div className="mt-6 flex items-center justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-primary/50 animate-typing" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((m, i) =>
              m.from === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-soft">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <Avatar />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div
                      className="prose-chat whitespace-pre-wrap text-[15px] leading-relaxed text-ink"
                      dangerouslySetInnerHTML={{ __html: mdToHtml(m.text) }}
                    />
                    {i === lastBotIdx && m.rows?.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        {m.rows.map((row, r) => (
                          <div key={r} className="flex flex-wrap gap-1.5">
                            {row.map((btn, c) => (
                              <button
                                key={c}
                                onClick={() => sendCallback(btn)}
                                disabled={loading}
                                className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-ink/80 transition hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {loading && !empty && (
              <div className="flex gap-3">
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
            onSubmit={(e) => {
              e.preventDefault();
              sendText(input);
            }}
            className="flex items-end gap-2 rounded-3xl border border-line bg-white p-1.5 pl-4 shadow-soft focus-within:border-primary focus-within:shadow-card"
          >
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoGrow();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendText(input);
                }
              }}
              placeholder="Message Dr Saab AI…"
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
            Dr Saab AI gives general guidance, not medical advice. In an emergency, contact a doctor.
          </p>
        </div>
      </div>
    </div>
  );
}
