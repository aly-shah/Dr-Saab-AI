"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { HeartPulseIcon, ArrowRightIcon } from "@/components/icons";

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
  // a stable per-browser numeric id (fits Postgres bigint, < 2^53)
  return Math.floor(Math.random() * 9e11) + 1e11;
}

export default function BotDemoPage() {
  const [messages, setMessages] = useState([]); // {from:'bot'|'user', text, rows?}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);
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

  // session + auto /start
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

  const sendText = (text) => {
    const t = text.trim();
    if (!t || loading) return;
    setMessages((prev) => [...prev, { from: "user", text: t }]);
    setInput("");
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

  // only the latest bot message shows its quick-reply buttons
  const lastBotIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].from === "bot") return i;
    return -1;
  })();

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-light/20 blur-3xl" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-3 py-4 sm:py-8">
        {/* header */}
        <div className="flex items-center justify-between rounded-t-3xl border border-line/70 bg-white px-4 py-3 shadow-soft">
          <a href="/" className="flex items-center gap-2.5" aria-label="Dr Saab AI home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-soft">
              <HeartPulseIcon className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-ink">
                Dr Saab <span className="text-primary">AI</span>
              </span>
              <span className="block text-[11px] text-accent">● live demo</span>
            </span>
          </a>
          <button
            onClick={resetChat}
            className="rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold text-ink/70 ring-1 ring-line transition hover:text-primary"
          >
            Restart
          </button>
        </div>

        {/* messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto border-x border-line/70 bg-cloud/40 px-4 py-5"
          style={{ minHeight: "55vh" }}
        >
          {messages.map((m, i) => (
            <div key={i}>
              <div className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                    m.from === "user"
                      ? "rounded-br-md bg-primary text-white"
                      : "rounded-bl-md bg-white text-ink ring-1 ring-line/60"
                  }`}
                  dangerouslySetInnerHTML={{ __html: mdToHtml(m.text) }}
                />
              </div>

              {/* quick replies under the latest bot message */}
              {m.from === "bot" && i === lastBotIdx && m.rows?.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {m.rows.map((row, r) => (
                    <div key={r} className="flex flex-wrap gap-1.5">
                      {row.map((btn, c) => (
                        <button
                          key={c}
                          onClick={() => sendCallback(btn)}
                          disabled={loading}
                          className="rounded-full border border-primary/30 bg-white px-3.5 py-1.5 text-[13px] font-medium text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 ring-1 ring-line/60">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-ink/40 animate-typing"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendText(input);
          }}
          className="flex items-center gap-2 rounded-b-3xl border border-line/70 bg-white px-3 py-3 shadow-soft"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-full bg-muted px-4 py-2.5 text-[14px] text-ink outline-none ring-1 ring-transparent focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-primary text-white shadow-soft transition hover:bg-primary-dark disabled:opacity-40"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </form>

        <p className="mt-3 text-center text-[11px] text-ink/40">
          Demo only · Dr Saab AI gives general guidance, not medical advice.
        </p>
      </div>
    </main>
  );
}
